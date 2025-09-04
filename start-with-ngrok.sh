#!/bin/bash

echo "🚀 Starting Trade Hub P2P with Ngrok..."

# Check if dev server is running
if ! pgrep -f "vite" > /dev/null; then
    echo "📦 Starting development server..."
    npm run dev &
    sleep 5
fi

# Start ngrok
echo "🌍 Starting Ngrok tunnel..."
ngrok http 5173
