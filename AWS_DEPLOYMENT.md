# AWS Deployment Guide - English Voice Chat

Complete guide to deploy backend on AWS with multiple options.

## 🎯 AWS Deployment Options

| Service | Difficulty | Cost | Best For |
|---------|-----------|------|----------|
| **EC2** | Medium | ~$5/month | Full control, custom setup |
| **App Runner** | Easy | ~$5/month | Easiest, auto-scaling |
| **ECS Fargate** | Hard | ~$10/month | Production, scalable |
| **Elastic Beanstalk** | Medium | ~$5/month | Managed, Docker support |

**Recommended: AWS App Runner** (easiest, similar to Render)

---

## Option 1: AWS App Runner (Recommended)

**Easiest AWS option - Similar to Render.com**

### Prerequisites
- AWS Account
- GitHub repository
- Groq API key

### Step 1: Create App Runner Service

1. **Go to AWS Console**
   - Navigate to: https://console.aws.amazon.com/apprunner
   - Select region: `us-east-1` (N. Virginia)

2. **Create Service**
   - Click "Create service"
   - Source: **Source code repository**
   - Connect to GitHub: `Rootkei/fluent-talk`
   - Branch: `main`
   - Source directory: `backend`

3. **Configure Build**
   ```
   Runtime: Go 1.21
   Build command: go build -o server cmd/server/main.go
   Start command: ./server
   Port: 8080
   ```

4. **Configure Service**
   ```
   Service name: english-voice-chat
   CPU: 1 vCPU
   Memory: 2 GB
   Auto scaling: 1-10 instances
   ```

5. **Environment Variables**
   ```
   GROQ_API_KEY=your_key_here
   GROQ_MODEL=llama-3.3-70b-versatile
   PORT=8080
   ```

6. **Create & Deploy**
   - Click "Create & deploy"
   - Wait 5-10 minutes
   - Get URL: `https://xxxxx.us-east-1.awsapprunner.com`

### Cost
- **~$5-10/month** for always-on service
- No free tier for App Runner

---

## Option 2: AWS EC2 (Full Control)

**Best for: Custom setup, full control**

### Step 1: Launch EC2 Instance

1. **Go to EC2 Console**
   - https://console.aws.amazon.com/ec2

2. **Launch Instance**
   ```
   Name: english-voice-chat-backend
   AMI: Ubuntu Server 22.04 LTS
   Instance type: t3.micro (1 vCPU, 1 GB RAM)
   Key pair: Create new or use existing
   Security group: Allow ports 22, 80, 443, 8080
   Storage: 8 GB gp3
   ```

3. **Launch & Connect**
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

### Step 2: Setup Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Go
wget https://go.dev/dl/go1.21.5.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.21.5.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc

# Install Git
sudo apt install git -y

# Clone repository
git clone https://github.com/Rootkei/fluent-talk.git
cd fluent-talk/backend

# Install dependencies
go mod download

# Build
go build -o server cmd/server/main.go
```

### Step 3: Configure Environment

```bash
# Create .env file
cat > .env << EOF
GROQ_API_KEY=your_key_here
GROQ_MODEL=llama-3.3-70b-versatile
PORT=8080
EOF
```

### Step 4: Setup Systemd Service

```bash
# Create service file
sudo nano /etc/systemd/system/voice-chat.service
```

**Add:**
```ini
[Unit]
Description=English Voice Chat Backend
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/fluent-talk/backend
ExecStart=/home/ubuntu/fluent-talk/backend/server
Restart=always
RestartSec=10
Environment="PATH=/usr/local/go/bin:/usr/bin:/bin"
EnvironmentFile=/home/ubuntu/fluent-talk/backend/.env

[Install]
WantedBy=multi-user.target
```

**Enable & Start:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable voice-chat
sudo systemctl start voice-chat
sudo systemctl status voice-chat
```

### Step 5: Setup Nginx Reverse Proxy

```bash
# Install Nginx
sudo apt install nginx -y

# Configure
sudo nano /etc/nginx/sites-available/voice-chat
```

**Add:**
```nginx
server {
    listen 80;
    server_name your-domain.com;  # or EC2 public IP

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

**Enable:**
```bash
sudo ln -s /etc/nginx/sites-available/voice-chat /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 6: Setup SSL (Optional)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Cost
- **t3.micro:** ~$7.50/month (free tier: 750 hours/month for 12 months)
- **Elastic IP:** Free if attached
- **Storage:** ~$0.80/month (8 GB)
- **Total:** ~$8/month (free for first year)

---

## Option 3: AWS ECS Fargate (Production)

**Best for: Production, auto-scaling**

### Prerequisites
- Docker installed locally
- AWS CLI configured

### Step 1: Create ECR Repository

```bash
# Create repository
aws ecr create-repository --repository-name english-voice-chat

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
```

### Step 2: Build & Push Docker Image

```bash
cd backend

# Build
docker build -t english-voice-chat .

# Tag
docker tag english-voice-chat:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/english-voice-chat:latest

# Push
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/english-voice-chat:latest
```

### Step 3: Create ECS Cluster

1. **Go to ECS Console**
2. **Create Cluster**
   - Name: `voice-chat-cluster`
   - Infrastructure: AWS Fargate

### Step 4: Create Task Definition

**task-definition.json:**
```json
{
  "family": "voice-chat-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "voice-chat-container",
      "image": "YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/english-voice-chat:latest",
      "portMappings": [
        {
          "containerPort": 8080,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "GROQ_MODEL",
          "value": "llama-3.3-70b-versatile"
        },
        {
          "name": "PORT",
          "value": "8080"
        }
      ],
      "secrets": [
        {
          "name": "GROQ_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:YOUR_ACCOUNT_ID:secret:groq-api-key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/voice-chat",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

**Register:**
```bash
aws ecs register-task-definition --cli-input-json file://task-definition.json
```

### Step 5: Create Service

```bash
aws ecs create-service \
  --cluster voice-chat-cluster \
  --service-name voice-chat-service \
  --task-definition voice-chat-task \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

### Step 6: Setup Load Balancer (Optional)

1. Create Application Load Balancer
2. Create Target Group (port 8080)
3. Update ECS service to use ALB

### Cost
- **Fargate:** ~$10-15/month (0.25 vCPU, 0.5 GB)
- **ALB:** ~$16/month (if used)
- **Total:** ~$10-30/month

---

## Option 4: Elastic Beanstalk

**Best for: Managed Docker deployment**

### Step 1: Install EB CLI

```bash
pip install awsebcli
```

### Step 2: Initialize

```bash
cd backend
eb init -p docker english-voice-chat --region us-east-1
```

### Step 3: Create Dockerrun.aws.json

```json
{
  "AWSEBDockerrunVersion": "1",
  "Image": {
    "Name": "YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/english-voice-chat:latest"
  },
  "Ports": [
    {
      "ContainerPort": 8080
    }
  ]
}
```

### Step 4: Deploy

```bash
eb create voice-chat-env
eb setenv GROQ_API_KEY=your_key GROQ_MODEL=llama-3.3-70b-versatile
eb deploy
```

### Cost
- **t3.micro:** ~$7.50/month
- **Load Balancer:** ~$16/month
- **Total:** ~$24/month

---

## 📊 Cost Comparison

| Service | Monthly Cost | Free Tier | Always On |
|---------|-------------|-----------|-----------|
| **App Runner** | $5-10 | ❌ No | ✅ Yes |
| **EC2 t3.micro** | $8 | ✅ 12 months | ✅ Yes |
| **ECS Fargate** | $10-30 | ❌ No | ✅ Yes |
| **Elastic Beanstalk** | $24 | ❌ No | ✅ Yes |

**Recommendation:**
- **Learning:** EC2 (free tier)
- **Easiest:** App Runner
- **Production:** ECS Fargate
- **Managed:** Elastic Beanstalk

---

## 🔧 Update Frontend

After deployment, update `frontend/app-premium.js`:

```javascript
const CONFIG = {
    WS_URL: window.location.hostname === 'localhost'
        ? 'ws://localhost:8080/ws'
        : 'wss://your-aws-url.com/ws',  // Your AWS URL
    BACKEND_URL: window.location.hostname === 'localhost'
        ? 'http://localhost:8080'
        : 'https://your-aws-url.com',
    // ...
}
```

---

## 🐛 Troubleshooting

### App Runner Issues
- Check build logs in console
- Verify environment variables
- Check service logs

### EC2 Issues
```bash
# Check service status
sudo systemctl status voice-chat

# View logs
sudo journalctl -u voice-chat -f

# Restart service
sudo systemctl restart voice-chat
```

### ECS Issues
```bash
# View logs
aws logs tail /ecs/voice-chat --follow

# Describe service
aws ecs describe-services --cluster voice-chat-cluster --services voice-chat-service
```

---

## 📚 Resources

- [AWS App Runner Docs](https://docs.aws.amazon.com/apprunner/)
- [EC2 User Guide](https://docs.aws.amazon.com/ec2/)
- [ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [Elastic Beanstalk Guide](https://docs.aws.amazon.com/elasticbeanstalk/)

---

**Choose the option that fits your needs and budget! 🚀**
