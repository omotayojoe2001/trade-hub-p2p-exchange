@echo off
echo Setting up Push Notifications...

echo.
echo 1. Installing Supabase CLI...
npm install -g supabase

echo.
echo 2. Generating VAPID keys...
npm install -g web-push
web-push generate-vapid-keys

echo.
echo 3. Next steps:
echo    - Run: supabase login
echo    - Run: supabase link --project-ref YOUR_PROJECT_ID
echo    - Run: supabase db push
echo    - Run: supabase functions deploy send-push-notification
echo    - Update VAPID keys in pushNotificationService.ts
echo    - Add VAPID keys to Supabase environment variables

pause