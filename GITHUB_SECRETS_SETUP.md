# GitHub Secrets Setup Guide

The deployment failed because GitHub Secrets weren't configured. This guide shows exactly how to add them.

## Why This Matters

GitHub Secrets are needed for:
- **GCP Authentication** (WIF credentials)
- **Database Connection** (MongoDB URI)
- **API Keys** (JWT, Redis, Cloudinary)

Without these, the workflow cannot authenticate or access external services.

---

## Step-by-Step: Add GitHub Secrets

### Step 1: Go to Settings

Open your repository: https://github.com/obaidahija/dynaro

Click: **Settings** (top navigation)

### Step 2: Open Secrets Menu

In the left sidebar, click: **Secrets and variables** → **Actions**

### Step 3: Create 10 Secrets

Click **"New repository secret"** for each one:

---

## Secret 1: WIF_PROVIDER

**Name**: `WIF_PROVIDER`

**Value**:
```
projects/91344185751/locations/global/workloadIdentityPools/github-pool/providers/github-provider
```

Click **Add secret**

---

## Secret 2: WIF_SERVICE_ACCOUNT

**Name**: `WIF_SERVICE_ACCOUNT`

**Value**:
```
github-actions-deployer@dynrow.iam.gserviceaccount.com
```

Click **Add secret**

---

## Secret 3: GCP_PROJECT_ID

**Name**: `GCP_PROJECT_ID`

**Value**:
```
dynrow
```

Click **Add secret**

---

## Secret 4: PROD_MONGODB_URI

**Name**: `PROD_MONGODB_URI`

**Value**: Your MongoDB connection string

Example format:
```
mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

Click **Add secret**

---

## Secret 5: PROD_JWT_SECRET

**Name**: `PROD_JWT_SECRET`

**Value**: Generate a random secret

Run this in terminal:
```bash
openssl rand -base64 32
```

Copy the output and paste as the secret value.

Example output:
```
aBc123DefGhIjKlMnOpQrStUvWxYz+/AbCdEfGhIjK=
```

Click **Add secret**

---

## Secret 6: PROD_REDIS_URL

**Name**: `PROD_REDIS_URL`

**Value**: Your Redis connection string

Example format:
```
redis://:[password]@[host]:[port]
redis://:password123@redis.example.com:6379
```

Or if using Redis Cloud:
```
rediss://default:[password]@[host]:[port]
```

Click **Add secret**

---

## Secret 7: CLOUDINARY_CLOUD_NAME

**Name**: `CLOUDINARY_CLOUD_NAME`

**Value**: Your Cloudinary cloud name

Find at: https://cloudinary.com/console (Dashboard)

Click **Add secret**

---

## Secret 8: CLOUDINARY_API_KEY

**Name**: `CLOUDINARY_API_KEY`

**Value**: Your Cloudinary API Key

Find at: https://cloudinary.com/console/settings/api-keys

Click **Add secret**

---

## Secret 9: CLOUDINARY_API_SECRET

**Name**: `CLOUDINARY_API_SECRET`

**Value**: Your Cloudinary API Secret

Find at: https://cloudinary.com/console/settings/api-keys

Click **Add secret**

---

## Secret 10: PROD_ALLOWED_ORIGINS

**Name**: `PROD_ALLOWED_ORIGINS`

**Value**: Comma-separated list of allowed frontend origins

Example for development:
```
http://localhost:3000,http://localhost:3001
```

Example for production:
```
https://display.yourdomain.com,https://dashboard.yourdomain.com
```

Click **Add secret**

---

## Verification

After adding all 10 secrets, you should see:

```
✓ GCP_PROJECT_ID
✓ PROD_JWT_SECRET
✓ PROD_MONGODB_URI
✓ PROD_REDIS_URL
✓ PROD_ALLOWED_ORIGINS
✓ WIF_PROVIDER
✓ WIF_SERVICE_ACCOUNT
✓ CLOUDINARY_API_KEY
✓ CLOUDINARY_API_SECRET
✓ CLOUDINARY_CLOUD_NAME
```

---

## Trigger Deployment

Now that secrets are added, trigger the workflow:

**Option 1: Manual Push**
```bash
# Make a small change
echo "# Updated" >> README.md

# Commit and push
git add README.md
git commit -m "Trigger deployment"
git push origin main
```

**Option 2: Manual Trigger in GitHub**
1. Go to https://github.com/obaidahija/dynaro/actions
2. Click **"Build & Deploy Backend to Cloud Run"** workflow
3. Click **"Run workflow"** button
4. Select **main** branch
5. Click **"Run workflow"**

---

## Monitor Deployment

Once triggered:

1. Go to: https://github.com/obaidahija/dynaro/actions
2. Click the latest workflow run
3. Watch steps complete:
   - ✅ Checkout code
   - ✅ Set up Cloud SDK
   - ✅ Configure Docker for GCR
   - ✅ Build Docker image (2-3 min)
   - ✅ Push to Google Container Registry (1-2 min)
   - ✅ Deploy to Cloud Run (1-2 min)
   - ✅ Output Cloud Run URL

---

## Troubleshooting

### Secret value is wrong
- Delete the secret (click trash icon)
- Re-add with correct value
- Re-run workflow

### Secret name is typo
- The workflow won't find it
- Check for exact match (case-sensitive)
- Delete and recreate with correct name

### Build still fails after adding secrets
- Check logs in GitHub Actions
- View detailed error message
- Common issues:
  - MongoDB URI invalid
  - Redis URL unreachable
  - Cloudinary credentials wrong

### How to check if secrets are working
- Go to Actions workflow run
- Click the step with error
- Look for output like:
  ```
  error: could not connect to mongodb
  error: secret not found: PROD_MONGODB_URI
  ```

---

## Best Practices

✅ **DO:**
- Use strong JWT_SECRET (32+ chars)
- Keep secrets confidential
- Rotate secrets regularly
- Use environment-specific URIs

❌ **DON'T:**
- Commit secrets to git
- Share secrets in Slack/email
- Use same secret in multiple projects
- Store secrets in code

---

## After Deployment ✅

Once the workflow succeeds:

1. Check Cloud Run service URL (printed in workflow output)
2. Test health endpoint:
   ```bash
   curl https://dynaro-backend-xxxxx.run.app/api/health
   ```
3. Verify in Cloud Console:
   - https://console.cloud.google.com/run (project: dynrow)

---

**Status**: Ready for deployment! 🚀

Add the 9 secrets above, then trigger the workflow manually or push to main.
