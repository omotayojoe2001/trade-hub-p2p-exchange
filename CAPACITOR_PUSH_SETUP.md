# Capacitor Push Notifications Setup

## Required Packages

Install the Capacitor Push Notifications plugin:

```bash
npm install @capacitor/push-notifications
npx cap sync
```

## Platform Configuration

### Android (android/app/src/main/AndroidManifest.xml)
Add these permissions:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="com.google.android.c2dm.permission.RECEIVE" />
```

### iOS (ios/App/App/Info.plist)
No additional configuration needed for basic push notifications.

## Firebase Setup (for Android)

1. Create a Firebase project
2. Add your Android app to Firebase
3. Download `google-services.json` and place it in `android/app/`
4. Add Firebase SDK to `android/app/build.gradle`

## APNs Setup (for iOS)

1. Create an APNs certificate in Apple Developer Console
2. Configure your app identifier with Push Notifications capability
3. Add the certificate to your push notification service

## How It Works

- **Native Mobile**: Uses Capacitor's native push notification APIs
- **Web Browser**: Falls back to Web Push API with service workers
- **Permission Request**: Shows native OS permission dialog on mobile
- **Notifications**: Delivered through native notification system with vibration

## Testing

1. Enable notifications in Settings
2. Check console for registration success
3. Send test notifications from your backend
4. Notifications will appear in the device's notification center