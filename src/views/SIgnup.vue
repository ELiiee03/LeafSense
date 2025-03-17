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
          <ion-button shape="round" expand="full" class="ion-margin-top custom-button">
            <a href="/home" class="no-blue"><b>Sign In</b></a>
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
        const { error } = await supabase.auth.signUp({ 
          email: email.value, 
          password: password.value,
          options: {
            data: {
              phone: phone.value
            }
          } 
        });
        
        if (error) throw error;
        router.push('/home'); // Redirect to home page on successful signup
      } catch (error) {
        if (error instanceof Error) {
          console.error('Signup error:', error.message);
        } else {
          console.error('Signup error:', error);
        }
        // You can display an error message to the user here
      }
    };

        // Google OAuth signup
        const signUpWithGoogle = async () => {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin + '/home'
          }
        });
        
        if (error) throw error;
        // No need to redirect here as Supabase OAuth will handle the redirect
      } catch (error) {
        if (error instanceof Error) {
          console.error('Google signup error:', error.message);
        } else {
          console.error('Google signup error:', error);
        }
        // You can display an error message to the user here
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