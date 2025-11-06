// Simple API endpoint to check server IP
// Deploy this and call it to get your actual server IP

export default async function handler(req, res) {
  try {
    // Get IP from various headers
    const forwarded = req.headers['x-forwarded-for'];
    const real = req.headers['x-real-ip'];
    const cloudflare = req.headers['cf-connecting-ip'];
    
    // Try to get external IP
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    
    res.json({
      serverIP: data.ip,
      headers: {
        'x-forwarded-for': forwarded,
        'x-real-ip': real,
        'cf-connecting-ip': cloudflare
      },
      userAgent: req.headers['user-agent']
    });
  } catch (error) {
    res.json({ error: error.message });
  }
}