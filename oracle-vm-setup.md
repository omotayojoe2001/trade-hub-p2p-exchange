# Oracle VM Deployment Guide

## 1. SSH into Oracle VM
```bash
ssh ubuntu@165.1.72.24
```

## 2. Install Node.js & PM2
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
```

## 3. Create BitGo Service
```bash
mkdir bitgo-service
cd bitgo-service
npm init -y
npm install express cors dotenv
```

## 4. Create server.js
```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const BITGO_BASE_URL = 'https://app.bitgo.com/api/v2';
const BITGO_ACCESS_TOKEN = process.env.BITGO_ACCESS_TOKEN;

// Proxy all BitGo requests
app.all('/api/bitgo/*', async (req, res) => {
  const bitgoPath = req.path.replace('/api/bitgo', '');
  const bitgoUrl = `${BITGO_BASE_URL}${bitgoPath}`;
  
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(bitgoUrl, {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${BITGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`BitGo service running on port ${PORT}`);
});
```

## 5. Create .env file
```bash
BITGO_ACCESS_TOKEN=your_production_token_here
PORT=3000
```

## 6. Start service
```bash
pm2 start server.js --name bitgo-service
pm2 startup
pm2 save
```

## 7. Setup firewall
```bash
sudo ufw allow 3000
sudo ufw enable
```