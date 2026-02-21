# ALLOWED_ORIGINS Configuration Guide

## What is ALLOWED_ORIGINS?

`ALLOWED_ORIGINS` is a security setting that controls which frontend domains can make API requests to your backend. This prevents **Cross-Origin Resource Sharing (CORS)** attacks.

## Why Move it to a Secret?

- **Security**: Different values for development vs production
- **Flexibility**: Change allowed domains without redeploying code
- **Environment-specific**: Dev might allow localhost, production needs only your domain

## Production Example

If your production setup is:
- **Display App**: `https://display.yourdomain.com`
- **Dashboard App**: `https://dashboard.yourdomain.com`

Set Var `PROD_ALLOWED_ORIGINS` to:
```
https://display.yourdomain.com,https://dashboard.yourdomain.com
```

## Development Example

For local development with frontend apps on ports 3000 and 3001:
```
http://localhost:3000,http://localhost:3001
```

## Adding the Secret

1. Go to: https://github.com/obaidahija/dynaro/settings/secrets/actions

2. Click **"New repository secret"**

3. **Name**: `PROD_ALLOWED_ORIGINS`

4. **Value**: Your comma-separated list of allowed origins

   **Examples:**

   ```
   # Single origin
   https://example.com

   # Multiple origins
   https://example.com,https://www.example.com,https://app.example.com

   # Development
   http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000

   # Staging + Production
   https://staging.example.com,https://example.com,https://www.example.com
   ```

5. Click **Add secret**

## How It Works

When you deploy:

1. GitHub Actions reads the `PROD_ALLOWED_ORIGINS` secret
2. Passes it to Cloud Run as environment variable `ALLOWED_ORIGINS`
3. Your backend uses it to configure CORS middleware

**In your backend code** (server.ts):
```typescript
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://localhost:3001'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  }
}));
```

## Testing

After deploying, test that CORS works:

```bash
# From an allowed origin, this works
curl -H "Origin: https://example.com" \
  https://dynaro-backend-xxx.run.app/api/health

# From a disallowed origin, this fails
curl -H "Origin: https://bad-domain.com" \
  https://dynaro-backend-xxx.run.app/api/health
```

## Common Issues

### ❌ "CORS error: origin not allowed"
- The frontend origin is not in `PROD_ALLOWED_ORIGINS`
- Add it to the secret and redeploy

### ❌ "My local development frontend can't call the API"
- Localhost is not in production `PROD_ALLOWED_ORIGINS`
- Use the development secret list instead
- Or run frontend and backend both locally

### ✅ "I want to allow all origins temporarily"
- Set `PROD_ALLOWED_ORIGINS` to just `*`
- ⚠️ This is insecure! Only for development!
- Revert to specific domains for production

## Production Best Practices

✅ **DO:**
- Use HTTPS URLs only (`https://`, not `http://`)
- List specific domains (no wildcards)
- Update when adding new frontend domains
- Use different secrets for staging/production

❌ **DON'T:**
- Use `*` (wildcard) in production
- Include `http://` URLs in production (use `https://`)
- Include localhost in production
- Share secrets across environments

## Update ALLOWED_ORIGINS

If you need to add a new frontend domain:

1. Go to: https://github.com/obaidahija/dynaro/settings/secrets/actions
2. Find `PROD_ALLOWED_ORIGINS`
3. Click the pen icon to edit
4. Add the new domain to the comma-separated list
5. Click **Update secret**
6. Push a commit to main to trigger redeployment:
   ```bash
   git commit --allow-empty -m "Update ALLOWED_ORIGINS configuration"
   git push origin main
   ```

The new deployment will pick up the updated secret automatically!

## Reference

- [CORS on MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Express CORS Package](https://www.npmjs.com/package/cors)
- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions)
