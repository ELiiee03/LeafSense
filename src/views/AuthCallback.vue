<template>
  <!-- <ion-page> -->
    <ion-content class="ion-padding">
      <div class="center-content">
        <ion-spinner name="crescent"></ion-spinner>
        <p>{{ statusMessage }}</p>
      </div>
    </ion-content>
  <!-- </ion-page> -->
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue';
import { IonPage, IonContent, IonSpinner, loadingController } from '@ionic/vue';
import { supabase } from '@/supabaseClient';
import { useRouter } from 'vue-router';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

export default defineComponent({
  components: {
    IonPage,
    IonContent,
    IonSpinner
  },
  setup() {
    const router = useRouter();
    const statusMessage = ref('Completing authentication...');

    onMounted(async () => {
      // Show loading overlay
      const loading = await loadingController.create({
        message: 'Authenticating...',
        spinner: 'crescent'
      });
      await loading.present();

      try {
        // First check for hash fragments (#) which is how many OAuth providers return tokens
        if (window.location.hash) {
          console.log('Found hash fragment in URL');
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          const expiresIn = hashParams.get('expires_in');
          
          if (accessToken) {
            console.log('Setting session from hash fragment tokens');
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });

            if (error) {
              console.error('Error setting session from hash fragment:', error.message);
              statusMessage.value = 'Failed to set session. Redirecting...';
              setTimeout(() => router.replace('/login'), 2000);
              await loading.dismiss();
              return;
            }
            
            // Successfully set session from hash tokens
            statusMessage.value = 'Authentication successful! Redirecting...';
            
            // Store user info in localStorage for app-wide access
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                localStorage.setItem('userInfo', JSON.stringify({
                  id: user.id,
                  email: user.email,
                  lastLogin: new Date().toISOString()
                }));
              }
            } catch (e) {
              console.error('Error getting user details:', e);
            }
            
            // Dismiss loading and redirect to home
            await loading.dismiss();
            router.replace('/home');
            return;
          }
        }

        // Then check for query parameters (?) which is typically used for email confirmation
        const params = new URLSearchParams(window.location.search);
        const error = params.get('error');
        const errorDescription = params.get('error_description');
        
        if (error) {
          console.error('Auth error from URL:', error, errorDescription);
          statusMessage.value = `Authentication failed: ${errorDescription || error}`;
          setTimeout(() => router.replace('/login'), 2000);
          await loading.dismiss();
          return;
        }

        // Get access token from URL if available
        const accessToken = params.get('access_token');
        if (accessToken) {
          // Set session using the access token
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: params.get('refresh_token') || '',
          });

          if (error) {
            console.error('Error setting session:', error.message);
            statusMessage.value = 'Failed to set session. Redirecting...';
            setTimeout(() => router.replace('/login'), 2000);
            await loading.dismiss();
            return;
          }
        }

        // Always check the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError.message);
          statusMessage.value = 'Authentication failed. Redirecting...';
          setTimeout(() => router.replace('/login'), 2000);
          await loading.dismiss();
          return;
        }

        if (session) {
          statusMessage.value = 'Authentication successful! Redirecting...';
          
          // Close browser if in native app
          if (Capacitor.isNativePlatform()) {
            try {
              await Browser.close();
            } catch (e) {
              console.log('Browser may already be closed');
            }
          }
          
          // Store user info in localStorage for app-wide access
          localStorage.setItem('userInfo', JSON.stringify({
            id: session.user.id,
            email: session.user.email,
            lastLogin: new Date().toISOString()
          }));

          // Dismiss loading and redirect to home
          await loading.dismiss();
          router.replace('/home');
        } else {
          statusMessage.value = 'No session found. Redirecting to login...';
          await loading.dismiss();
          setTimeout(() => router.replace('/login'), 2000);
        }
      } catch (error) {
        console.error('Error in auth callback:', error);
        statusMessage.value = 'An error occurred. Redirecting to login...';
        await loading.dismiss();
        setTimeout(() => router.replace('/login'), 2000);
      }
    });

    return {
      statusMessage
    };
  }
});
</script>
  
<style scoped>
.center-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  padding: 20px;
  text-align: center;
}

ion-spinner {
  width: 48px;
  height: 48px;
  margin-bottom: 20px;
}

p {
  font-size: 16px;
  max-width: 80%;
}
</style>