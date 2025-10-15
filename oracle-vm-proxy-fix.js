const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Enable CORS for all routes
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// BitGo API proxy - Fixed endpoint
app.use('/api/bitgo', createProxyMiddleware({
  target: 'https://app.bitgo.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api/bitgo': '' // Remove /api/bitgo prefix
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`Proxying: ${req.method} ${req.url} -> https://app.bitgo.com${req.url.replace('/api/bitgo', '')}`);
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err.message);
    res.status(500).json({ error: 'Proxy error', message: err.message });
  }
}));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ BitGo proxy running on port ${PORT}`);
  console.log(`🔗 Health check: http://165.1.72.24:${PORT}/health`);
  console.log(`🔗 BitGo API: http://165.1.72.24:${PORT}/api/bitgo`);
});