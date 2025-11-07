const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// BitGo API configuration
const BITGO_BASE_URL = 'https://app.bitgo.com';
const BITGO_ACCESS_TOKEN = process.env.BITGO_ACCESS_TOKEN;

if (!BITGO_ACCESS_TOKEN) {
  console.error('ERROR: BITGO_ACCESS_TOKEN environment variable is required');
  process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// BitGo proxy middleware
const bitgoProxy = createProxyMiddleware({
  target: BITGO_BASE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/forward': '', // Remove /api/forward prefix
  },
  onProxyReq: (proxyReq, req, res) => {
    // Add BitGo authorization header
    proxyReq.setHeader('Authorization', `Bearer ${BITGO_ACCESS_TOKEN}`);
    proxyReq.setHeader('Content-Type', 'application/json');
    
    console.log(`Proxying: ${req.method} ${req.originalUrl} -> ${BITGO_BASE_URL}${req.path.replace('/api/forward', '')}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`Response: ${proxyRes.statusCode} for ${req.originalUrl}`);
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err.message);
    res.status(500).json({ error: 'Proxy error', message: err.message });
  }
});

// Apply proxy to /api/forward routes
app.use('/api/forward', bitgoProxy);

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`BitGo Proxy Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`BitGo proxy: http://localhost:${PORT}/api/forward/*`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  process.exit(0);
});