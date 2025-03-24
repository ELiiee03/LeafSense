<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Verify Your Email</ion-title>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="ion-padding">
      <div class="verify-container">
        <ion-icon :icon="mailOutline" class="email-icon"></ion-icon>
        
        <h2>Check Your Email</h2>
        <p>We've sent a verification link to your email address. Please check your inbox and click the link to activate your account.</p>
        
        <div class="verification-actions">
          <ion-button expand="block" @click="checkAuthStatus" color="primary">
            <ion-spinner v-if="checking" name="crescent"></ion-spinner>
            <span v-else>I've Verified My Email</span>
          </ion-button>
          
          <ion-button expand="block" @click="resendEmail" color="medium" :disabled="resendDisabled || resending">
            <ion-spinner v-if="resending" name="crescent"></ion-spinner>
            <span v-else>Resend Verification Email {{ resendCountdown > 0 ? `(${resendCountdown}s)` : '' }}</span>
          </ion-button>
          
          <ion-button expand="block" fill="clear" @click="goToLogin">
            Back to Login
          </ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted } from 'vue';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, IonSpinner, toastController } from '@ionic/vue';
import { supabase } from '@/supabaseClient';
import { useRouter } from 'vue-router';
import { mailOutline } from 'ionicons/icons';

export default defineComponent({
  name: 'VerifyEmail',
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonSpinner
  },
  setup() {
    const router = useRouter();
    const checking = ref(false);
    const resending = ref(false);
    const resendDisabled = ref(false);
    const resendCountdown = ref(0);
    let countdownInterval: number | null = null;

    // Email stored from signup
    const userEmail = ref(localStorage.getItem('pendingVerificationEmail') || '');

    onMounted(() => {
      // Auto-check auth status periodically
      const checkInterval = setInterval(async () => {
        await checkAuthStatusQuietly();
      }, 10000); // Check every 10 seconds

      return () => {
        clearInterval(checkInterval);
        if (countdownInterval) clearInterval(countdownInterval);
      };
    });

    onUnmounted(() => {
      if (countdownInterval) clearInterval(countdownInterval);
    });

    const checkAuthStatus = async () => {
      checking.value = true;
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (session) {
          // User is authenticated, redirect to home
          showToast('Email verified successfully!');
          router.replace('/home');
        } else {
          showToast('Email not verified yet. Please check your inbox.');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        showToast('Failed to check verification status.');
      } finally {
        checking.value = false;
      }
    };

    // Silent version without UI feedback
    const checkAuthStatusQuietly = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // User is authenticated, redirect to home
          router.replace('/home');
        }
      } catch (error) {
        console.error('Silent auth check error:', error);
      }
    };

    const resendEmail = async () => {
      if (resendDisabled.value) return;
      
      resending.value = true;
      try {
        // Use the stored email or prompt user if not available
        let email = userEmail.value;
        if (!email) {
          email = prompt('Please enter your email address:') || '';
          if (!email) {
            resending.value = false;
            return;
          }
          userEmail.value = email;
          localStorage.setItem('pendingVerificationEmail', email);
        }

        const { error } = await supabase.auth.resend({
          type: 'signup',
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth-callback`
          }
        });

        if (error) throw error;
        
        showToast('Verification email resent. Please check your inbox.');
        
        // Start countdown for resend button
        resendDisabled.value = true;
        resendCountdown.value = 60;
        countdownInterval = window.setInterval(() => {
          resendCountdown.value -= 1;
          if (resendCountdown.value <= 0) {
            resendDisabled.value = false;
            if (countdownInterval) clearInterval(countdownInterval);
          }
        }, 1000);
      } catch (error) {
        console.error('Resend error:', error);
        showToast('Failed to resend verification email. Please try again.');
      } finally {
        resending.value = false;
      }
    };

    const goToLogin = () => {
      router.replace('/login');
    };

    const showToast = async (message: string) => {
      const toast = await toastController.create({
        message,
        duration: 3000,
        position: 'bottom'
      });
      await toast.present();
    };

    return {
      checking,
      resending,
      resendDisabled,
      resendCountdown,
      checkAuthStatus,
      resendEmail,
      goToLogin,
      mailOutline
    };
  }
});
</script>

<style scoped>
.verify-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 20px;
}

.email-icon {
  font-size: 64px;
  color: var(--ion-color-primary);
  margin-bottom: 20px;
}

h2 {
  margin-bottom: 10px;
  font-weight: 600;
}

p {
  margin-bottom: 30px;
  color: var(--ion-color-medium);
  max-width: 400px;
}

.verification-actions {
  width: 100%;
  max-width: 350px;
}

ion-button {
  margin-bottom: 10px;
}
</style> 