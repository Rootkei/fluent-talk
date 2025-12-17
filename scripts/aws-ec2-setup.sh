#!/bin/bash

# AWS EC2 Deployment Script
# Run this on your EC2 instance after SSH connection

set -e

echo "========================================="
echo "English Voice Chat - EC2 Setup Script"
echo "========================================="

# Update system
echo "📦 Updating system..."
sudo apt update && sudo apt upgrade -y

# Install Go
echo "🔧 Installing Go 1.21..."
cd /tmp
wget https://go.dev/dl/go1.21.5.linux-amd64.tar.gz
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf go1.21.5.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
export PATH=$PATH:/usr/local/go/bin

# Verify Go installation
go version

# Install Git
echo "📥 Installing Git..."
sudo apt install git -y

# Install Nginx
echo "🌐 Installing Nginx..."
sudo apt install nginx -y

# Clone repository
echo "📂 Cloning repository..."
cd ~
if [ -d "fluent-talk" ]; then
    echo "Repository already exists, pulling latest..."
    cd fluent-talk
    git pull
else
    git clone https://github.com/Rootkei/fluent-talk.git
    cd fluent-talk
fi

# Build backend
echo "🔨 Building backend..."
cd backend
go mod download
go build -o server cmd/server/main.go

# Create .env file
echo "⚙️  Creating environment file..."
read -p "Enter your GROQ_API_KEY: " groq_key
cat > .env << EOF
GROQ_API_KEY=$groq_key
GROQ_MODEL=llama-3.3-70b-versatile
PORT=8080
EOF

# Create systemd service
echo "🔧 Creating systemd service..."
sudo tee /etc/systemd/system/voice-chat.service > /dev/null << EOF
[Unit]
Description=English Voice Chat Backend
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$HOME/fluent-talk/backend
ExecStart=$HOME/fluent-talk/backend/server
Restart=always
RestartSec=10
Environment="PATH=/usr/local/go/bin:/usr/bin:/bin"
EnvironmentFile=$HOME/fluent-talk/backend/.env

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
echo "🚀 Starting service..."
sudo systemctl daemon-reload
sudo systemctl enable voice-chat
sudo systemctl start voice-chat

# Configure Nginx
echo "🌐 Configuring Nginx..."
sudo tee /etc/nginx/sites-available/voice-chat > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;

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
EOF

sudo ln -sf /etc/nginx/sites-available/voice-chat /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# Get public IP
PUBLIC_IP=$(curl -s http://checkip.amazonaws.com)

echo ""
echo "========================================="
echo "✅ Setup Complete!"
echo "========================================="
echo ""
echo "Service Status:"
sudo systemctl status voice-chat --no-pager
echo ""
echo "🌐 Your backend is running at:"
echo "   http://$PUBLIC_IP"
echo ""
echo "📝 Useful commands:"
echo "   sudo systemctl status voice-chat   # Check status"
echo "   sudo systemctl restart voice-chat  # Restart service"
echo "   sudo journalctl -u voice-chat -f   # View logs"
echo ""
echo "🔒 To setup SSL (optional):"
echo "   sudo apt install certbot python3-certbot-nginx -y"
echo "   sudo certbot --nginx -d your-domain.com"
echo ""
