# 🌍 Ngrok Multi-User Testing Guide

## 🚀 Quick Setup (5 Minutes)

### 1. **Get Ngrok Account** (Free)
```bash
# Visit: https://ngrok.com/signup
# Sign up and verify email
```

### 2. **Configure Ngrok**
```bash
# Get your token from: https://dashboard.ngrok.com/get-started/your-authtoken
ngrok config add-authtoken YOUR_TOKEN_HERE
```

### 3. **Start Your App**
```bash
# Terminal 1: Start development server
npm run dev

# Terminal 2: Start ngrok tunnel
ngrok http 5173
```

### 4. **Get Your Public URL**
```
Ngrok will show something like:
https://abc123.ngrok.io -> http://localhost:5173
```

## 📱 Multi-User Testing Scenarios

### **Scenario 1: Merchant Mode Toggle**
**Device A (Phone/Tablet):**
1. Open `https://your-ngrok-url.ngrok.io`
2. Sign up as: `merchant1@test.com`
3. Toggle merchant mode ON
4. Stay on merchant list page

**Device B (Computer/Another Phone):**
1. Open same ngrok URL
2. Sign up as: `customer1@test.com`
3. Go to merchant list
4. **✅ Should see Device A user instantly**

### **Scenario 2: Real-Time Trade Requests**
**Device A (Merchant):**
1. Create a trade request:
   - Sell 0.01 BTC for ₦1,500,000
   - Payment: Bank Transfer
2. Submit the request

**Device B (Customer):**
1. Go to trade requests page
2. **✅ Should see Device A's request immediately**
3. Accept the trade request

**Device A (Merchant):**
1. **✅ Should get notification instantly**
2. Check trade status updates

### **Scenario 3: Cross-Device Messaging**
**Both Devices:**
1. After accepting a trade (Scenario 2)
2. Go to Messages page
3. Send messages back and forth
4. **✅ Messages should appear instantly**

## 🔧 Troubleshooting

### **Common Issues:**

**1. Ngrok URL Not Working**
```bash
# Check if ngrok is running
ps aux | grep ngrok

# Restart ngrok
ngrok http 5173
```

**2. Real-Time Updates Not Working**
```bash
# Check Supabase connection
node scripts/test-realtime-flow.js

# Verify WebSocket connections in browser dev tools
```

**3. Authentication Issues**
```bash
# Clear browser storage and try again
# Or use incognito/private browsing
```

## 📊 Testing Checklist

### **Real-Time Features to Test:**

- [ ] **Merchant Toggle**: User appears/disappears in merchant list
- [ ] **Trade Requests**: New requests appear instantly
- [ ] **Trade Acceptance**: Notifications sent immediately  
- [ ] **Status Updates**: Trade status changes in real-time
- [ ] **Messages**: Chat messages sync across devices
- [ ] **Notifications**: Alerts appear without refresh

### **Cross-Device Compatibility:**

- [ ] **Mobile Browser** (iOS Safari, Android Chrome)
- [ ] **Desktop Browser** (Chrome, Firefox, Safari)
- [ ] **Different Networks** (WiFi, Mobile Data)
- [ ] **Multiple Users** (3+ devices simultaneously)

## 🎯 Advanced Testing

### **Load Testing with Multiple Users**
```bash
# Create test users
node scripts/create-test-users.js

# Test with 5+ simultaneous connections
# Monitor performance in browser dev tools
```

### **Network Conditions Testing**
```bash
# Test with slow connections
# Use browser dev tools -> Network -> Slow 3G
```

## 🔒 Security & Best Practices

### **Do's:**
✅ Use for testing only  
✅ Test with real user flows  
✅ Monitor browser console for errors  
✅ Test on different devices/browsers  

### **Don'ts:**
❌ Share ngrok URLs publicly  
❌ Use for production  
❌ Store sensitive data during testing  
❌ Leave ngrok running unattended  

## 🚀 Production Deployment

After successful ngrok testing:

1. **Deploy Frontend**: Vercel, Netlify, or similar
2. **Configure Domain**: Point to your deployment
3. **Update Supabase**: Add production domain to allowed origins
4. **Test Production**: Repeat multi-user tests on live domain

## 📱 Mobile Testing Tips

### **iOS Testing:**
- Use Safari for best compatibility
- Test in both portrait/landscape
- Check touch interactions

### **Android Testing:**
- Use Chrome for best performance
- Test on different screen sizes
- Verify notifications work

## 🎉 Success Criteria

Your real-time P2P platform is working correctly if:

✅ **Users see each other's actions instantly**  
✅ **No page refresh needed for updates**  
✅ **Works across different devices/networks**  
✅ **Merchant mode toggle reflects immediately**  
✅ **Trade requests appear in real-time**  
✅ **Messages sync across devices**  

## 🆘 Need Help?

If you encounter issues:

1. **Check browser console** for JavaScript errors
2. **Run test scripts** to verify database connectivity
3. **Monitor network tab** for failed requests
4. **Test with simple scenarios** first

Your real-time P2P crypto trading platform is now ready for comprehensive multi-user testing! 🚀
