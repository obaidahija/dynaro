# Deployment Status - Live Monitoring

## 🚀 Deployment Started!

**Triggered**: Now  
**Branch**: main  
**Commit**: All GitHub secrets configured  
**Expected Duration**: 5-10 minutes

---

## Live Monitoring Links

### 📊 **GitHub Actions** (Primary)
👉 https://github.com/obaidahija/dynaro/actions

Watch the workflow run in real-time:
- ✅ Checkout code
- ✅ Set up Cloud SDK
- ✅ Configure Docker for GCR
- ⏳ Build Docker image (2-3 min)
- ⏳ Push to GCR (1-2 min)
- ⏳ Deploy to Cloud Run (1-2 min)
- ⏳ Output service URL

### 🔵 **Google Cloud Console**
👉 https://console.cloud.google.com/run?project=dynrow

Select project `dynrow` and view:
- **dynaro-backend** service
- Live revision deployments
- Real-time metrics (CPU, Memory, Requests)
- Application logs

### 💻 **Command Line Monitoring**

View live logs:
```bash
gcloud run services logs read dynaro-backend --region=us-central1 --follow
```

Check service status:
```bash
gcloud run services describe dynaro-backend --region=us-central1
```

Get the service URL:
```bash
gcloud run services describe dynaro-backend --region=us-central1 --format='value(status.url)'
```

---

## Deployment Phases (Timeline)

### Phase 1: Building (2-3 minutes)
- TypeScript compilation
- Dependency installation (npm ci)
- Docker image creation

**Status**: Check GitHub Actions for build progress

### Phase 2: Pushing to GCR (1-2 minutes)
- Docker image pushed to gcr.io/dynrow/dynaro-backend
- Tagged with commit SHA and `latest`

**Status**: Check GitHub Actions "Push to Google Container Registry" step

### Phase 3: Deploying to Cloud Run (1-2 minutes)
- New Cloud Run revision created
- Environment variables injected from secrets
- Health checks running
- Scaling to min instances

**Status**: Check Cloud Console or `gcloud run services describe`

### Phase 4: Live! ✅
- Service is accessible via public HTTPS URL
- Health endpoint responding
- Auto-scaling enabled

**Status**: Test with `curl` or browser

---

## Testing After Deployment

Once you see "✅ Ready" in Cloud Console:

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
  "timestamp": "2026-02-21T14:30:45.123Z",
  "uptime": 12345,
  "environment": "production"
}
```

### 3. Test CORS (from browser)
Open browser console from one of your allowed origins and try:
```javascript
fetch('https://dynaro-backend-xxx.run.app/api/health')
  .then(r => r.json())
  .then(d => console.log(d))
```

Should see the health check response if ALLOWED_ORIGINS is correct.

### 4. Test API Endpoints
```bash
# Get stores
curl $SERVICE_URL/api/stores

# Get menus
curl $SERVICE_URL/api/menu
```

---

## What Happens if It Fails

### Build fails with TypeScript errors
- Check error message in GitHub Actions
- Fix the code locally
- Commit and push again
- Workflow auto-retriggers

### Push fails with authentication error
- Service account permissions might be missing
- Run: `gcloud projects get-iam-policy dynrow --flatten="bindings[].members" --filter="bindings.members:github-actions-deployer"`
- Verify roles include `artifactregistry.admin` and `run.admin`

### Deploy fails with missing environment variables
- Check GitHub Secrets are added (10 total)
- Verify secret names match exactly (case-sensitive)
- Re-add any missing secrets
- Trigger workflow again

### Service stuck on "Deploying"
- Health check might be failing
- Check logs: `gcloud run services logs read dynaro-backend`
- Verify `/api/health` endpoint exists in backend
- Check MONGODB_URI and REDIS_URL are correct

### CORS errors when calling API
- Check PROD_ALLOWED_ORIGINS secret value
- Must be comma-separated: `https://domain1.com,https://domain2.com`
- Frontend origin must be in the list exactly

---

## Key URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **GitHub Actions** | https://github.com/obaidahija/dynaro/actions | Monitor build & deploy |
| **Cloud Console** | https://console.cloud.google.com/run?project=dynrow | View Cloud Run service |
| **Service** | TBD (will be in Actions output) | Your live API |
| **Health Check** | `{SERVICE_URL}/api/health` | Test if running |
| **Logs** | `gcloud logs read` | Debug issues |

---

## Success Checklist ✅

- [ ] GitHub Actions workflow shows all ✅ green checks
- [ ] No errors in build or deploy steps
- [ ] Cloud Run service shows "Ready"
- [ ] New revision is "100% traffic"
- [ ] Health endpoint returns 200 OK
- [ ] Can call API from allowed origins
- [ ] No CORS errors in browser console
- [ ] Service URL is accessible via HTTPS

---

## Next Steps After Success

1. **Update frontend** to use new service URL
   - Display app: Update API base URL
   - Dashboard app: Update API base URL

2. **Test all features** in production
   - Menu display
   - Playlist management
   - Image uploads (Cloudinary)
   - Authentication

3. **Set up monitoring alerts** (optional)
   - Error rate threshold
   - Latency alerts
   - Health check failures

4. **Configure custom domain** (optional)
   - Map your domain to Cloud Run
   - Set up DNS records

---

## Support

- 📖 Full guide: [DEPLOYMENT.md](DEPLOYMENT.md)
- ✅ Checklist: [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
- ⚡ Quick start: [DEPLOYMENT_QUICKSTART.md](DEPLOYMENT_QUICKSTART.md)
- 🔒 CORS guide: [ALLOWED_ORIGINS_GUIDE.md](ALLOWED_ORIGINS_GUIDE.md)

---

**Last Updated**: 2026-02-21  
**Status**: 🟡 Deploying...  
**Check GitHub Actions for live updates!** 👀
