# Google Cloud Run Deployment Setup

This guide walks you through deploying the Dynaro backend to Google Cloud Run using GitHub Actions.

## Prerequisites

1. **Google Cloud Project** - Create one at [console.cloud.google.com](https://console.cloud.google.com)
2. **GitHub Repository** - Push this code to GitHub
3. **Google Cloud CLI** - For local testing (optional)

## Step 1: Set up Google Cloud Project

```bash
# Set your project ID
export PROJECT_ID="your-project-id"
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable iam.googleapis.com
```

## Step 2: Create Service Account for GitHub Actions

```bash
# Create service account
gcloud iam service-accounts create github-actions-deployer \
  --display-name="GitHub Actions Deployer"

# Grant Cloud Run Admin role
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:github-actions-deployer@$PROJECT_ID.iam.gserviceaccount.com \
  --role=roles/run.admin

# Grant Service Account User role
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:github-actions-deployer@$PROJECT_ID.iam.gserviceaccount.com \
  --role=roles/iam.serviceAccountUser

# Grant Container Registry Service Agent role (for pushing images)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:github-actions-deployer@$PROJECT_ID.iam.gserviceaccount.com \
  --role=roles/storage.admin
```

## Step 3: Set up Workload Identity Federation (WIF)

```bash
# Create Workload Identity Pool
gcloud iam workload-identity-pools create "github-pool" \
  --project=$PROJECT_ID \
  --location=global \
  --display-name="GitHub Actions"

# Get the pool resource name
WORKLOAD_IDENTITY_POOL_ID=$(gcloud iam workload-identity-pools describe "github-pool" \
  --project=$PROJECT_ID \
  --location=global \
  --format='value(name)')

# Create Workload Identity Provider for GitHub
gcloud iam workload-identity-pools providers create-oidc "github-provider" \
  --project=$PROJECT_ID \
  --location=global \
  --workload-identity-pool=github-pool \
  --display-name="GitHub" \
  --attribute-mapping="google.subject=assertion.sub,assertion.aud=assertion.aud" \
  --issuer-uri="https://token.actions.githubusercontent.com"

# Get the provider resource name
WORKLOAD_IDENTITY_PROVIDER=$(gcloud iam workload-identity-pools providers describe "github-provider" \
  --project=$PROJECT_ID \
  --location=global \
  --workload-identity-pool=github-pool \
  --format='value(name)')

echo "WORKLOAD_IDENTITY_PROVIDER: $WORKLOAD_IDENTITY_PROVIDER"

# Bind GitHub repository to service account
gcloud iam service-accounts add-iam-policy-binding \
  "github-actions-deployer@$PROJECT_ID.iam.gserviceaccount.com" \
  --project=$PROJECT_ID \
  --role=roles/iam.workloadIdentityUser \
  --condition='resource.name=="projects/'$PROJECT_ID'/serviceAccounts/github-actions-deployer@'$PROJECT_ID'.iam.gserviceaccount.com",api.getAttribute("iam.googleapis.com/modifiedTime", ["2024-01-01T00:00:00Z"]) > "2024-01-01T00:00:00Z"' \
  --member=principalSet://iam.googleapis.com/projects/$PROJECT_ID/locations/global/workloadIdentityPools/github-pool/attribute.repository/{GITHUB_ORG}/{GITHUB_REPO}
```

Replace `{GITHUB_ORG}` and `{GITHUB_REPO}` with your actual org and repo name.

## Step 4: Add GitHub Secrets

In your GitHub repository settings, add these secrets:

### Required for Deployment:
- `GCP_PROJECT_ID` - Your Google Cloud Project ID
- `WIF_PROVIDER` - The Workload Identity Provider resource name from Step 3
- `WIF_SERVICE_ACCOUNT` - `github-actions-deployer@{PROJECT_ID}.iam.gserviceaccount.com`

### Required for Backend:
- `PROD_MONGODB_URI` - Production MongoDB connection string (e.g., Atlas)
- `PROD_JWT_SECRET` - Secure JWT secret (generate with: `openssl rand -base64 32`)
- `PROD_REDIS_URL` - Production Redis URL (e.g., Redis Cloud)
- `PROD_ALLOWED_ORIGINS` - Comma-separated list of allowed frontend URLs (e.g., `https://domain.com,https://app.domain.com`)
- `CLOUDINARY_CLOUD_NAME` - Your Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Your Cloudinary API key
- `CLOUDINARY_API_SECRET` - Your Cloudinary API secret

**Example secret generation:**
```bash
# Generate a secure JWT secret
openssl rand -base64 32
```

## Step 5: Deploy

### Automatic (via Git push):
Simply push to `main` branch in `backend/**` path:
```bash
git add .
git commit -m "Deploy backend v1"
git push origin main
```

### Manual (via GitHub Actions):
1. Go to your GitHub repository
2. Click "Actions" tab
3. Select "Build & Deploy Backend to Cloud Run"
4. Click "Run workflow"

## Monitoring

### View deployment logs:
```bash
gcloud run services describe dynaro-backend --region=us-central1

# Stream logs
gcloud run services logs read dynaro-backend --region=us-central1 --limit=50 --follow
```

### View in Cloud Console:
https://console.cloud.google.com/run

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment type | `production` |
| `PORT` | Server port | `4000` |
| `MONGODB_URI` | MongoDB connection | `mongodb+srv://...` |
| `JWT_SECRET` | JWT signing key | (secure random string) |
| `REDIS_URL` | Redis cache URL | `redis://...` |
| `CLOUDINARY_*` | Image upload service | Cloudinary credentials |

## Troubleshooting

### Build fails with permission denied:
- Ensure service account has `Cloud Run Admin` and `Storage Admin` roles

### Deployment fails with image not found:
- Check Container Registry permissions
- Ensure `gcloud auth configure-docker gcr.io` was run

### Environment variables not set:
- Verify secrets are correctly added to GitHub repository settings
- Check secret names match exactly in workflow file

### Health check failing:
- Ensure backend has a `/health` endpoint, or remove HEALTHCHECK from Dockerfile

## Cost Estimation

- **Cloud Run**: ~$0.40/month for 1 min instance (free tier)
- **Container Registry**: ~$0.10 per GB/month for stored images
- **MongoDB Atlas**: Free tier available
- **Redis Cloud**: Free tier available

## Next Steps

1. Set up monitoring alerts
2. Configure custom domain (optional)
3. Set up database backups
4. Configure authentication/authorization
5. Set up staging environment for testing

## Support

For issues or questions:
- Cloud Run docs: https://cloud.google.com/run/docs
- GitHub Actions docs: https://docs.github.com/en/actions
- Dockerfile best practices: https://docs.docker.com/develop/develop-images/dockerfile_best-practices/
