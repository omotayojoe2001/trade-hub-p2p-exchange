#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Setting up Ngrok for Multi-User Testing...\n');

console.log('📋 Step-by-Step Setup Instructions:\n');

console.log('1. 🌐 Create Ngrok Account:');
console.log('   • Go to: https://ngrok.com/signup');
console.log('   • Sign up for a free account');
console.log('   • Verify your email\n');

console.log('2. 🔑 Get Your Auth Token:');
console.log('   • After signup, go to: https://dashboard.ngrok.com/get-started/your-authtoken');
console.log('   • Copy your authtoken\n');

console.log('3. 🔧 Configure Ngrok:');
console.log('   • Run: ngrok config add-authtoken YOUR_TOKEN_HERE');
console.log('   • Replace YOUR_TOKEN_HERE with your actual token\n');

console.log('4. 🚀 Start Your Development Server:');
console.log('   • Run: npm run dev');
console.log('   • Note the port (usually 5173)\n');

console.log('5. 🌍 Expose Your App with Ngrok:');
console.log('   • In a new terminal, run: ngrok http 5173');
console.log('   • Copy the https://xxx.ngrok.io URL\n');

console.log('6. 📱 Test Multi-User Flow:');
console.log('   • Device A: Open the ngrok URL');
console.log('   • Device B: Open the same ngrok URL');
console.log('   • Test real-time merchant/customer interactions\n');

// Create a convenient start script
const startScript = `#!/bin/bash

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
`;

fs.writeFileSync('start-with-ngrok.sh', startScript);
fs.chmodSync('start-with-ngrok.sh', '755');

console.log('✅ Created start-with-ngrok.sh script for easy launching\n');

console.log('🎯 Quick Start Commands:');
console.log('   1. npm run dev');
console.log('   2. ngrok http 5173');
console.log('   3. Share the ngrok URL for multi-user testing\n');

console.log('📱 Multi-User Test Scenarios:');
console.log('   • User A: Toggle merchant mode → User B sees them in merchant list');
console.log('   • User A: Create trade request → User B sees it instantly');
console.log('   • User B: Accept trade → User A gets notification immediately');
console.log('   • Test messaging between users in real-time\n');

console.log('🔒 Security Notes:');
console.log('   • Ngrok URLs are temporary and change each restart');
console.log('   • Free tier has connection limits');
console.log('   • Don\'t share ngrok URLs publicly');
console.log('   • Use for testing only, not production\n');

console.log('✨ Setup complete! Follow the steps above to start testing.');
