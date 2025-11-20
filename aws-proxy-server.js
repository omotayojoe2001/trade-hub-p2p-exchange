const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = 8080;

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'AWS Proxy Server Running', timestamp: new Date().toISOString() });
});

// BitGo proxy middleware
const bitgoProxy = createProxyMiddleware({
  target: 'https://app.bitgo.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api/forward': '', // Remove /api/forward prefix
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`Proxying: ${req.method} ${req.url} -> https://app.bitgo.com${req.url.replace('/api/forward', '')}`);
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err.message);
    res.status(500).json({ error: 'Proxy error', message: err.message });
  }
});

// Apply proxy to /api/forward/* routes
app.use('/api/forward', bitgoProxy);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`BitGo Proxy Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});