# GitHub Pages Deployment

This workflow automatically deploys the frontend to GitHub Pages.

## Setup Instructions

### 1. Enable GitHub Pages

1. Go to repository **Settings**
2. Navigate to **Pages** (left sidebar)
3. Under **Source**, select:
   - Source: **GitHub Actions**
4. Click **Save**

### 2. Configure Backend URL (Optional)

If your backend is hosted elsewhere, update the WebSocket URL:

**Edit `frontend/app-premium.js`:**
```javascript
// Change from:
const CONFIG = {
    WS_URL: 'ws://localhost:8080/ws',
    // ...
}

// To:
const CONFIG = {
    WS_URL: 'wss://your-backend.com/ws',  // Your production backend
    // ...
}
```

Or use environment-based config:
```javascript
const CONFIG = {
    WS_URL: window.location.hostname === 'localhost' 
        ? 'ws://localhost:8080/ws'
        : 'wss://your-backend.com/ws',
    // ...
}
```

### 3. Trigger Deployment

**Automatic:**
- Push to `main` branch
- Workflow runs automatically

**Manual:**
1. Go to **Actions** tab
2. Select **Deploy Frontend to GitHub Pages**
3. Click **Run workflow**
4. Select branch: `main`
5. Click **Run workflow**

### 4. Access Your Site

After deployment completes:
- URL: `https://YOUR_USERNAME.github.io/YOUR_REPO/`
- Example: `https://rootkei.github.io/fluent-talk/`

## Workflow Details

### Permissions
- `contents: read` - Read repository files
- `pages: write` - Deploy to GitHub Pages
- `id-token: write` - Required for Pages deployment

### Steps
1. **Checkout** - Get repository code
2. **Setup Pages** - Configure GitHub Pages
3. **Prepare files** - Copy frontend to `_site/`
4. **Upload artifact** - Package for deployment
5. **Deploy** - Publish to GitHub Pages

### Files Deployed
```
frontend/
├── index.html
├── app-premium.js
└── assets/
    ├── css/
    └── js/
```

## Custom Domain (Optional)

### Add Custom Domain

1. Go to **Settings** → **Pages**
2. Under **Custom domain**, enter: `yourdomain.com`
3. Click **Save**
4. Add DNS records at your domain provider:
   ```
   Type: CNAME
   Name: www
   Value: YOUR_USERNAME.github.io
   ```

### Update Workflow

Add custom domain file:
```yaml
- name: Add CNAME
  run: echo "yourdomain.com" > _site/CNAME
```

## Troubleshooting

### Deployment Fails

**Check:**
1. GitHub Pages is enabled in Settings
2. Source is set to "GitHub Actions"
3. Workflow has proper permissions
4. No syntax errors in workflow file

### Site Not Loading

**Check:**
1. Deployment completed successfully
2. URL is correct (username/repo)
3. Files are in `frontend/` directory
4. No 404 errors in browser console

### Backend Connection Fails

**Update backend URL:**
1. Edit `app-premium.js`
2. Change `WS_URL` to production backend
3. Commit and push
4. Wait for redeployment

## Monitoring

### View Deployments

1. Go to **Actions** tab
2. Click on workflow run
3. View deployment logs
4. Check deployment URL

### Rollback

1. Go to **Actions**
2. Find previous successful deployment
3. Click **Re-run all jobs**

## Notes

- Deployment takes ~1-2 minutes
- Changes auto-deploy on push to `main`
- `.nojekyll` prevents Jekyll processing
- Static files only (no server-side code)

## Security

- No sensitive data in frontend code
- Backend URL should use HTTPS/WSS
- API keys should be in backend only
- CORS must be configured on backend

## Performance

- GitHub Pages uses CDN
- Fast global delivery
- Free SSL certificate
- 100GB bandwidth/month (soft limit)

## Support

For issues:
1. Check workflow logs
2. Verify GitHub Pages settings
3. Test locally first
4. Check browser console for errors
