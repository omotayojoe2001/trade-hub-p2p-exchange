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