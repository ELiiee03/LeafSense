<template>
  <ion-page>
    <ion-content class="ion-padding">
      <!-- <h4><b>LeafSense.</b></h4> -->
      <div class="login-wrapper">
        <div class="container-fluid">
          <h1><b>Sign Up</b></h1>
          <br>
          <ion-input label="Email" label-placement="floating" fill="outline" placeholder="email@example.com"></ion-input>
          <ion-input label="Phone" label-placement="floating" fill="outline" placeholder="Phone"></ion-input>
          <ion-input label="Password" label-placement="floating" fill="outline" placeholder="password" type="password">
            <!-- <ion-input-password-toggle slot="end"></ion-input-password-toggle> -->
          </ion-input>
          <br>
          <ion-button shape="round" expand="full" class="ion-margin-top custom-button" @click="signUp">
            <b>Sign Up</b>
          </ion-button>
          <ion-button shape="round" expand="full" class="ion-margin-top custom-button" @click="signUpWithGoogle">
            <ion-icon name="logo-google" class="ion-margin-end"></ion-icon><b>Sign up using Google</b>
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
        </div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { IonInput, IonButton, IonLabel, IonItem, IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonIcon, IonCol, IonGrid, IonRow } from '@ionic/vue';
// import { logoIonic } from 'ionicons/icons';
import { supabase } from '@/supabaseClient';
import { useRouter } from 'vue-router';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

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
  },
  setup() {
    const email = ref('');
    const password = ref('');
    const phone = ref('');
    const router = useRouter();

    // Standard email/password signup
const signUp = async () => {
  try {
    // Add loading state
    const loading = ref(false);
    loading.value = true;
    
    const { data, error } = await supabase.auth.signUp({ 
      email: email.value, 
      password: password.value,
      options: {
        data: {
          phone: phone.value
        },
        emailRedirectTo: `${window.location.origin}/auth-callback` // Redirect after email verification
      }
    });
    
    loading.value = false;
    
    if (error) throw error;
    
    // Check if user needs to confirm their email
    if (data?.user && data.session === null) {
      // Show verification message instead of redirecting
      showToast('Verification email sent! Please check your inbox to confirm your account.');
      // Optionally route to a "verify your email" page instead of home
      router.push('/verify-email');
    } else if (data?.session) {
      // User is immediately signed in (if Supabase is configured to not require verification)
      showToast('Sign up successful!');
      router.push('/home');
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error('Signup error:', error.message);
      showToast(`Sign up failed: ${error.message}`);
    } else {
      console.error('Signup error:', error);
      showToast('Sign up failed. Please try again.');
    }
  }
};

// Simple toast function (add this to your setup function)
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

// Google OAuth signup using Capacitor Browser
const signUpWithGoogle = async () => {
  try {
    // Determine the correct redirect URL based on platform
    let redirectUrl;
    if (Capacitor.isNativePlatform()) {
      // Use capacitor:// scheme for native apps
      redirectUrl = 'capacitor://localhost/auth-callback';
    } else {
      // Use your development URL for web
      redirectUrl = 'http://192.168.1.57:8100/auth-callback';
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true, // Important: we'll handle redirect manually
      }
    });
    
    if (error) throw error;
    
    if (data?.url) {
      // Open OAuth URL in the system browser
      await Browser.open({ url: data.url });
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error('Google signup error:', error.message);
    } else {
      console.error('Google signup error:', error);
    }
  }
};
    const goToLogin = () => {
      router.push('/login');
    };

    return {
      email,
      password,
      phone,
      signUp,
      signUpWithGoogle,
      goToLogin
    };
  }
});
</script>

<style scoped>
.container-fluid {
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
.login-wrapper {
  width: 100%; /* Full width of the viewport */
  display: flex;
  justify-content: center;
}
.ion-page {
  --ion-background-color: transparent;
  width: 100%;
  height: 100vh;
  background: url("/public/leaf3.jpg") no-repeat center center;
  overflow: hidden;
}

ion-content {
  height: 100%;
  overflow: hidden;
  background-color: rgba(79, 73, 73, 0.563); 
}

ion-input {
  margin-bottom: 10px;
  width: 100%;
}

h1 {
  margin-bottom: 50px;
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

.no-blue {
  color: inherit; /* Inherit the color from the parent element */
  text-decoration: none; /* Remove underline */
}

.custom-button {
  --background: #416d3f;
  width: 95%; /* Adjust the width as needed */
  height: 45px;
  margin: 2px;
}
</style>