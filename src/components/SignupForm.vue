<template>
  <div class="signup-form">
    <h1><b>Sign Up</b></h1>
    <br>
    <ion-input v-model="email" label="Email" label-placement="floating" fill="outline" placeholder="email@example.com"></ion-input>
    <ion-input v-model="phone" label="Phone" label-placement="floating" fill="outline" placeholder="Phone"></ion-input>
    <ion-input v-model="password" label="Password" label-placement="floating" fill="outline" placeholder="password" type="password">
      <ion-input-password-toggle slot="end"></ion-input-password-toggle>
    </ion-input>
    <br>
    <ion-button shape="round" expand="full" class="ion-margin-top custom-button" @click="signUp" :disabled="loading">
      <ion-spinner v-if="loading" name="crescent"></ion-spinner>
      <b v-else>Sign Up</b>
    </ion-button>
    <ion-button shape="round" expand="full" class="ion-margin-top custom-button" @click="signUpWithGoogle" :disabled="loading">
      <ion-spinner v-if="googleLoading" name="crescent"></ion-spinner>
      <template v-else>
        <ion-icon name="logo-google" class="ion-margin-end"></ion-icon><b>Sign up using Google</b>
      </template>
    </ion-button>
    <br>
    <ion-grid>
      <ion-row>
        <ion-col></ion-col>
        <ion-col size="12">Already have an account? <b @click="goToLogin" style="cursor: pointer;">Sign In</b></ion-col>
        <ion-col></ion-col>
      </ion-row>
    </ion-grid>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted } from 'vue';
import { IonInput, IonButton, IonIcon, IonCol, IonGrid, IonRow, IonSpinner, IonInputPasswordToggle } from '@ionic/vue';
import { supabase } from '@/supabaseClient';
import { useRouter } from 'vue-router';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

export default defineComponent({
  components: {
    IonInput,
    IonButton,
    IonIcon,
    IonCol,
    IonGrid,
    IonRow,
    IonSpinner,
    IonInputPasswordToggle
  },
  emits: ['signup-success', 'verification-sent'],
  setup(props, { emit }) {
    const email = ref('');
    const password = ref('');
    const phone = ref('');
    const loading = ref(false);
    const googleLoading = ref(false);
    const router = useRouter();

    // Check session on component mount
    onMounted(async () => {
      setupDeepLinkListener();
      await checkCurrentSession();
    });
    
    // Check if user is already authenticated
    const checkCurrentSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session) {
        // User is already authenticated, redirect to home
        router.replace('/home');
      }
    };

    // Add DeepLink listener for handling the OAuth callback
    const setupDeepLinkListener = () => {
      App.addListener('appUrlOpen', async (data: { url: string }) => {
        console.log('App URL opened:', data.url);
        
        // Check if the URL is our auth callback URL
        if (data.url.includes('auth-callback')) {
          // Reset loading state and close browser
          googleLoading.value = false;
          loading.value = false;
          try {
            await Browser.close();
          } catch (e) {
            console.log('Browser may already be closed', e);
          }
          
          // Get the current session to see if user is authenticated
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Error getting session:', error.message);
            showToast(`Authentication error: ${error.message}`);
            return;
          }
          
          if (session) {
            showToast('Authentication successful!');
            emit('signup-success', session.user);
            router.replace('/home');
          } else {
            showToast('Authentication failed. Please try again.');
            router.push('/login');
          }
        }
      });
    };
    
    // Clean up listener on unmount
    onUnmounted(() => {
      App.removeAllListeners();
    });

    // Standard email/password signup
    const signUp = async () => {
      try {
        // Input validation
        if (!email.value || !password.value) {
          showToast('Please provide both email and password.');
          return;
        }
        
        loading.value = true;
        
        // For mobile platforms, customize the redirect URL
        const redirectUrl = Capacitor.isNativePlatform() 
          ? 'capacitor://localhost/auth-callback'
          : `${window.location.origin}/auth-callback`;
        
        const { data, error } = await supabase.auth.signUp({ 
          email: email.value, 
          password: password.value,
          options: {
            data: {
              phone: phone.value
            },
            emailRedirectTo: redirectUrl
          }
        });
        
        loading.value = false;
        
        if (error) throw error;
        
        // Check if user needs to confirm their email
        if (data?.user && data.session === null) {
          // Store email for verification page
          localStorage.setItem('pendingVerificationEmail', email.value);
          
          // Show verification message instead of redirecting
          showToast('Verification email sent! Please check your inbox to confirm your account.');
          emit('verification-sent');
          router.push('/verify-email');
        } else if (data?.session) {
          // User is immediately signed in (if Supabase is configured to not require verification)
          showToast('Sign up successful!');
          emit('signup-success', data.user);
          router.replace('/home');
        }
      } catch (error) {
        loading.value = false;
        if (error instanceof Error) {
          console.error('Signup error:', error.message);
          showToast(`Sign up failed: ${error.message}`);
        } else {
          console.error('Signup error:', error);
          showToast('Sign up failed. Please try again.');
        }
      }
    };

    // Google OAuth signup using Capacitor Browser
    const signUpWithGoogle = async () => {
      try {
        googleLoading.value = true;
        
        // Determine the correct redirect URL based on platform
        const redirectUrl = Capacitor.isNativePlatform()
          ? 'capacitor://localhost/auth-callback'
          : `${window.location.origin}/auth-callback`;

        console.log('Using redirect URL:', redirectUrl);

        // For Android, check if we need to use an alternative approach
        const isAndroid = Capacitor.getPlatform() === 'android';
        
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
            skipBrowserRedirect: true,
          }
        });
        
        if (error) throw error;
        
        if (data?.url) {
          console.log('Opening auth URL:', data.url);
          
          // Use different approach for Android - especially for Nexus devices
          if (isAndroid) {
            console.log('Using Android-specific OAuth approach');
            try {
              // Use specific browser options for Android
              await Browser.open({ 
                url: data.url,
                windowName: '_blank', // Try blank instead of self on Android
                presentationStyle: 'popover' // Use popover style instead of fullscreen
              });
              
              // Android needs special handling for session checking
              // Set up an interval to check for authentication
              let checkCount = 0;
              const maxChecks = 30; // Check for 30 seconds max
              
              const sessionCheckInterval = setInterval(async () => {
                checkCount++;
                console.log(`Checking session (${checkCount}/${maxChecks})...`);
                
                const { data: { session } } = await supabase.auth.getSession();
                
                if (session) {
                  // We have a session! User is authenticated
                  clearInterval(sessionCheckInterval);
                  googleLoading.value = false;
                  
                  try {
                    // Try to close browser
                    await Browser.close();
                  } catch (e) {
                    console.log('Browser may already be closed', e);
                  }
                  
                  showToast('Authentication successful!');
                  emit('signup-success', session.user);
                  router.replace('/home');
                  
                } else if (checkCount >= maxChecks) {
                  // Give up after max checks
                  clearInterval(sessionCheckInterval);
                  googleLoading.value = false;
                  showToast('Authentication timed out. Please try again.');
                }
              }, 1000);
              
            } catch (e) {
              console.error('Android browser error:', e);
              googleLoading.value = false;
              showToast('Failed to open authentication window.');
            }
          } else {
            // Original approach for non-Android platforms
            await Browser.open({ 
              url: data.url,
              windowName: '_self'
            });
            
            // Note: googleLoading will be reset by the callback handler
            // But add a timeout to reset it if callback doesn't trigger
            setTimeout(() => {
              googleLoading.value = false;
            }, 30000); // Reset after 30 seconds
          }
        } else {
          googleLoading.value = false;
          showToast('Failed to start Google authentication');
        }
      } catch (error) {
        googleLoading.value = false;
        if (error instanceof Error) {
          console.error('Google signup error:', error.message);
          showToast(`Google sign up failed: ${error.message}`);
        } else {
          console.error('Google signup error:', error);
          showToast('Google sign up failed. Please try again.');
        }
      }
    };

    const goToLogin = () => {
      router.push('/login');
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

    return {
      email,
      password,
      phone,
      loading,
      googleLoading,
      signUp,
      signUpWithGoogle,
      goToLogin
    };
  }
});
</script>

<style scoped>
.signup-form {
  width: 100%;
  max-width: 500px;
}

ion-input {
  margin-bottom: 10px;
  width: 100%;
}

h1 {
  margin-bottom: 20px;
  text-align: center;
}

ion-icon {
  color: green;
}

ion-col {
  text-align: center;
}

ion-grid {
  margin-top: 15px;
}

.custom-button {
  --background: #416d3f;
  width: 95%;
  height: 45px;
  margin: 2px;
}
</style>