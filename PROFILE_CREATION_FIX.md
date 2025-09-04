# 🔧 Profile Creation Fix - Users Not Appearing as Merchants ✅

## 🐛 **Root Cause Identified**

**Problem:** Users are signing up but their profiles are NOT being created in the `profiles` table.

**Evidence:** 
- Supabase profiles table shows 0 users
- All users appear as "customers" because no profiles exist
- Merchant toggle has no effect because profiles don't exist

**Root Cause:** Profile creation is failing due to RLS (Row Level Security) policies or authentication issues.

## 🔧 **Immediate Fix Steps**

### **Step 1: Fix RLS Policies in Supabase Dashboard**

1. **Go to Supabase Dashboard → SQL Editor**
2. **Run this SQL to fix RLS policies:**

```sql
-- Allow users to create their own profiles
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Allow users to update their own profiles
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Allow public read access for merchant discovery
DROP POLICY IF EXISTS "Public can view merchant profiles" ON profiles;
CREATE POLICY "Public can view merchant profiles" ON profiles
    FOR SELECT USING (is_merchant = true);
```

### **Step 2: Test Profile Creation**

1. **User A**: Sign up through your app
2. **Check Supabase**: Go to Table Editor → profiles → Should see User A's profile
3. **User B**: Sign up through your app  
4. **Check Supabase**: Should now see 2 profiles

### **Step 3: Test Merchant Toggle**

1. **User A**: Toggle merchant mode ON in app
2. **Check Supabase**: User A's `is_merchant` should become `true`
3. **User B**: Check merchant list → Should see User A

## 🧪 **Debug Current State**

```bash
# Check what's happening with profile creation
node scripts/fix-profile-creation.js
```

## 🎯 **Expected Results After Fix**

### **In Supabase Profiles Table:**
```
| user_id | display_name | user_type | is_merchant |
|---------|--------------|-----------|-------------|
| user-a  | UserA        | merchant  | true        |
| user-b  | UserB        | customer  | false       |
```

### **In Your App:**
✅ **User A (Merchant ON)**: Appears in User B's merchant list  
✅ **User B (Customer)**: Can see User A in merchant list  
✅ **Merchant toggle**: Actually changes database values  
✅ **Real-time updates**: Work across devices  

## 🔍 **Alternative Quick Fix (If RLS Still Blocks)**

If the RLS policies still don't work, temporarily disable RLS for testing:

```sql
-- TEMPORARY: Disable RLS for testing only
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
```

**⚠️ Warning:** Only use this for testing. Re-enable RLS for production:
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

## 🚀 **Complete Testing Flow**

### **After Fixing RLS Policies:**

1. **User A**: 
   - Sign up → Profile created in database ✅
   - Toggle merchant mode ON → `is_merchant = true` ✅
   - Save merchant settings → Settings saved ✅

2. **User B**:
   - Sign up → Profile created in database ✅
   - Keep merchant mode OFF → `is_merchant = false` ✅
   - Check merchant list → See User A ✅

3. **Trade Flow**:
   - User B creates trade request with User A ✅
   - User A receives notification ✅
   - Complete P2P trade flow ✅

## 🔧 **Why This Happened**

1. **RLS Policies**: Too restrictive, blocking profile creation
2. **Silent Failures**: Profile creation failed but no visible error
3. **No Fallback**: App didn't handle profile creation failures
4. **Authentication**: RLS requires proper auth context

## 📋 **Verification Checklist**

After applying the fix:

- [ ] **Profiles table** has RLS policies that allow INSERT
- [ ] **User A signup** creates profile in database
- [ ] **User B signup** creates profile in database  
- [ ] **Merchant toggle** updates `is_merchant` field
- [ ] **Merchant list** shows User A when toggled ON
- [ ] **Real-time updates** work across devices

## 🎉 **Success Criteria**

Your platform is working when:

✅ **Supabase profiles table** shows both users  
✅ **User A has `is_merchant = true`** when toggled ON  
✅ **User B can see User A** in merchant list  
✅ **Merchant toggle** actually changes database  
✅ **Trade requests** work between users  

## 💡 **If Still Not Working**

1. **Check browser console** for JavaScript errors
2. **Check Supabase logs** for failed queries
3. **Verify authentication** - users must be logged in
4. **Test with fresh browser** (incognito mode)
5. **Clear all cache** and try again

---

**The core issue is that profiles aren't being created when users sign up. Fix the RLS policies first, then test the complete flow!** 🚀
