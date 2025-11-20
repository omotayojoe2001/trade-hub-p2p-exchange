#!/bin/bash

# 🚀 BitGo Proxy Setup Script
# This script sets up everything you need for BitGo real wallet generation

echo "🚀 Setting up BitGo Proxy Server..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Create proxy directory
echo "📁 Creating proxy directory..."
mkdir -p bitgo-proxy && cd bitgo-proxy

# Create package.json
echo "📄 Creating package.json..."
cat > package.json << 'EOF'
{
  "name": "bitgo-proxy-server",
  "version": "1.0.0",
  "description": "Proxy server for BitGo API to handle IP restrictions",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "http-proxy-middleware": "^2.0.6",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  },
  "engines": {
    "node": ">=16.0.0"
  }
}
EOF

# Create server.js
echo "📄 Creating proxy server..."
cat > server.js << 'EOF'
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// BitGo API Proxy
app.use('/api/v2', createProxyMiddleware({
  target: 'https://app.bitgo.com',
  changeOrigin: true,
  secure: true,
  pathRewrite: {
    '^/api/v2': '/api/v2'
  },
  onProxyReq: (proxyReq, req, res) => {
    // Add BitGo access token to all requests
    if (process.env.BITGO_ACCESS_TOKEN) {
      proxyReq.setHeader('Authorization', `Bearer ${process.env.BITGO_ACCESS_TOKEN}`);
    }
    
    // Log requests for debugging
    console.log(`[${new Date().toISOString()}] Proxying: ${req.method} ${req.url}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    // Log responses for debugging
    console.log(`[${new Date().toISOString()}] Response: ${proxyRes.statusCode} for ${req.method} ${req.url}`);
  },
  onError: (err, req, res) => {
    console.error(`[${new Date().toISOString()}] Proxy Error:`, err.message);
    res.status(500).json({ 
      error: 'Proxy Error', 
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }
}));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 BitGo Proxy Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 BitGo API: http://localhost:${PORT}/api/v2`);
  console.log(`🔑 Access Token: ${process.env.BITGO_ACCESS_TOKEN ? 'Configured' : 'Missing'}`);
});
EOF

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install PM2 for process management
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Create environment file template
echo "📄 Creating environment template..."
cat > .env.example << 'EOF'
BITGO_ACCESS_TOKEN=your_bitgo_access_token_here
PORT=3000
EOF

# Open firewall port
echo "🔥 Opening firewall port 3000..."
sudo ufw allow 3000

# Start the proxy
echo "🚀 Starting BitGo proxy server..."
pm2 start server.js --name bitgo-proxy

# Set up PM2 to start on boot
echo "⚙️ Setting up auto-start..."
pm2 startup
pm2 save

# Get server IP
SERVER_IP=$(curl -s ifconfig.me)

echo ""
echo "✅ BitGo Proxy Server Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Your server IP is: $SERVER_IP"
echo "2. Add this IP to your BitGo API key restrictions"
echo "3. Set your BitGo access token:"
echo "   export BITGO_ACCESS_TOKEN='your_token_here'"
echo "   pm2 restart bitgo-proxy"
echo ""
echo "🔗 Test your proxy:"
echo "   curl http://$SERVER_IP:3000/health"
echo ""
echo "📖 Full guide: BITGO_REAL_WALLET_SETUP.md"
echo ""