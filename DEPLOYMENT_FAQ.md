# Production Deployment FAQ

## Your Questions Answered

### Q: Can I build Docker image in GitHub and push to Cloud Run?
**A: Yes! ✅** That's exactly what we've set up.

### Architecture Overview
```
┌─────────────────────────────────────────────────────────────┐
│                   YOUR WORKFLOW                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Push code to GitHub (main branch)                      │
│                           ↓                                 │
│  2. GitHub Actions triggers automatically                  │
│                           ↓                                 │
│  3. GitHub builds Docker image                             │
│     - Compiles TypeScript                                  │
│     - Installs dependencies                                │
│     - Creates optimized multi-stage build                  │
│                           ↓                                 │
│  4. Pushes image to Google Container Registry (GCR)        │
│     - URL: gcr.io/{PROJECT_ID}/dynaro-backend:{TAG}       │
│                           ↓                                 │
│  5. Deploys to Google Cloud Run                            │
│     - Auto-scales (0 to N instances)                       │
│     - Sets environment variables                           │
│     - Configures health checks                             │
│                           ↓                                 │
│  6. Service is LIVE                                        │
│     - Public HTTPS URL                                     │
│     - Monitoring & logs enabled                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Key Benefits of This Setup

### ✅ Fully Automated
- No manual Docker commands needed
- No manual Cloud Run deployments
- Just `git push` and it's deployed

### ✅ Secure
- Uses Workload Identity Federation (WIF) - no long-lived keys
- Environment variables injected at runtime (secrets from GitHub)
- Service account with minimal required permissions

### ✅ Cost Effective
- Cloud Run only charges when handling requests
- Free tier: 2M requests/month
- Estimated cost: ~$0.40-$5/month (depending on traffic)

### ✅ Scalable
- Auto-scales from 0 to 10 instances
- Handles traffic spikes automatically
- No server management needed

### ✅ Reliable
- Health checks ensure only healthy instances serve traffic
- Automatic rollback on failed deployments
- Integrated logging and monitoring

## Files Created

### 1. `backend/Dockerfile`
- Multi-stage build (reduces image size)
- Uses Node 18 Alpine (lightweight)
- Non-root user (security)
- Health check configured
- Proper signal handling with dumb-init

### 2. `backend/.dockerignore`
- Excludes unnecessary files from Docker build
- Reduces image size

### 3. `.github/workflows/deploy-backend.yml`
- GitHub Actions workflow
- Triggers on: push to main + path:backend/**
- Steps:
  1. Build Docker image
  2. Push to GCR
  3. Deploy to Cloud Run with env vars
  4. Output service URL

### 4. `DEPLOYMENT.md`
- Full detailed setup guide
- 5 main steps with all commands
- Environment variable reference
- Troubleshooting section

### 5. `DEPLOYMENT_QUICKSTART.md`
- Condensed version for quick setup
- Copy-paste commands
- Quick reference tables

### 6. `DEPLOYMENT_CHECKLIST.md`
- Pre-deployment checklist
- GCP setup checklist
- GitHub setup checklist
- Post-deployment verification

## Next Steps (In Order)

### Step 1: Prepare GCP (10 minutes)
```bash
# Run these commands in your terminal
export PROJECT_ID="your-project-id"

# Create service account
gcloud iam service-accounts create github-actions-deployer

# Grant roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:github-actions-deployer@$PROJECT_ID.iam.gserviceaccount.com \
  --role=roles/run.admin

# ... (see DEPLOYMENT_QUICKSTART.md for full commands)
```

### Step 2: Set up WIF (5 minutes)
```bash
# Create Workload Identity Pool and Provider
gcloud iam workload-identity-pools create "github-pool" ...

# Get the provider resource name (you'll need this)
# Output: projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/providers/github-provider
```

### Step 3: Add GitHub Secrets (5 minutes)
Go to GitHub repo → Settings → Secrets and variables → Actions
Add 9 secrets:
- GCP_PROJECT_ID
- WIF_PROVIDER (from step 2)
- WIF_SERVICE_ACCOUNT
- PROD_MONGODB_URI
- PROD_JWT_SECRET
- PROD_REDIS_URL
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET

### Step 4: Deploy (Automatic)
```bash
# Commit and push
git add .
git commit -m "Add production deployment setup"
git push origin main

# GitHub Actions automatically starts building and deploying!
# Check: GitHub repo → Actions tab → Build & Deploy Backend to Cloud Run
```

## How to Monitor

### Option 1: GitHub Actions
- Go to GitHub repo → Actions tab
- Watch the workflow run in real-time
- See full logs for each step

### Option 2: Google Cloud Console
- Visit https://console.cloud.google.com/run
- Select project
- View dynaro-backend service
- See metrics, logs, deployments

### Option 3: Command Line
```bash
# View service status
gcloud run services describe dynaro-backend --region=us-central1

# View logs (real-time)
gcloud run services logs read dynaro-backend --region=us-central1 --follow

# Get service URL
gcloud run services describe dynaro-backend --region=us-central1 --format='value(status.url)'
```

## Testing After Deployment

```bash
# Get your service URL (from above)
SERVICE_URL="https://dynaro-backend-xxx.run.app"

# Test health endpoint
curl $SERVICE_URL/api/health

# Test with sample request
curl $SERVICE_URL/api/stores

# Check for errors
curl -i $SERVICE_URL/api/invalid-endpoint
```

## What Happens on Git Push

1. **Trigger**: Push to main branch (backend files changed)
2. **Checkout**: GitHub Actions clones your repo
3. **Authenticate**: Uses WIF to get temporary credentials
4. **Build**: Docker build runs in GitHub Actions
   - TypeScript compiled to JavaScript
   - Dependencies installed
   - Multi-stage build creates optimized image
5. **Push**: Image pushed to gcr.io/your-project/dynaro-backend
6. **Deploy**: gcloud CLI deploys to Cloud Run
   - Creates new revision
   - Sets environment variables from secrets
   - Configures health checks
   - Scales to min instances
7. **Done**: Service URL ready, endpoints live

## Storage & Cleanup

### What's stored where:
- **Docker images**: Google Container Registry (gcr.io)
- **Code**: GitHub repo
- **Logs**: Cloud Logging (retained 30 days by default)
- **Running service**: Cloud Run (managed by Google)

### Cost details:
- **GCR storage**: $0.026/GB/month (old images add up, delete unused)
- **Cloud Run**: Free tier 2M requests, then $0.40/million
- **Cloud Logging**: Free tier 50GB/month

### Clean up old images:
```bash
# List images
gcloud container images list --repository=gcr.io/$PROJECT_ID

# Delete old images
gcloud container images delete gcr.io/$PROJECT_ID/dynaro-backend:old-sha
```

## Common Issues & Solutions

### "build fails - TypeScript errors"
→ Fix in code, commit, push again

### "GCP permission denied"
→ Check IAM roles assigned to service account

### "secrets not available"
→ Verify GitHub secret names match workflow file exactly

### "health check keeps failing"
→ Ensure /api/health endpoint works
→ Check backend logs: `gcloud run services logs read dynaro-backend`

### "service won't scale down"
→ Cloud Run maintains min instances. To reduce costs, set `--min-instances=0`

## Did You Know?

✨ **Cold Start**: First request after inactivity might take 5-10s as Cloud Run scales up. This is normal.

✨ **Cost**: With free tier, you can handle ~66,000 requests/day at zero cost. That's plenty for development!

✨ **Auto-HTTPS**: Cloud Run automatically provides HTTPS with valid certificates. No setup needed!

✨ **Custom Domain**: Can map your own domain (example.com) to the Cloud Run service.

✨ **Rollback**: If deployment fails, Cloud Run keeps the previous working version running.

## Comparison: GitHub Actions + Cloud Run vs Alternatives

| Feature | GitHub Actions + Cloud Run | Heroku | DigitalOcean | EC2 |
|---------|---------------------------|--------|--------------|-----|
| Setup time | 20 mins | 5 mins | 30 mins | 1 hour |
| Monthly cost | $0.50-5 | $7-50 | $5-20 | $3-20 |
| Auto-scaling | ✅ Yes | ✅ Yes | ⏳ Limited | ❌ No |
| Server management | ✅ None | ✅ None | ⏳ Limited | ❌ Full |
| CI/CD included | ✅ Yes | ⏳ Basic | ❌ No | ❌ No |
| Cold start | ~5s | ~1-2s | ~1-2s | None |
| Simplicity | ✅ High | ✅ Highest | ⏳ Medium | ❌ Low |

## You're All Set! 🚀

Everything is ready. Just follow DEPLOYMENT_QUICKSTART.md steps 1-4 and you'll have your backend running in production!

Questions? See DEPLOYMENT.md for detailed explanations.
