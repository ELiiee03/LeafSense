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
import { IonApp, IonContent, IonPage, IonRouterOutlet, alertController, toastController } from '@ionic/vue';
import { defineComponent, onMounted } from 'vue';
import { syncService } from '@/services/syncService';
import { sqliteService } from '@/services/sqliteService';
import { initNetworkService, networkState, onNetworkChange, cleanupNetworkService } from '@/services/networkService';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { StatusBar, Style } from '@capacitor/status-bar';
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

    // Function to configure StatusBar for device notches
    const setupStatusBar = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          // Set StatusBar to be transparent and use light text (white icons)
          await StatusBar.setOverlaysWebView({ overlay: true });
          await StatusBar.setStyle({ style: Style.Light });
          
          console.log('StatusBar configured for notch support');
        } catch (error) {
          console.error('Error configuring StatusBar:', error);
        }
      }
    };

    // Function to handle database initialization errors
    const handleDatabaseError = async (error: any) => {
      console.error('Database initialization error:', error);

      // Check if it's a foreign key constraint error
      const errorMsg = error?.message || String(error);
      const isForeignKeyError = errorMsg.includes('FOREIGN KEY constraint failed');
      
      if (isForeignKeyError) {
        // Show alert to user with option to reset database
        const alert = await alertController.create({
          header: 'Database Error',
          message: 'There was a problem with the offline database. Would you like to reset it? This will clear any unsynced plant identifications.',
          buttons: [
            {
              text: 'Cancel',
              role: 'cancel',
              handler: () => {
                console.log('Database reset cancelled');
              }
            },
            {
              text: 'Reset Database',
              role: 'confirm',
              handler: async () => {
                try {
                  // Show loading toast
                  const loadingToast = await toastController.create({
                    message: 'Resetting database...',
                    duration: 3000,
                    position: 'middle'
                  });
                  await loadingToast.present();
                  
                  // Reset database
                  const result = await sqliteService.resetDatabase();
                  
                  if (result.success) {
                    const successToast = await toastController.create({
                      message: 'Database reset successfully',
                      duration: 2000,
                      position: 'bottom',
                      color: 'success'
                    });
                    await successToast.present();
                  } else {
                    const errorToast = await toastController.create({
                      message: result.message || 'Failed to reset database',
                      duration: 3000,
                      position: 'bottom',
                      color: 'danger'
                    });
                    await errorToast.present();
                  }
                } catch (resetError) {
                  console.error('Error during database reset:', resetError);
                  const errorToast = await toastController.create({
                    message: 'Failed to reset database',
                    duration: 3000,
                    position: 'bottom',
                    color: 'danger'
                  });
                  await errorToast.present();
                }
              }
            }
          ]
        });
        
        await alert.present();
      }
    };

    onMounted(async () => {
      console.log('Setting up deep link handler in App.vue');
      
      // Configure StatusBar for notch support
      await setupStatusBar();
      
      // Initialize network service
      console.log('Initializing network service...');
      await initNetworkService();
      
      // Initialize SQLite database
      try {
        console.log('Initializing SQLite database...');
        await sqliteService.init();
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
        await handleDatabaseError(error);
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
        
        // Check if Login component is already handling this auth
        if (localStorage.getItem('auth_handling_in_progress') === 'true') {
          console.log('Auth handling in progress - App.vue will help with processing');
          // We'll continue processing to ensure session is properly established
        }
        
        // Extract tokens from URL if present
        let accessToken = null;
        let refreshToken = null;
        let redirectPath = '/home'; // Default redirect path
        
        try {
          // Check for hash or query parameters
          const url = new URL(appData.url);
          
          // Try to extract redirect path from the URL
          if (url.searchParams.has('redirect')) {
            redirectPath = url.searchParams.get('redirect') || '/home';
            console.log('Found redirect path in URL:', redirectPath);
          }
          
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
              // Immediately try to set the session if we have tokens
              let sessionSet = false;
              if (accessToken) {
                console.log('Setting session with access token immediately');
                const { data, error } = await supabase.auth.setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken || '',
                });
                
                if (error) {
                  console.error('Error setting session with tokens:', error);
                } else if (data?.session) {
                  console.log('Session successfully set with tokens');
                  sessionSet = true;
                  
                  // Store user info
                  localStorage.setItem('userInfo', JSON.stringify({
                    id: data.session.user.id,
                    email: data.session.user.email,
                    lastLogin: new Date().toISOString()
                  }));
                }
              }
              
              // Even if we didn't have tokens, check if we have a session from cookies
              if (!sessionSet) {
                console.log('Checking for session from cookies...');
                const { data: sessionData } = await supabase.auth.getSession();
                
                if (sessionData?.session) {
                  console.log('Found session from cookies');
                  sessionSet = true;
                  
                  // Store user info
                  localStorage.setItem('userInfo', JSON.stringify({
                    id: sessionData.session.user.id,
                    email: sessionData.session.user.email,
                    lastLogin: new Date().toISOString()
                  }));
                } else {
                  console.log('No session found in cookies');
                }
              }
              
              // Now try to close the browser
              if (Capacitor.isNativePlatform()) {
                try {
                  console.log('Closing browser after auth processing...');
                  await Browser.close();
                } catch (e) {
                  console.log('Browser may already be closed:', e);
                }
              }
              
              // Clear the auth handling flag
              localStorage.removeItem('auth_handling_in_progress');
              
              // Redirect based on session status
              if (sessionSet) {
                console.log('Authentication successful, redirecting to', redirectPath);
                localStorage.setItem('auth_successful', 'true');
                setTimeout(() => router.replace(redirectPath), 500);
              } else {
                console.log('Authentication failed, redirecting to login');
                setTimeout(() => router.replace('/login'), 500);
              }
            } catch (e) {
              console.error('Error handling auth callback:', e);
              localStorage.removeItem('auth_handling_in_progress');
              
              // Try to close browser before redirecting
              if (Capacitor.isNativePlatform()) {
                try {
                  await Browser.close();
                } catch (browserError) {
                  console.log('Browser may already be closed');
                }
              }
              
              router.replace('/login');
            }
          }
        } catch (urlError) {
          console.error('Error parsing URL:', urlError);
          localStorage.removeItem('auth_handling_in_progress');
          
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

/* Override safe area insets to fix large header margins - make extremely aggressive */
:root {
  --ion-safe-area-top: 0px !important; 
}

ion-header {
  padding-top: 0px !important;
  --ion-safe-area-top: 0 !important;
  margin-top: 30px !important;
}

ion-toolbar {
  --padding-top: 0 !important;
  --ion-safe-area-top: 0 !important;
  margin-top: 0 !important;
}

/* Completely disable the statusbar padding globally */
* {
  --ion-statusbar-padding: 0 !important;
}

/* Keep horizontal safe areas for side notches */
ion-toolbar {
  --padding-end: env(safe-area-inset-right);
  --padding-start: env(safe-area-inset-left);
}

/* Add support for bottom safe area (notch/home indicator) */
ion-footer {
  padding-bottom: env(safe-area-inset-bottom);
}

/* Ensure content respects safe areas */
ion-content {
  --padding-bottom: env(safe-area-inset-bottom);
}

/* Make sure tabs respect the bottom safe area */
ion-tabs ion-tab-bar {
  padding-bottom: env(safe-area-inset-bottom);
}
</style>