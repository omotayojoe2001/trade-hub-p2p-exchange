#!/bin/bash
# Run this on Oracle VM to ensure PM2 starts on boot

# Install PM2 startup script
pm2 startup

# Start your BitGo proxy
pm2 start /home/opc/bitgo-proxy/server.js --name bitgo-proxy

# Save PM2 configuration
pm2 save

# Enable auto-restart on crashes
pm2 set pm2:autodump true
pm2 set pm2:watch true

# Check status
pm2 status
pm2 info bitgo-proxy

echo "✅ BitGo proxy configured for 24/7 operation"
echo "🔄 Will auto-restart on crashes and server reboots"