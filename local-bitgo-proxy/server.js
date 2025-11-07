const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// BitGo proxy middleware
const bitgoProxy = createProxyMiddleware({
  target: 'https://app.bitgo.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api/forward': ''
  },
  onProxyReq: (proxyReq, req, res) => {
    proxyReq.setHeader('Authorization', `Bearer ${process.env.BITGO_ACCESS_TOKEN}`);
    proxyReq.setHeader('Content-Type', 'application/json');
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err.message);
    res.status(500).json({ error: 'Proxy error' });
  }
});

app.use('/api/forward', bitgoProxy);

app.listen(PORT, () => {
  console.log(`Local BitGo proxy running on port ${PORT}`);
});