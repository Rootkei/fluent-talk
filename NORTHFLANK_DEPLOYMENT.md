# Northflank Deployment Guide

Complete guide to deploy the English Voice Chat backend to Northflank.

## 🚀 Quick Start

### Prerequisites
- Northflank account (https://app.northflank.com)
- GitHub repository connected
- Groq API key

### Deployment Steps

## 1. Create New Service

1. **Login to Northflank**
   - Go to https://app.northflank.com
   - Login or create account

2. **Create Project**
   - Click "Create Project"
   - Name: `english-voice-chat`
   - Click "Create"

3. **Add Service**
   - Click "Add Service"
   - Select "Combined Service"
   - Choose "Git Repository"

## 2. Configure Repository

1. **Connect GitHub**
   - Select "GitHub"
   - Authorize Northflank
   - Choose repository: `Rootkei/fluent-talk`
   - Branch: `main`

2. **Build Settings**
   - Build Type: **Dockerfile** or **Buildpack**
   - Context: `backend`
   - Dockerfile path: `backend/Dockerfile` (if using Dockerfile)

## 3. Environment Variables

Add these environment variables:

```
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
PORT=8080
```

**How to add:**
1. Go to "Environment" tab
2. Click "Add Variable"
3. Add each variable
4. Mark `GROQ_API_KEY` as **Secret**

## 4. Port Configuration

1. **Expose Port**
   - Port: `8080`
   - Protocol: `HTTP`
   - Public: **Yes**

2. **Health Check** (Optional)
   - Path: `/health`
   - Port: `8080`

## 5. Deploy

1. Click "Deploy Service"
2. Wait for build (~2-3 minutes)
3. Get your deployment URL

## 📦 Dockerfile (Recommended)

Create `backend/Dockerfile`:

```dockerfile
# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build binary
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o server cmd/server/main.go

# Runtime stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy binary from builder
COPY --from=builder /app/server .

# Expose port
EXPOSE 8080

# Run
CMD ["./server"]
```

## 🔧 Alternative: Buildpack

If not using Dockerfile, Northflank will auto-detect Go:

**Requirements:**
- `go.mod` in root or backend directory
- Main file in `cmd/server/main.go`

**Build Command:**
```bash
go build -o server cmd/server/main.go
```

**Start Command:**
```bash
./server
```

## 🌐 Update Frontend

After deployment, update frontend to use Northflank backend:

**Edit `frontend/app-premium.js`:**

```javascript
const CONFIG = {
    WS_URL: window.location.hostname === 'localhost'
        ? 'ws://localhost:8080/ws'
        : 'wss://your-app.northflank.app/ws',  // Your Northflank URL
    BACKEND_URL: window.location.hostname === 'localhost'
        ? 'http://localhost:8080'
        : 'https://your-app.northflank.app',
    // ...
}
```

## 🔒 CORS Configuration

Ensure backend allows your frontend domain:

**In `main.go` or CORS middleware:**

```go
allowedOrigins := []string{
    "http://localhost:5500",
    "https://rootkei.github.io",  // GitHub Pages
    "https://your-custom-domain.com",
}
```

## 📊 Monitoring

### View Logs
1. Go to service dashboard
2. Click "Logs" tab
3. View real-time logs

### Metrics
1. Click "Metrics" tab
2. View CPU, Memory, Network usage

### Alerts (Optional)
1. Click "Alerts" tab
2. Set up alerts for downtime, high CPU, etc.

## 💰 Pricing

**Free Tier:**
- 2 services
- 0.2 vCPU
- 512 MB RAM
- Perfect for testing!

**Paid Plans:**
- Start at $10/month
- More resources
- Custom domains
- Better performance

## 🔄 Auto-Deploy

**Enable auto-deploy on push:**

1. Go to "Git" tab
2. Enable "Auto-deploy"
3. Select branch: `main`
4. Every push triggers deployment

## 🌍 Custom Domain

1. **Add Domain**
   - Go to "Domains" tab
   - Click "Add Domain"
   - Enter: `api.yourdomain.com`

2. **DNS Configuration**
   ```
   Type: CNAME
   Name: api
   Value: your-app.northflank.app
   ```

3. **SSL Certificate**
   - Auto-provisioned by Northflank
   - HTTPS enabled automatically

## 🐛 Troubleshooting

### Build Fails

**Check:**
- Go version in `go.mod`
- All dependencies in `go.sum`
- Build command is correct
- Dockerfile syntax (if using)

**View build logs:**
1. Go to "Builds" tab
2. Click failed build
3. View error logs

### Service Won't Start

**Check:**
1. Environment variables set correctly
2. Port 8080 is exposed
3. Health check path is correct
4. Logs for startup errors

**Common issues:**
- Missing `GROQ_API_KEY`
- Wrong `PORT` variable
- CORS not configured

### WebSocket Connection Fails

**Check:**
1. Using `wss://` (not `ws://`)
2. CORS allows frontend origin
3. WebSocket upgrade headers allowed
4. No proxy blocking WebSocket

## 📝 Deployment Checklist

- [ ] Northflank account created
- [ ] Project created
- [ ] Service configured
- [ ] GitHub repository connected
- [ ] Environment variables added
- [ ] Port 8080 exposed
- [ ] Dockerfile created (optional)
- [ ] Service deployed successfully
- [ ] Deployment URL obtained
- [ ] Frontend updated with new URL
- [ ] CORS configured
- [ ] WebSocket tested
- [ ] Health check working
- [ ] Auto-deploy enabled (optional)

## 🎯 Production Checklist

- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Environment variables secured
- [ ] Logging configured
- [ ] Monitoring set up
- [ ] Alerts configured
- [ ] Backup strategy planned
- [ ] Rate limiting implemented
- [ ] Error tracking added

## 📚 Resources

- [Northflank Docs](https://northflank.com/docs)
- [Go Deployment Guide](https://northflank.com/docs/v1/application/deploy/go)
- [Environment Variables](https://northflank.com/docs/v1/application/environment-variables)
- [Custom Domains](https://northflank.com/docs/v1/application/domains)

## 🆘 Support

**Northflank Support:**
- Discord: https://discord.gg/northflank
- Email: support@northflank.com
- Docs: https://northflank.com/docs

**Common Issues:**
- Check Northflank status page
- Review deployment logs
- Test locally first
- Check environment variables

---

**Ready to deploy! 🚀**
