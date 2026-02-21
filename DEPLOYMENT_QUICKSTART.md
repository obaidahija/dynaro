# Backend Production Deployment - Quick Start

## What's Been Created

✅ **Dockerfile** - Multi-stage build for optimized production image
✅ **.dockerignore** - Excludes unnecessary files from image
✅ **GitHub Actions Workflow** - Automated CI/CD pipeline (`.github/workflows/deploy-backend.yml`)
✅ **Deployment Guide** - Detailed setup instructions (DEPLOYMENT.md)
✅ **Checklist** - Step-by-step verification (DEPLOYMENT_CHECKLIST.md)

## Quick Setup (5 minutes)

### 1. Set Google Cloud Project ID
```bash
export PROJECT_ID="your-gcp-project-id"
gcloud config set project $PROJECT_ID
```

### 2. Enable Required APIs
```bash
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com iam.googleapis.com
```

### 3. Create Service Account
```bash
gcloud iam service-accounts create github-actions-deployer --display-name="GitHub Actions Deployer"
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:github-actions-deployer@$PROJECT_ID.iam.gserviceaccount.com \
  --role=roles/run.admin
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:github-actions-deployer@$PROJECT_ID.iam.gserviceaccount.com \
  --role=roles/iam.serviceAccountUser
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:github-actions-deployer@$PROJECT_ID.iam.gserviceaccount.com \
  --role=roles/storage.admin
```

### 4. Set Up Workload Identity Federation
```bash
# Create pool and provider
gcloud iam workload-identity-pools create "github-pool" \
  --project=$PROJECT_ID --location=global --display-name="GitHub Actions"

gcloud iam workload-identity-pools providers create-oidc "github-provider" \
  --project=$PROJECT_ID --location=global --workload-identity-pool=github-pool \
  --display-name="GitHub" --attribute-mapping="google.subject=assertion.sub,assertion.aud=assertion.aud" \
  --issuer-uri="https://token.actions.githubusercontent.com"

# Get provider resource name
gcloud iam workload-identity-pools providers describe "github-provider" \
  --project=$PROJECT_ID --location=global --workload-identity-pool=github-pool \
  --format='value(name)'
```

### 5. Bind GitHub Repo to Service Account
```bash
# Replace {GITHUB_ORG}/{GITHUB_REPO} with your actual values
gcloud iam service-accounts add-iam-policy-binding \
  github-actions-deployer@$PROJECT_ID.iam.gserviceaccount.com \
  --project=$PROJECT_ID \
  --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/$PROJECT_ID/locations/global/workloadIdentityPools/github-pool/attribute.repository/{GITHUB_ORG}/{GITHUB_REPO}"
```

### 6. Add GitHub Secrets
In your GitHub repo Settings → Secrets and variables → Actions, add:

| Secret Name | Value |
|-------------|-------|
| `GCP_PROJECT_ID` | Your project ID |
| `WIF_PROVIDER` | From step 4 (resource name) |
| `WIF_SERVICE_ACCOUNT` | `github-actions-deployer@{PROJECT_ID}.iam.gserviceaccount.com` |
| `PROD_MONGODB_URI` | MongoDB connection string |
| `PROD_JWT_SECRET` | `openssl rand -base64 32` |
| `PROD_REDIS_URL` | Redis connection string |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary name |
| `CLOUDINARY_API_KEY` | Your Cloudinary key |
| `CLOUDINARY_API_SECRET` | Your Cloudinary secret |

### 7. Deploy
```bash
# Commit and push
git add .
git commit -m "Add production deployment files"
git push origin main
```

GitHub Actions will automatically:
1. Build Docker image
2. Push to Google Container Registry
3. Deploy to Cloud Run

## Architecture

```
GitHub Repository
    ↓
GitHub Actions (on push to main)
    ↓
Build Docker image from Dockerfile
    ↓
Push to Google Container Registry (GCR)
    ↓
Deploy to Cloud Run (managed containers)
    ↓
Service URL: https://dynaro-backend-{random}.run.app
```

## Environment Setup

**Database Options:**
- MongoDB Atlas (Cloud) - https://www.mongodb.com/cloud/atlas
- Self-managed MongoDB

**Cache Options:**
- Redis Cloud (Cloud) - https://redis.com/cloud
- Google Cloud Memorystore for Redis (if staying in GCP)

**Image Upload:**
- Cloudinary (already configured) - https://cloudinary.com

## Cost Summary

| Service | Free Tier | Cost |
|---------|-----------|------|
| Cloud Run | 2M requests/month | $0.00-$0.40/mo |
| Container Registry | 0.5 GB storage | $0.026/GB/month |
| MongoDB Atlas | 512MB | Free |
| Redis Cloud | 30MB | Free |
| **Total** | | **~$0.50/month** |

## Verify Deployment

```bash
# Get Cloud Run service URL
gcloud run services describe dynaro-backend --region=us-central1 --format='value(status.url)'

# Test health endpoint
curl https://your-service-url/api/health

# View logs
gcloud run services logs read dynaro-backend --region=us-central1 --limit=50
```

## Next Steps

1. ✅ Complete GitHub secrets setup
2. ✅ Push to main branch
3. ⏳ Wait for GitHub Actions to complete (5-10 mins)
4. ⏳ Verify service is running
5. ⏳ Test API endpoints
6. ⏳ Configure domain (optional)
7. ⏳ Set up monitoring alerts

## Troubleshooting

**Workflow fails during build:**
- Check Docker syntax in Dockerfile
- Ensure `npm run build` works locally

**Permission denied errors:**
- Verify IAM roles are correctly assigned
- Check WIF configuration

**Environment variables not set:**
- Verify secret names match workflow exactly
- Check GitHub repo settings → Secrets

**Health check failing:**
- Ensure `/api/health` endpoint is working
- Check container logs in Cloud Console

## Additional Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Docker Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workload Identity Federation](https://cloud.google.com/iam/docs/workload-identity-federation)

## Support

For detailed information, see:
- `DEPLOYMENT.md` - Full setup guide
- `DEPLOYMENT_CHECKLIST.md` - Complete checklist
- `.github/workflows/deploy-backend.yml` - Workflow configuration
