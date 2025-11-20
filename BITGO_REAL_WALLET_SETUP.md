# 🚀 BitGo Real Wallet Setup Guide (Super Simple!)

## 🎯 What We're Fixing
Your app can't generate real BTC/USDT wallet addresses because of BitGo IP restrictions. We'll fix this step by step!

---

## 📋 Step 1: Create Fresh BitGo Account

### 1.1 Go to BitGo Website
- Open browser → Go to **https://www.bitgo.com**
- Click **"Sign Up"** (top right)

### 1.2 Create Account
- **Email**: Use your business email
- **Password**: Strong password (save it!)
- **Company Name**: Your company name
- **Phone**: Your phone number
- Click **"Create Account"**

### 1.3 Verify Email
- Check your email inbox
- Click the verification link
- Complete email verification

---

## 📋 Step 2: Complete Account Setup

### 2.1 Login to BitGo
- Go to **https://app.bitgo.com**
- Login with your credentials

### 2.2 Complete KYB (Know Your Business)
- Upload business documents:
  - **Business Registration Certificate**
  - **Tax ID/EIN Document**
  - **Proof of Address** (utility bill)
- Fill out business information form
- Submit for review (takes 1-3 business days)

### 2.3 Enable 2FA
- Go to **Settings** → **Security**
- Enable **Two-Factor Authentication**
- Use Google Authenticator or Authy

---

## 📋 Step 3: Get Production API Access

### 3.1 Request Production Access
- In BitGo dashboard, go to **Settings** → **API Access**
- Click **"Request Production Access"**
- Fill out the form:
  - **Use Case**: P2P Cryptocurrency Exchange
  - **Expected Volume**: Your expected monthly volume
  - **Business Model**: Peer-to-peer trading platform
- Submit request

### 3.2 Wait for Approval
- BitGo will review (usually 3-5 business days)
- They may ask for additional information
- Respond promptly to any requests

---

## 📋 Step 4: Create API Keys

### 4.1 Generate Production API Key
- Once approved, go to **Settings** → **API Access**
- Click **"Create API Key"**
- **Name**: "P2P Exchange Production"
- **Permissions**: Select:
  - ✅ View wallets
  - ✅ Create wallets
  - ✅ View transactions
  - ✅ Send transactions
- **IP Restrictions**: Leave BLANK for now
- Click **"Create"**

### 4.2 Save Your Credentials
```
BITGO_ACCESS_TOKEN=your_access_token_here
BITGO_ENVIRONMENT=prod
```
**⚠️ IMPORTANT**: Save these securely!

---

## 📋 Step 5: Set Up IP Whitelisting

### 5.1 Find Your Server IP
If using cloud hosting, get your server's public IP:

**For Vercel/Netlify:**
- These use dynamic IPs, so we'll use a proxy server

**For VPS/Dedicated Server:**
- Run: `curl ifconfig.me` to get your IP

### 5.2 Add IP to BitGo
- In BitGo dashboard → **Settings** → **API Access**
- Edit your API key
- Add your server IP to **IP Restrictions**
- Save changes

---

## 📋 Step 6: Set Up Proxy Server (For Dynamic IPs)

If you're using Vercel/Netlify, you need a proxy server with static IP:

### 6.1 Create DigitalOcean Droplet
- Go to **https://digitalocean.com**
- Create account
- Create new Droplet:
  - **Image**: Ubuntu 22.04
  - **Size**: Basic $6/month
  - **Region**: Choose closest to your users
- Note the IP address

### 6.2 Install Proxy on Server
SSH into your server and run:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Create proxy directory
mkdir bitgo-proxy && cd bitgo-proxy

# Create package.json
cat > package.json << 'EOF'
{
  "name": "bitgo-proxy",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {
    "express": "^4.18.2",
    "http-proxy-middleware": "^2.0.6",
    "cors": "^2.8.5"
  }
}
EOF

# Install dependencies
npm install
```

### 6.3 Create Proxy Server
```bash
cat > server.js << 'EOF'
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Proxy to BitGo
app.use('/api/v2', createProxyMiddleware({
  target: 'https://app.bitgo.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api/v2': '/api/v2'
  },
  onProxyReq: (proxyReq, req, res) => {
    // Add your BitGo access token
    proxyReq.setHeader('Authorization', `Bearer ${process.env.BITGO_ACCESS_TOKEN}`);
  }
}));

app.listen(PORT, () => {
  console.log(`BitGo proxy running on port ${PORT}`);
});
EOF
```

### 6.4 Set Environment Variables
```bash
# Create environment file
cat > .env << 'EOF'
BITGO_ACCESS_TOKEN=your_bitgo_access_token_here
EOF

# Install PM2 for process management
sudo npm install -g pm2

# Start the proxy
pm2 start server.js --name bitgo-proxy
pm2 startup
pm2 save
```

### 6.5 Add Proxy IP to BitGo
- Copy your DigitalOcean server IP
- In BitGo dashboard → **Settings** → **API Access**
- Edit your API key
- Add the proxy server IP to **IP Restrictions**
- Save changes

---

## 📋 Step 7: Update Your App Configuration

### 7.1 Update Environment Variables
In your `.env` file:

```env
# BitGo Configuration
BITGO_ACCESS_TOKEN=your_production_access_token
BITGO_ENVIRONMENT=prod
BITGO_PROXY_URL=http://your_proxy_server_ip:3000
```

### 7.2 Update BitGo Service
Update your `src/services/bitgoService.ts`:

```typescript
const BITGO_BASE_URL = process.env.BITGO_PROXY_URL || 'https://app.bitgo.com';
const BITGO_ACCESS_TOKEN = process.env.BITGO_ACCESS_TOKEN;
const BITGO_ENV = process.env.BITGO_ENVIRONMENT || 'prod';

// Use proxy URL for all BitGo API calls
const bitgoApi = axios.create({
  baseURL: BITGO_BASE_URL,
  headers: {
    'Authorization': `Bearer ${BITGO_ACCESS_TOKEN}`,
    'Content-Type': 'application/json'
  }
});
```

---

## 📋 Step 8: Test Real Wallet Generation

### 8.1 Test BTC Wallet Creation
```bash
curl -X POST "http://your_proxy_server_ip:3000/api/v2/btc/wallet" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Test BTC Wallet",
    "passphrase": "your_secure_passphrase"
  }'
```

### 8.2 Test USDT Wallet Creation
```bash
curl -X POST "http://your_proxy_server_ip:3000/api/v2/eth/wallet" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Test USDT Wallet",
    "passphrase": "your_secure_passphrase"
  }'
```

### 8.3 Verify in Your App
- Go to your app
- Try creating a new trade
- Check if real wallet addresses are generated
- Addresses should start with:
  - **BTC**: `1`, `3`, or `bc1`
  - **USDT**: `0x` (Ethereum address)

---

## 📋 Step 9: Production Checklist

### ✅ Before Going Live:
- [ ] BitGo account fully verified
- [ ] Production API access approved
- [ ] API keys created and secured
- [ ] IP whitelisting configured
- [ ] Proxy server running (if needed)
- [ ] Test wallet generation working
- [ ] Environment variables updated
- [ ] App deployed with new configuration

### ✅ Security Checklist:
- [ ] API keys stored securely
- [ ] IP restrictions enabled
- [ ] 2FA enabled on BitGo account
- [ ] Proxy server secured (firewall, SSH keys)
- [ ] Regular backups of wallet data

---

## 🆘 Troubleshooting

### Problem: "IP not whitelisted" error
**Solution**: 
1. Check your server's public IP: `curl ifconfig.me`
2. Add this IP to BitGo API key restrictions
3. Wait 5 minutes for changes to take effect

### Problem: "Invalid access token" error
**Solution**:
1. Verify your access token is correct
2. Check if token has expired
3. Regenerate token if needed

### Problem: Wallet creation fails
**Solution**:
1. Check BitGo account status (must be verified)
2. Verify API permissions include wallet creation
3. Check if you have sufficient BitGo credits

### Problem: Proxy server not working
**Solution**:
1. Check if server is running: `pm2 status`
2. Check server logs: `pm2 logs bitgo-proxy`
3. Restart proxy: `pm2 restart bitgo-proxy`

---

## 📞 Support Contacts

### BitGo Support:
- **Email**: support@bitgo.com
- **Phone**: +1 (650) 681-2020
- **Documentation**: https://developers.bitgo.com

### Emergency Issues:
- Check BitGo status: https://status.bitgo.com
- Review API limits: https://developers.bitgo.com/api/#rate-limiting

---

## 🎉 Success!

Once completed, your app will:
- ✅ Generate real BTC wallet addresses
- ✅ Generate real USDT wallet addresses  
- ✅ Handle real cryptocurrency transactions
- ✅ Work in production environment

**Your P2P exchange is now ready for real crypto trading!** 🚀