<template>
  <ion-page>
    <!-- <ion-header>
      <ion-toolbar>
        <ion-title></ion-title>
        </ion-toolbar>
      </ion-header> -->
      <ion-content class="ion-padding" fullscreen>
        <!-- <h4><b>LeafSense.</b></h4> -->
        <div class="login-container">
          <h1><b>Log In</b></h1>
          <br>
          <ion-input v-model="email" label="Email" label-placement="floating" fill="outline" placeholder="email@example.com"></ion-input>
          <ion-input v-model="password" label="Password" label-placement="floating" fill="outline" placeholder="password" type="password" >
            <!-- <ion-input-password-toggle slot="end"></ion-input-password-toggle> -->
          </ion-input>
          <br>
          <ion-button shape="round" expand="full" class="ion-margin-top custom-button" @click="login" :disabled="loading">
            <ion-spinner v-if="loading" name="crescent"></ion-spinner>
            <b v-else>Login</b>
          </ion-button>
          <ion-button shape="round" expand="full" class="ion-margin-top custom-button2" fill="outline" @click="loginWithGoogle" :disabled="loading">
            <ion-spinner v-if="loading" name="crescent" color="success"></ion-spinner>
            <template v-else>
              <ion-icon src="/resources/logo-google.svg" name="logo-google" class="ion-margin-end"></ion-icon>Login with Google
            </template>
          </ion-button>

          <ion-grid>
            <ion-row>
              <ion-col></ion-col>
              <ion-col size="auto">Don't have an account? <b @click="goToSignup" style="cursor: pointer;">Sign Up</b></ion-col>
              <ion-col></ion-col>
            </ion-row>
          </ion-grid>
        </div>
        
      </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted } from 'vue';
import { IonInput, IonButton, IonLabel, IonItem, IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonIcon, IonCol, IonGrid, IonRow, IonSpinner } from '@ionic/vue';
import { logoIonic } from 'ionicons/icons';
import { supabase } from '@/supabaseClient';
import { useRouter } from 'vue-router';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

export default defineComponent({
  components: {
    IonInput,
    IonButton,
    IonLabel,
    IonItem,
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonIcon,
    IonCol,
    IonGrid,
    IonRow,
    IonSpinner
  },
  setup() {
    const email = ref('');
    const password = ref('');
    const loading = ref(false);
    const router = useRouter();

    // Add DeepLink listener for handling the OAuth callback
    const setupDeepLinkListener = () => {
      App.addListener('appUrlOpen', async (data: { url: string }) => {
        console.log('App URL opened:', data.url);
        
        // Check if the URL is our auth callback URL
        if (data.url.includes('auth-callback')) {
          // Store a flag to indicate we're handling auth in Login component
          localStorage.setItem('auth_handling_in_progress', 'true');
          console.log('Auth handling started in Login component');
          
          try {
            // Close the browser after handling the auth URL
            await Browser.close();
          } catch (e) {
            console.log('Browser may already be closed');
          }
          
          // Add a delay before checking session to ensure it's established
          console.log('Waiting for session to be established...');
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Get the current session to see if user is authenticated
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Error getting session:', error.message);
            showToast(`Authentication error: ${error.message}`);
            return;
          }
          
          if (session) {
            console.log('Session found in Login component, proceeding to home');
            localStorage.setItem('auth_successful', 'true');
            showToast('Google login successful!');
            router.push('/home');
          } else {
            console.log('No session found after authentication, retrying...');
            // Try one more time after a delay before showing error
            await new Promise(resolve => setTimeout(resolve, 3000));
            const { data: retryData } = await supabase.auth.getSession();
            
            if (retryData.session) {
              console.log('Session found after retry');
              localStorage.setItem('auth_successful', 'true');
              showToast('Google login successful!');
              router.push('/home');
            } else {
              // Only show error if we're not already being redirected by App.vue
              if (window.location.pathname !== '/home') {
                showToast('Authentication failed. Please try again.');
              }
            }
          }
          
          // Clear the flag
          localStorage.removeItem('auth_handling_in_progress');
        }
      });
    };
    
    // Set up DeepLink listener on component mount
    onMounted(() => {
      setupDeepLinkListener();
    });
    
    // Clean up listener on unmount
    onUnmounted(() => {
      App.removeAllListeners();
    });

    // Standard email/password login
    const login = async () => {
      try {
        loading.value = true;
        
        const { error } = await supabase.auth.signInWithPassword({ 
          email: email.value, 
          password: password.value 
        });
        
        loading.value = false;
        
        if (error) throw error;
        showToast('Login successful!');
        
        // Check if there's a redirect path in the query params
        const redirectPath = router.currentRoute.value.query.redirect as string || '/home';
        router.push(redirectPath);
      } catch (error) {
        loading.value = false;
        if (error instanceof Error) {
          console.error('Login error:', error.message);
          showToast(`Login failed: ${error.message}`);
        } else {
          console.error('Login error:', String(error));
          showToast('Login failed. Please try again.');
        }
      }
    };

   // Google OAuth login using Capacitor Browser
    const loginWithGoogle = async () => {
      try {
        // Get the redirect path if it exists
        const redirectPath = router.currentRoute.value.query.redirect as string || '/home';
        
        // Determine the correct redirect URL based on platform
        let redirectUrl;
        if (Capacitor.isNativePlatform()) {
          // For native platforms, use capacitor:// deep link scheme
          redirectUrl = 'capacitor://localhost/auth-callback';
        } else {
          // Use full origin for web
          redirectUrl = `${window.location.origin}/auth-callback?redirect=${encodeURIComponent(redirectPath)}`;
        }
        
        console.log('Using redirect URL:', redirectUrl);
        
        // Show loading indicator
        loading.value = true;

        // Generate the OAuth URL from Supabase
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
            skipBrowserRedirect: true, // Important: we'll handle the browser redirect for native devices
            queryParams: {
              // Force account selection every time to prevent immediate redirection
              prompt: 'select_account'
            }
          }
        });
        
        if (error) throw error;
        
        if (data?.url) {
          console.log('Opening OAuth URL:', data.url);
          // Open OAuth URL in the system browser
          await Browser.open({ 
            url: data.url,
            windowName: '_blank',
            presentationStyle: 'popover', // Use popover style to prevent immediate closing
          });
          
          // We don't reset loading here since it will be handled by the callback
          // The auth state will be checked by the deep link handler in App.vue
        }
      } catch (error) {
        loading.value = false;
        if (error instanceof Error) {
          console.error('Google login error:', error.message);
          showToast(`Google login failed: ${error.message}`);
        } else {
          console.error('Google login error:', String(error));
          showToast('Google login failed. Please try again.');
        }
      }
    };

    // Simple toast function
    const showToast = (message: string) => {
      // Use Ionic Toast or a custom implementation
      const ionicWindow = window as any;
      if (ionicWindow?.Ionic?.toastController) {
        ionicWindow.Ionic.toastController
          .create({
            message: message,
            duration: 3000,
            position: 'bottom'
          })
          .then((toast: any) => toast.present());
      } else {
        // Fallback to alert if toast not available
        alert(message);
      }
    };

    const goToSignup = () => {
      router.push('/signup');
    };

    return {
      email,
      password,
      loading,
      login,
      loginWithGoogle,
      goToSignup
    };
  }
});
</script>

<style scoped>
/* Center the form */
.login-container {
  position: absolute; /* Position the container absolutely */
  top: 30%; /* Adjust the top position as needed */
  left: 0;
  width: 100%; /* Full width of the viewport */
  height: 70vh; /* 75% of the viewport height */
  background-color: white;
  display: flex; /* Center content */
  flex-direction: column; /* Stack child elements vertically */
  justify-content: center; /* Center vertically */
  align-items: center; /* Center horizontally */
  box-sizing: border-box; /* Include padding/border in the dimensions */
  padding: 20px; /* Optional padding for aesthetics */
  border-top-left-radius: 30px; /* Apply border-radius to the top-left corner */
  border-top-right-radius: 30px;
}

ion-input {
  margin-bottom: 10px;
  width: 100%;
}

h1 {
  margin-bottom: 60px;
  text-align: center;
}
ion-icon {
  color: green;
}

ion-col {
  text-align: center;
}
ion-grid {
  margin-top: 40px;
}
/* Ensure the content takes full height */
.ion-page {
  --ion-background-color: transparent;
  width: 100%;
  height: 100vh;
  background: url('/public/leaf3.jpg') no-repeat center center;
  overflow: hidden;
}

ion-content {
  height: 100%;
  overflow: hidden;
  background-color: rgba(79, 73, 73, 0.563); 
}
.custom-button {
  --background: #416d3f;
  width: 95%; /* Adjust the width as needed */
  height: 40px;
  margin: 2px;
}
.custom-button2 {
  --border-color: #228B22;
  color: black;
  width: 95%; /* Adjust the width as needed */
  height: 38px;
  margin: 2px;
  margin-top: 10px;
}
</style>
