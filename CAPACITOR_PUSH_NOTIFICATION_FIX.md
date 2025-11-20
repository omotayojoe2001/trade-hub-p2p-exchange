# Capacitor Push Notification Deployment Fix

## Issue
The edge function deployment is failing with the error:
```
Failed to deploy edge function: Failed to bundle the function (reason: Relative import path "@/integrations/supabase/client" not prefixed with / or ./ or ../ hint: If you want to use a JSR or npm package, try running `deno add jsr:@/integrations/supabase/client` or `deno add npm:@/integrations/supabase/client`)
```

## Root Cause
Deno edge functions cannot use TypeScript path aliases like `@/integrations/supabase/client`. They must use absolute URLs or relative paths.

## Solution Applied

### 1. Created Import Maps
- `supabase/functions/deno.json` - Deno configuration with import mappings
- `supabase/functions/import_map.json` - Import map to resolve path aliases
- `deno.json` - Global Deno configuration

### 2. Import Map Configuration
```json
{
  "imports": {
    "@/integrations/supabase/client": "https://esm.sh/@supabase/supabase-js@2",
    "@/integrations/supabase/types": "https://esm.sh/@supabase/supabase-js@2",
    "@/integrations/supabase/": "https://esm.sh/@supabase/supabase-js@2/",
    "@supabase/supabase-js": "https://esm.sh/@supabase/supabase-js@2"
  }
}
```

### 3. Fixed Edge Functions
- All edge functions now use `https://esm.sh/@supabase/supabase-js@2` directly
- Created `push-notification-fixed` as a backup implementation
- Added proper error handling for push notifications

## Deployment Steps

1. **Use the import map approach:**
   ```bash
   supabase functions deploy --import-map supabase/functions/import_map.json
   ```

2. **Or deploy individual functions:**
   ```bash
   supabase functions deploy send-push-notification
   supabase functions deploy push-notification-fixed
   ```

3. **Verify deployment:**
   ```bash
   supabase functions list
   ```

## Edge Function Best Practices

1. **Always use absolute URLs for imports:**
   ```typescript
   import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
   ```

2. **Avoid TypeScript path aliases in edge functions**

3. **Use import maps for complex path resolution**

4. **Test functions locally before deployment:**
   ```bash
   supabase functions serve
   ```

## Files Modified
- `supabase/functions/deno.json` - Created
- `supabase/functions/import_map.json` - Created  
- `deno.json` - Created
- `supabase/functions/push-notification-fixed/index.ts` - Created
- `supabase/functions/test-import/index.ts` - Created (for testing)

## Next Steps
1. Deploy the functions using the import map
2. Test push notifications in both web and mobile environments
3. Monitor function logs for any remaining import issues
4. Update client-side code to use the new function endpoints if needed