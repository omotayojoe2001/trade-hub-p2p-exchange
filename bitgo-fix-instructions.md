# BitGo IP Restriction Fix

## The Problem
Your BitGo token has IP restrictions, but Supabase Edge Functions run from `eu-west-2` with dynamic IPs that change constantly.

## The Solution (From Conversation History)
Create a new BitGo access token **WITHOUT IP restrictions**:

1. **Go to BitGo Dashboard**
2. **Settings → Developer Options → Access Tokens**
3. **Create New Token**
4. **IMPORTANT: Leave IP restrictions BLANK/EMPTY**
5. **Copy the new token**
6. **Update Supabase Environment Variable:**
   - Go to Supabase Dashboard → Settings → Edge Functions → Environment Variables
   - Update `BITGO_ACCESS_TOKEN` with the new unrestricted token

## Why This Works
- IP-restricted tokens fail because Supabase uses dynamic IPs
- Unrestricted tokens work from any IP address
- This was the exact solution that worked before

## Alternative (If you must keep IP restrictions)
Add these Supabase IP ranges to your BitGo token whitelist:
- `18.130.0.0/16` (eu-west-2)
- `35.176.0.0/15` (eu-west-2)
- But this is less reliable than removing restrictions entirely