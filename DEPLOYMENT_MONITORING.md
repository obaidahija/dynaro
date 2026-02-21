# Deployment Monitoring Guide

## ✅ Deployment Started!

Your backend is now deploying to Google Cloud Run. This guide shows how to monitor it.

---

## Real-Time Monitoring

### 1. **GitHub Actions (Recommended)**

**URL**: https://github.com/obaidahija/dynaro/actions

Look for the workflow: **"Build & Deploy Backend to Cloud Run"**

You'll see:
- ✅ Step 1: Checkout code
- ✅ Step 2: Authenticate with GCP (WIF)
- ✅ Step 3: Build Docker image
- ✅ Step 4: Push to Google Container Registry (GCR)
- ✅ Step 5: Deploy to Cloud Run

**Timing**: ~5-10 minutes total
- Build: 2-3 minutes
- Push to GCR: 1-2 minutes
- Deploy to Cloud Run: 1-2 minutes

### 2. **Google Cloud Console**

**URL**: https://console.cloud.google.com/run

1. Make sure project `dynrow` is selected (top left)
2. Click on `dynaro-backend` service
3. View:
   - **Revisions**: See new deployment in progress
   - **Metrics**: CPU, Memory, Request latency
   - **Logs**: Real-time application logs

### 3. **Command Line**

```bash
# Get the service URL (replace PROJECT with "dynrow")
gcloud run services describe dynaro-backend --region=us-central1 --format='value(status.url)'

# View live logs (real-time)
gcloud run services logs read dynaro-backend --region=us-central1 --follow

# Check service status
gcloud run services describe dynaro-backend --region=us-central1
```

---

## Deployment Phases

### Phase 1: Building (GitHub Actions)
- Compiling TypeScript → JavaScript
- Installing node dependencies
- Creating optimized Docker image
- **Status**: Watch GitHub Actions > Deploy workflow

### Phase 2: Pushing to GCR
- Docker image pushed to: `gcr.io/dynrow/dynaro-backend:${COMMIT_SHA}`
- Also tagged as: `gcr.io/dynrow/dynaro-backend:latest`
- **Status**: Check GCR images

### Phase 3: Deploying to Cloud Run
- Creating new revision
- Injecting secrets
- Starting new instances
- Health checks validating
- **Status**: Check Cloud Run revisions

### Phase 4: Live!
- Service is accessible
- Requests being served
- Auto-scaling active
- **Status**: curl the health endpoint

---

## What to Look For

### ✅ Success Indicators

1. **GitHub Actions**
   - All steps show ✅ green checkmarks
   - Workflow duration: ~5-10 minutes

2. **Cloud Run**
   - New revision shows "Ready"
   - Traffic 100% on new revision
   - Health check status: "Passing"

3. **Logs**
   - No error messages
   - Application starts cleanly
   - Health endpoint responds

### ❌ Failure Indicators

1. **GitHub Actions**
   - Red ❌ on build or deploy step
   - Check logs for error message

2. **Cloud Run**
   - Revision stuck on "Deploying"
   - Health check status: "Failing"
   - Previous revision still handling traffic

3. **Logs**
   - `Cannot find module` errors
   - `Connection refused` for MongoDB/Redis
   - `SECRET_NOT_FOUND` errors

---

## Testing the Deployment

Once deployment shows as **Ready**:

### 1. Get the Service URL
```bash
SERVICE_URL=$(gcloud run services describe dynaro-backend --region=us-central1 --format='value(status.url)')
echo $SERVICE_URL
```

### 2. Test Health Endpoint
```bash
curl $SERVICE_URL/api/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-21T10:30:45.123Z",
  "uptime": 12345,
  "environment": "production"
}
```

### 3. Test API Endpoint
```bash
curl $SERVICE_URL/api/stores
```

Should return your stores data (or 200 OK with data array).

### 4. Monitor Real-Time Requests
```bash
gcloud run services logs read dynaro-backend --region=us-central1 --limit=50 --follow
```

---

## Common Issues & Solutions

### Issue: Workflow stuck on "Building"
**Solution**: 
- Check GitHub Actions runner has enough resources
- Wait 10+ minutes for large builds
- Check terminal for error messages

### Issue: Build fails with TypeScript errors
**Solution**:
- Check error in GitHub Actions logs
- Fix the TypeScript error locally
- Commit and push again
- New deployment will auto-trigger

### Issue: Deployment fails with "Image not found"
**Solution**:
- Ensure `backend/Dockerfile` exists in repo
- Check dockerfile syntax: `docker build -t test ./backend`
- Verify GCR registry is enabled

### Issue: Health check failing
**Solution**:
- Check `/api/health` endpoint exists in code
- View logs: `gcloud run services logs read dynaro-backend --limit=100`
- Verify backend is starting correctly
- Check environment variables set correctly

### Issue: Environment variables not working
**Solution**:
- Verify GitHub secrets added (9 total)
- Check secret names match exactly (case-sensitive)
- Re-run workflow after adding secrets: push dummy commit
- View deployment logs to confirm env vars loaded

### Issue: MongoDB/Redis connection errors
**Solution**:
- Verify `PROD_MONGODB_URI` and `PROD_REDIS_URL` are correct
- Test connections locally first
- Check MongoDB/Redis server is running and accessible
- Ensure firewall allows Cloud Run IP ranges

---

## Monitoring Costs

Cloud Run usage is billed by:
- **Requests**: First 2M requests/month free
- **Memory**: vCPU-seconds (0.5 vCPU, 512MB)
- **Duration**: Your service configuration (3600s = 1 hour timeout)

**Estimated Monthly Cost** (production):
- Free tier: 2M requests/month
- Low traffic (<66k/day): $0.50-2
- Medium traffic (100k+/day): $5-20

---

## Post-Deployment Checklist

- [ ] GitHub Actions workflow shows ✅ all green
- [ ] Cloud Run service shows "Ready"
- [ ] Health endpoint returns 200 OK
- [ ] API endpoint returns expected data
- [ ] Logs show no errors
- [ ] Can access via service URL in browser
- [ ] Monitoring dashboard shows traffic

---

## Rollback (If Needed)

If deployment fails or has issues:

```bash
# View previous revision
gcloud run services describe dynaro-backend --region=us-central1

# Rollback to previous revision
gcloud run services update-traffic dynaro-backend --region=us-central1 --to-revisions PREV_REVISION_ID=100

# Or delete the bad revision
gcloud run revisions delete REVISION_ID --region=us-central1
```

---

## Next Steps

1. **Monitor deployment** (5-10 minutes)
2. **Verify service is live** (curl health endpoint)
3. **Check logs for errors** (if any)
4. **Set up monitoring alerts** (optional)
5. **Configure custom domain** (optional)

---

## Support Resources

- [Google Cloud Run Docs](https://cloud.google.com/run/docs)
- [Troubleshooting Guide](./DEPLOYMENT.md#troubleshooting)
- [GitHub Actions Logs](https://github.com/obaidahija/dynaro/actions)
- [Cloud Console](https://console.cloud.google.com/run)

---

**Deployment started**: 2026-02-21  
**Status**: In Progress ⏳  
**Expected completion**: 5-10 minutes  

Check back here for updates!
