<template>
  <ion-app>
    <ion-page id="main-content">
      <ion-content class="ion-padding">
        <ion-router-outlet></ion-router-outlet>
      </ion-content>
    </ion-page>
  </ion-app>
</template>

<script lang="ts">
import { IonApp, IonContent, IonPage, IonRouterOutlet } from '@ionic/vue';
import { defineComponent, onMounted } from 'vue';
import { syncService } from '@/services/syncService';
import { sqliteService } from '@/services/sqliteService';
import { initNetworkService, networkState, onNetworkChange, cleanupNetworkService } from '@/services/networkService';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { supabase } from './supabaseClient';
import { useRouter } from 'vue-router';
import { Capacitor } from '@capacitor/core';

export default defineComponent({
  name: 'App',
  components: {
    IonApp,
    IonRouterOutlet,
    IonContent,
    IonPage,
  },
  setup() {
    const router = useRouter();

    onMounted(async () => {
      console.log('Setting up deep link handler in App.vue');
      
      // Initialize network service
      console.log('Initializing network service...');
      await initNetworkService();
      
      // Initialize SQLite database
      try {
        console.log('Initializing SQLite database...');
        await sqliteService.initializeDatabase();
        console.log('SQLite database initialized successfully');

        // Set up network listener for syncing when back online
        const unsubscribe = onNetworkChange(async (status) => {
          console.log('Network status changed:', status);
          if (status.connected) {
            console.log('Network connected, syncing with Supabase...');
            try {
              await sqliteService.syncWithSupabase();
              console.log('Sync with Supabase completed');
            } catch (error) {
              console.error('Error syncing with Supabase:', error);
            }
          }
        });

        // Check if we're online now and sync any pending data
        if (networkState.isOnline.value) {
          console.log('Network is connected on startup, syncing...');
          await sqliteService.syncWithSupabase();
        }
      } catch (error) {
        console.error('Error initializing database:', error);
      }
      
      // Check for access token in URL hash (for web browser)
      if (window.location.hash && window.location.hash.includes('access_token')) {
        console.log('Found access token in URL hash, processing...');
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        if (accessToken) {
          // Set the session with the tokens
          supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          }).then(({ data, error }) => {
            if (error) {
              console.error('Error setting session from hash:', error);
              router.replace('/login');
            } else if (data.session) {
              console.log('Successfully set session from hash');
              // Clean up the URL by removing the hash
              window.history.replaceState(null, '', window.location.pathname);
              router.replace('/home');
            }
          });
        }
      }
      
      // Handle OAuth post-authentication for Android Nexus browsers
      // This interval checks for authentication when the callback mechanism fails
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
        console.log('Setting up Android session check interval');
        // Auto-check session periodically
        const sessionCheckInterval = setInterval(async () => {
          // Only check if we're on a login or signup page
          const currentPath = router.currentRoute.value.path;
          if (currentPath === '/login' || currentPath === '/signup' || 
              currentPath === '/auth-callback' || currentPath === '/verify-email') {
            
            console.log('Checking for session on Android...');
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session) {
              // We found a session - the user must have authenticated
              console.log('Session found during interval check!');
              clearInterval(sessionCheckInterval);
              
              // Simply redirect to home since we know we're not on home page
              console.log('Redirecting to home after detecting session');
              setTimeout(() => router.replace('/home'), 500);
            }
          }
        }, 2000); // Check every 2 seconds
        
        // Clean up interval after 5 minutes maximum
        setTimeout(() => {
          clearInterval(sessionCheckInterval);
        }, 5 * 60 * 1000);
      }
      
      // This is the critical handler for OAuth redirects
      App.addListener('appUrlOpen', async (appData: { url: string }) => {
        console.log('App opened with URL:', appData.url);
        
        // Extract tokens from URL if present
        let accessToken = null;
        let refreshToken = null;
        
        try {
          // Check for hash or query parameters
          const url = new URL(appData.url);
          
          if (url.hash && url.hash.includes('access_token')) {
            const hashParams = new URLSearchParams(url.hash.substring(1));
            accessToken = hashParams.get('access_token');
            refreshToken = hashParams.get('refresh_token');
            console.log('Found tokens in hash fragment');
            
            // Dump all token info for debugging (remove sensitive data in production)
            console.log('Access token available:', !!accessToken);
            console.log('Refresh token available:', !!refreshToken);
            const hashParamsArray = Array.from(hashParams.entries());
            console.log('Hash params:', hashParamsArray.map(entry => {
              const [key, value] = entry;
              return key === 'access_token' || key === 'refresh_token' 
                ? `${key}: [hidden]` 
                : `${key}: ${value}`;
            }));
          } else if (url.searchParams.has('access_token')) {
            accessToken = url.searchParams.get('access_token');
            refreshToken = url.searchParams.get('refresh_token');
            console.log('Found tokens in query parameters');
          }
          
          // Check if this is our OAuth callback
          if (appData.url.includes('/auth-callback') || accessToken) {
            console.log('Processing auth callback URL');
            
            try {
              // Don't close the browser immediately to ensure the user can complete authentication
              // We'll add a small delay first
              console.log('Waiting for auth to complete...');
              await new Promise(resolve => setTimeout(resolve, 3000));
              
              // Set session if we have tokens
              if (accessToken) {
                console.log('Setting session with access token');
                const { error } = await supabase.auth.setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken || '',
                });
                
                if (error) {
                  console.error('Error setting session:', error);
                  
                  // Now close the browser after auth attempt
                  if (Capacitor.isNativePlatform()) {
                    try {
                      console.log('Closing browser after auth error...');
                      await Browser.close();
                    } catch (e) {
                      console.log('Browser may already be closed:', e);
                    }
                  }
                  
                  setTimeout(() => router.replace('/login'), 500);
                  return;
                }
              }
              
              // Check authentication status
              console.log('Checking authentication status...');
              const { data: authData, error } = await supabase.auth.getSession();
              console.log('Auth check result:', !!authData?.session, error ? error.message : 'No error');
              
              // Now try to close the browser after auth check
              if (Capacitor.isNativePlatform()) {
                try {
                  console.log('Closing browser after auth check...');
                  await Browser.close();
                } catch (e) {
                  console.log('Browser may already be closed:', e);
                }
              }
              
              if (authData?.session) {
                console.log('Successfully authenticated, redirecting to home');
                // Store user info
                localStorage.setItem('userInfo', JSON.stringify({
                  id: authData.session.user.id,
                  email: authData.session.user.email,
                  lastLogin: new Date().toISOString()
                }));
                setTimeout(() => router.replace('/home'), 500);
              } else {
                console.log('No session found, redirecting to login');
                setTimeout(() => router.replace('/login'), 500);
              }
            } catch (e) {
              console.error('Error handling auth callback:', e);
              // Try to close browser before redirecting
              try {
                await Browser.close();
              } catch (browserError) {
                console.log('Browser may already be closed');
              }
              router.replace('/login');
            }
          }
        } catch (urlError) {
          console.error('Error parsing URL:', urlError);
          
          // Close browser on error
          if (Capacitor.isNativePlatform()) {
            try {
              await Browser.close();
            } catch (e) {
              console.log('Browser may already be closed');
            }
          }
        }
      });
    });

    return {};
  },
});


// onMounted(() => {
//     // Initialize sync service
//     syncService.init();
// });
</script>
<style>
:root {
  --ion-background-color: #E4EFE7;
}

ion-toolbar {
  --padding-top: env(safe-area-inset-top);
  --padding-end: env(safe-area-inset-right);
  --padding-bottom: env(safe-area-inset-bottom);
  --padding-start: env(safe-area-inset-left);
}

ion-header {
  padding-top: env(safe-area-inset-top);
}


</style>
<!-- :root {
  --ion-background-color: transparent;
} -->