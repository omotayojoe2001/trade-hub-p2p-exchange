#!/usr/bin/env node

import { spawn, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function testNgrokSetup() {
  console.log('🧪 Testing Ngrok Setup...\n');

  try {
    // Test 1: Check if ngrok is installed
    console.log('1. Checking Ngrok installation...');
    try {
      const { stdout } = await execAsync('ngrok version');
      console.log('   ✅ Ngrok installed:', stdout.trim());
    } catch (error) {
      console.log('   ❌ Ngrok not found. Please install with: npm install -g ngrok');
      return;
    }

    // Test 2: Check if authtoken is configured
    console.log('\n2. Checking Ngrok configuration...');
    try {
      const { stdout } = await execAsync('ngrok config check');
      console.log('   ✅ Ngrok configuration valid');
    } catch (error) {
      console.log('   ⚠️  Ngrok authtoken not configured');
      console.log('   📝 To configure:');
      console.log('      1. Go to: https://dashboard.ngrok.com/get-started/your-authtoken');
      console.log('      2. Copy your authtoken');
      console.log('      3. Run: ngrok config add-authtoken YOUR_TOKEN');
    }

    // Test 3: Check if development server port is available
    console.log('\n3. Checking development server port...');
    try {
      const { stdout } = await execAsync('netstat -an | findstr :5173');
      if (stdout.trim()) {
        console.log('   ✅ Port 5173 is in use (development server running)');
      } else {
        console.log('   ⚠️  Port 5173 is free (development server not running)');
        console.log('   💡 Start with: npm run dev');
      }
    } catch (error) {
      console.log('   ⚠️  Could not check port status');
    }

    // Test 4: Provide setup instructions
    console.log('\n🚀 Quick Start Guide:');
    console.log('   1. Start development server: npm run dev');
    console.log('   2. Start ngrok tunnel: npm run ngrok');
    console.log('   3. Copy the https://xxx.ngrok.io URL');
    console.log('   4. Share URL for multi-user testing');

    console.log('\n📱 Multi-User Test Flow:');
    console.log('   Device A: Open ngrok URL → Sign up as merchant');
    console.log('   Device B: Open same URL → Sign up as customer');
    console.log('   Device A: Toggle merchant mode → Device B sees update');
    console.log('   Device A: Create trade request → Device B sees instantly');
    console.log('   Device B: Accept trade → Device A gets notification');

    console.log('\n🔧 Troubleshooting:');
    console.log('   • If ngrok fails: Check authtoken configuration');
    console.log('   • If no real-time updates: Check browser console');
    console.log('   • If connection issues: Try different browser/device');

    console.log('\n✨ Your real-time P2P platform is ready for multi-user testing!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testNgrokSetup().then(() => {
  console.log('\n🎯 Setup test completed!');
}).catch(error => {
  console.error('Test failed:', error);
});
