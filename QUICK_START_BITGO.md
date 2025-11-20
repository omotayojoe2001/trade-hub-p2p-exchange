# 🚀 SUPER QUICK BitGo Setup (5 Minutes!)

## 🎯 What You Need
1. BitGo account (we'll create this)
2. Server with static IP (we'll set this up)
3. 5 minutes of your time

---

## ⚡ STEP 1: Create BitGo Account (2 minutes)

1. **Go to**: https://www.bitgo.com
2. **Click**: "Sign Up" 
3. **Enter**:
   - Your email
   - Strong password
   - Company name
4. **Click**: "Create Account"
5. **Check email** and click verification link

---

## ⚡ STEP 2: Get Your Server Ready (2 minutes)

### Option A: Use DigitalOcean (Recommended)
1. **Go to**: https://digitalocean.com
2. **Create account** and add payment method
3. **Create Droplet**:
   - Ubuntu 22.04
   - Basic $6/month
   - Any region
4. **Note the IP address** (you'll need this!)

### Option B: Use Your Existing Server
- Just make sure you know your server's public IP
- Run: `curl ifconfig.me` to find it

---

## ⚡ STEP 3: Set Up Proxy Server (1 minute)

**SSH into your server** and run this ONE command:

```bash
curl -sSL https://raw.githubusercontent.com/your-repo/setup-bitgo-proxy.sh | bash
```

**OR manually:**

```bash
# Install everything
sudo apt update && sudo apt install -y nodejs npm
mkdir bitgo-proxy && cd bitgo-proxy

# Download our ready-made files
wget https://raw.githubusercontent.com/your-repo/bitgo-proxy-server.js
wget https://raw.githubusercontent.com/your-repo/bitgo-proxy-package.json -O package.json

# Install and start
npm install
npm install -g pm2
pm2 start bitgo-proxy-server.js --name bitgo-proxy
pm2 startup && pm2 save
```

**Your proxy is now running!** ✅

---

## ⚡ STEP 4: Configure BitGo (30 seconds)

1. **Login to BitGo**: https://app.bitgo.com
2. **Go to**: Settings → API Access
3. **Click**: "Create API Key"
4. **Name**: "Production Key"
5. **Permissions**: Check ALL boxes
6. **IP Restrictions**: Enter your server IP from Step 2
7. **Click**: "Create"
8. **COPY THE TOKEN** (you'll never see it again!)

---

## ⚡ STEP 5: Update Your App (30 seconds)

**Add to your `.env` file:**

```env
BITGO_ACCESS_TOKEN=your_token_from_step_4
BITGO_ENVIRONMENT=prod
BITGO_PROXY_URL=http://your_server_ip:3000
```

**That's it!** 🎉

---

## ✅ Test It Works

**Run this command** (replace with your server IP):

```bash
curl http://your_server_ip:3000/health
```

**Should return:**
```json
{"status":"OK","timestamp":"2024-01-01T12:00:00.000Z"}
```

---

## 🎉 YOU'RE DONE!

Your app will now:
- ✅ Generate REAL Bitcoin addresses
- ✅ Generate REAL USDT addresses
- ✅ Handle real crypto transactions
- ✅ Work in production

**Total time: 5 minutes** ⏱️

---

## 🆘 If Something Goes Wrong

### "Connection refused" error?
- Check if proxy is running: `pm2 status`
- Restart it: `pm2 restart bitgo-proxy`

### "IP not whitelisted" error?
- Double-check your server IP: `curl ifconfig.me`
- Add it to BitGo API key settings
- Wait 2 minutes for changes

### Still not working?
- Check proxy logs: `pm2 logs bitgo-proxy`
- Make sure port 3000 is open: `sudo ufw allow 3000`

**Need help?** The full detailed guide is in `BITGO_REAL_WALLET_SETUP.md`