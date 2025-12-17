# Render.com Deployment Guide

Complete guide to deploy English Voice Chat backend to Render.com - **100% Free!**

## 🎯 Why Render?

- ✅ **Completely FREE** - No credit card required
- ✅ **Easy Setup** - Web UI, no CLI needed
- ✅ **Auto-deploy** - Push to GitHub = auto deploy
- ✅ **Free SSL** - HTTPS included
- ✅ **750 hours/month** - Enough for personal projects
- ✅ **512 MB RAM** - Perfect for Go backend

## 🚀 Quick Start (5 Minutes)

### Step 1: Create Render Account

1. Go to: https://render.com
2. Click "Get Started"
3. Sign up with GitHub (recommended)
4. No credit card needed!

### Step 2: Create Web Service

1. **Dashboard** → Click "New +"
2. Select **"Web Service"**
3. Connect your GitHub repository: `Rootkei/fluent-talk`
4. Click "Connect"

### Step 3: Configure Service

**Basic Settings:**
```
Name: english-voice-chat-backend
Region: Oregon (US West) or Frankfurt (EU)
Branch: main
Root Directory: backend
```

**Build & Deploy:**
```
Runtime: Go
Build Command: go build -o server cmd/server/main.go
Start Command: ./server
```

**Instance Type:**
```
Free (512 MB RAM, Shared CPU)
```

### Step 4: Environment Variables

Click "Advanced" → Add Environment Variables:

```
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
PORT=10000
```

**Important:** Render uses port `10000` by default!

### Step 5: Deploy

1. Click **"Create Web Service"**
2. Wait 2-3 minutes for deployment
3. Get your URL: `https://your-app.onrender.com`

## ✅ Done! That's It!

Your backend is now live at:
```
https://your-app.onrender.com
```

## 🔧 Update Backend Code for Render

### Fix Port Configuration

**Edit `backend/main.go`:**

```go
// Get port from environment (Render uses PORT env var)
port := os.Getenv("PORT")
if port == "" {
    port = "8080" // Default for local development
}

log.Printf("[INFO] Server starting on port %s", port)
log.Fatal(http.ListenAndServe(":"+port, nil))
```

This makes it work on both:
- Local: `localhost:8080`
- Render: `your-app.onrender.com:10000` (handled automatically)

## 🌐 Update Frontend

**Edit `frontend/app-premium.js`:**

```javascript
const CONFIG = {
    WS_URL: window.location.hostname === 'localhost'
        ? 'ws://localhost:8080/ws'
        : 'wss://your-app.onrender.com/ws',  // Your Render URL
    BACKEND_URL: window.location.hostname === 'localhost'
        ? 'http://localhost:8080'
        : 'https://your-app.onrender.com',
    // ... rest of config
}
```

## 📝 Auto-Deploy Setup

**Already configured!** Every push to `main` branch will:
1. Trigger automatic build
2. Run tests (if any)
3. Deploy new version
4. Zero downtime

**To deploy changes:**
```bash
git add .
git commit -m "Update backend"
git push origin main
# Render auto-deploys in ~2 minutes
```

## ⚠️ Free Tier Limitations

### Auto-Sleep
- **Sleeps after 15 minutes** of inactivity
- **Cold start:** ~5-10 seconds on first request
- **Solution:** Use a cron job to ping every 14 minutes (optional)

### Keep-Alive Service (Optional)

**Use cron-job.org:**
1. Go to https://cron-job.org
2. Create free account
3. Add job:
   - URL: `https://your-app.onrender.com/health`
   - Interval: Every 14 minutes
4. Your service stays awake!

### Resource Limits
- 512 MB RAM
- Shared CPU
- 750 hours/month (31 days = 744 hours)
- Good for: Development, demos, low-traffic apps

## 🔍 Monitoring

### View Logs
1. Go to your service dashboard
2. Click "Logs" tab
3. See real-time logs

### Check Status
1. Dashboard shows:
   - Build status
   - Deploy status
   - Last deploy time
   - Service health

### Metrics
- Request count
- Response times
- Error rates
- Memory usage

## 🐛 Troubleshooting

### Build Fails

**Check:**
1. `go.mod` and `go.sum` exist in `backend/`
2. Build command is correct
3. All dependencies available
4. Go version compatible

**View build logs:**
- Dashboard → Logs → Build logs

### Service Won't Start

**Common issues:**
1. **Port mismatch** - Use `PORT` env var
2. **Missing env vars** - Check `GROQ_API_KEY`
3. **Path issues** - Verify root directory is `backend`

**Fix:**
```go
// Always use PORT from environment
port := os.Getenv("PORT")
if port == "" {
    port = "8080"
}
```

### WebSocket Connection Fails

**Check:**
1. Using `wss://` (not `ws://`)
2. CORS configured for frontend domain
3. WebSocket upgrade headers allowed

**CORS fix in `main.go`:**
```go
allowedOrigins := []string{
    "http://localhost:5500",
    "https://rootkei.github.io",  // GitHub Pages
}
```

### 502 Bad Gateway

**Causes:**
- Service crashed
- Out of memory
- Long startup time

**Solutions:**
1. Check logs for errors
2. Reduce memory usage
3. Add health check endpoint

## 📊 render.yaml (Optional)

Create `render.yaml` in root for infrastructure as code:

```yaml
services:
  - type: web
    name: english-voice-chat-backend
    runtime: go
    buildCommand: cd backend && go build -o server cmd/server/main.go
    startCommand: cd backend && ./server
    envVars:
      - key: GROQ_API_KEY
        sync: false
      - key: GROQ_MODEL
        value: llama-3.3-70b-versatile
      - key: PORT
        value: 10000
    plan: free
```

## 🎯 Production Checklist

- [ ] Render account created
- [ ] Service deployed successfully
- [ ] Environment variables set
- [ ] PORT env var used in code
- [ ] Frontend updated with Render URL
- [ ] CORS configured
- [ ] WebSocket tested
- [ ] Health check endpoint working
- [ ] Logs monitored
- [ ] Auto-deploy enabled
- [ ] Keep-alive configured (optional)

## 💰 Upgrade Options

**If you need more:**

**Starter Plan ($7/month):**
- No sleep
- 512 MB RAM
- Dedicated resources
- Better performance

**Standard Plan ($25/month):**
- 2 GB RAM
- More CPU
- Production-ready

**For now, FREE tier is perfect! 🎉**

## 🔗 Useful Links

- [Render Dashboard](https://dashboard.render.com)
- [Render Docs](https://render.com/docs)
- [Go Deployment Guide](https://render.com/docs/deploy-go)
- [Environment Variables](https://render.com/docs/environment-variables)

## 📞 Support

- [Render Community](https://community.render.com)
- [Status Page](https://status.render.com)
- [Email Support](mailto:support@render.com)

---

**Ready to deploy! 🚀**

**Total setup time: ~5 minutes**
**Cost: $0 (FREE forever)**
