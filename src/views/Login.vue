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
          <ion-input label="Email" label-placement="floating" fill="outline" placeholder="email@example.com"></ion-input>
          <ion-input label="Password" label-placement="floating" fill="outline" placeholder="password" type="password" >
            <!-- <ion-input-password-toggle slot="end"></ion-input-password-toggle> -->
          </ion-input>
          <br>
          <ion-button shape="round" expand="full" class="ion-margin-top custom-button"><b>Login</b></ion-button>
          <ion-button shape="round" expand="full" class="ion-margin-top" fill="outline">
            <ion-icon src="/resources/logo-google.svg" name="logo-google" class="ion-margin-end"></ion-icon>Login with Google
          </ion-button>
        </div>
        <ion-grid>
          <ion-row>
            <ion-col></ion-col>
            <ion-col size="auto">Don't have an account? <b>Sign Up</b></ion-col>
            <ion-col></ion-col>
          </ion-row>
        </ion-grid>
        
      </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { IonInput, IonButton, IonLabel, IonItem, IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonIcon, IonCol, IonGrid, IonRow  } from '@ionic/vue';
import { logoIonic } from 'ionicons/icons';
// import { supabase } from '@/supabase';
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
    IonCol,
    IonGrid,
    IonRow
  },
  // setup() {
  //   const email = ref('');
  //   const password = ref('');
  //   const router = useRouter();

  //   const login = async () => {
  //     try {
  //       const { error } = await supabase.auth.signInWithPassword({ email: email.value, password: password.value });
  //       if (error) throw error;
  //       router.push('/home'); // Redirect to home page on successful login
  //     } catch (error) {
  //       console.error('Login error:', error.message);
  //       // You can display an error message to the user here
  //     }
  //   };

//     return {
//       email,
//       password,
//       login
//     };
//   }
});
</script>

<style scoped>
/* Center the form */
.login-container {
  margin-top: 115px;
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
  height: 100%;
}

.ion-content {
  height: 100%;
  overflow: hidden;
}
</style>
