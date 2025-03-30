# Setting Up Google OAuth for Physical Devices with Supabase

This guide explains how to properly configure Supabase and your app for Google OAuth authentication on physical devices.

## Supabase Configuration

1. Go to your Supabase dashboard → Authentication → URL Configuration
2. Set your Site URL to: `http://localhost:8100` (for development)
3. Add the following Redirect URLs:
   - `capacitor://localhost/auth-callback` (for native apps)
   - `http://localhost:8100/auth-callback` (for web development)
   - `http://YOUR_DEVICE_IP:8100/auth-callback` (optional, for testing on the same network)

## URL Callback Structure

The Supabase callback URL is automatically handled by Supabase:

```
https://ybgmtdzmmqkgllrxshst.supabase.co/auth/v1/callback
```

You don't need to add this URL to your code. It's the endpoint that Google redirects to after authentication, and then Supabase redirects to your app using the redirect URL you specified.

## Understanding the 302 Status Codes

The 302 status codes you see in the Supabase logs are normal. They indicate:

- `/auth/v1/authorize` (302) - Initial OAuth request that redirects to Google
- `/auth/v1/callback` (302) - Google redirecting back to Supabase, which then redirects to your app

## Fixing "Browser Closes Immediately" Issue

If your browser closes immediately without showing the Google account selection screen:

1. Make sure you're using `prompt: 'select_account'` in your OAuth query parameters to force account selection
2. Verify you're using `skipBrowserRedirect: true` and handling the redirection manually
3. Increase the delay before closing the browser in the auth callback handler
4. Use `presentationStyle: 'popover'` in Browser.open options to prevent immediate closing
5. Check the order of operations: only close the browser AFTER authentication is confirmed

The updated loginWithGoogle function in Login.vue should now:

1. Open the browser with the correct presentation style
2. Force Google to show the account selection screen
3. Wait for the user to complete the authentication
4. Process the tokens and set the session before closing the browser

## For Physical Devices

When testing on physical devices, make sure:

1. Your app has properly registered the deep link scheme `capacitor://` in your Capacitor configuration
2. The Google OAuth provider in Supabase is configured with the correct client ID and secret
3. The `redirectTo` URL in your code matches exactly what you configured in Supabase

## Troubleshooting

If you're experiencing issues:

1. Check the console logs for errors
2. Verify that the browser opens and properly redirects after authentication
3. Make sure your physical device can access the internet
4. If using a specific IP address, ensure it's the correct IP of your device on the network
5. For Android, verify that the deep link handling is properly configured in your AndroidManifest.xml

## Common Issues

- **Browser closes immediately**: This is often due to misconfigured redirect URLs or timing issues
- **"Site cannot be reached"**: The redirect URL doesn't match what's configured in Supabase
- **No session after login**: The tokens aren't being properly processed - check for console errors
- **Template literals in error messages**: Check for proper string interpolation in error message handling

## Testing Deep Links

You can test deep links with ADB on Android:

```
adb shell am start -a android.intent.action.VIEW -d "capacitor://localhost/auth-callback" your.package.name
```

## Required Capacitor Configuration

Make sure your `capacitor.config.ts` includes:

```typescript
export default {
  appId: "your.app.id",
  appName: "Your App Name",
  webDir: "dist",
  server: {
    androidScheme: "capacitor",
    iosScheme: "capacitor",
    allowNavigation: ["localhost", "*.supabase.co"],
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
};
```
