# Deployment Checklist

## Pre-Deployment

- [ ] Ensure `backend/src/server.ts` exports health endpoint at `/health`
- [ ] All environment variables in `.env.example` are documented
- [ ] Backend builds successfully locally: `npm run build`
- [ ] No hardcoded credentials in code
- [ ] Database migrations tested

## Google Cloud Setup

- [ ] Create GCP Project
- [ ] Enable Cloud Run, Cloud Build, Artifact Registry APIs
- [ ] Create service account for GitHub Actions
- [ ] Set up Workload Identity Federation (WIF)
- [ ] Grant necessary IAM roles to service account
- [ ] Note down WIF Provider resource name

## GitHub Repository Setup

- [ ] Fork/push code to GitHub
- [ ] Add GitHub Secrets:
  - [ ] `GCP_PROJECT_ID`
  - [ ] `WIF_PROVIDER`
  - [ ] `WIF_SERVICE_ACCOUNT`
  - [ ] `PROD_MONGODB_URI`
  - [ ] `PROD_JWT_SECRET`
  - [ ] `PROD_REDIS_URL`
  - [ ] `CLOUDINARY_CLOUD_NAME`
  - [ ] `CLOUDINARY_API_KEY`
  - [ ] `CLOUDINARY_API_SECRET`

## Infrastructure Requirements

- [ ] MongoDB (Atlas or self-managed) - connection string tested
- [ ] Redis (Redis Cloud or self-managed) - connection string tested
- [ ] Cloudinary account (for image uploads)
- [ ] SSL certificate (auto-provided by Cloud Run)

## Deployment Process

1. **Push to main branch:**
   ```bash
   git add .
   git commit -m "Add production deployment files"
   git push origin main
   ```

2. **GitHub Actions will:**
   - Build Docker image
   - Push to Google Container Registry (GCR)
   - Deploy to Cloud Run with environment variables

3. **Verify deployment:**
   - Check GitHub Actions workflow logs
   - Visit Cloud Run service URL
   - Test API endpoints

## Post-Deployment

- [ ] Test health endpoint: `GET /health`
- [ ] Test API with production endpoints
- [ ] Monitor logs in Cloud Console
- [ ] Set up alerting for errors
- [ ] Configure custom domain (optional)
- [ ] Enable HTTPS (auto in Cloud Run)
- [ ] Set up database backups
- [ ] Configure scaling policies (min/max instances)

## Monitoring & Maintenance

- [ ] Set up Cloud Run alerts for high error rate
- [ ] Monitor memory/CPU usage
- [ ] Review logs regularly
- [ ] Keep dependencies updated
- [ ] Plan disaster recovery strategy
