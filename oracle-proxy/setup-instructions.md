# Oracle Server Setup Instructions

## 1. Upload Files to Oracle Server
Upload these files to your Oracle server:
- package.json
- server.js
- ecosystem.config.js
- .env.example

## 2. SSH into Oracle Server
```bash
ssh -i your-key.pem ubuntu@YOUR_ORACLE_SERVER_IP
```

## 3. Install Node.js (if not installed)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## 4. Set Up Project
```bash
mkdir -p /home/ubuntu/bitgo-proxy
cd /home/ubuntu/bitgo-proxy

# Copy uploaded files here
# Create .env file
cp .env.example .env
nano .env  # Add your BITGO_ACCESS_TOKEN

# Install dependencies
npm install

# Create logs directory
mkdir logs
```

## 5. Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

## 6. Configure Firewall (Oracle Cloud)
1. Go to Oracle Cloud Console
2. Navigate to your instance
3. Go to "Virtual Cloud Networks" → Your VCN → Security Lists
4. Add Ingress Rule:
   - Source CIDR: 0.0.0.0/0
   - IP Protocol: TCP
   - Destination Port Range: 3000

## 7. Start the Server
```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
pm2 startup
# Follow the command it gives you (run with sudo)
```

## 8. Test the Server
```bash
# Test health endpoint
curl http://localhost:3000/health

# Test from external (replace with your server IP)
curl http://YOUR_ORACLE_SERVER_IP:3000/health
```

## 9. Monitor
```bash
# View logs
pm2 logs bitgo-proxy

# Monitor processes
pm2 monit

# Restart if needed
pm2 restart bitgo-proxy
```