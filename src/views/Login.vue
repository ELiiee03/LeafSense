<!-- <template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Login</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-item>
        <ion-label position="floating">Email</ion-label>
        <ion-input v-model="email" type="email" placeholder="Email" fill="outline"></ion-input>
      </ion-item>
      <ion-item>
        <ion-label position="floating">Password</ion-label>
        <ion-input v-model="password" type="password" placeholder="Password" fill="outline"></ion-input>
      </ion-item>
      <ion-button expand="full" @click="login">Login</ion-button>
    </ion-content>
  </ion-page>
</template> -->

<template>
  <ion-page>
    <!-- <ion-header>
      <ion-toolbar>
        <ion-title></ion-title>
        </ion-toolbar>
      </ion-header> -->
      <ion-content class="ion-padding">
        <h4><b>LeafSense.</b></h4>
        <div class="login-container">
          <h1><b>Log In</b></h1>
          <br>
          <ion-input label="Email" label-placement="floating" fill="outline" placeholder="email@example.com"></ion-input>
          <ion-input label="Password" label-placement="floating" fill="outline" placeholder="password" type="password" >
            <!-- <ion-input-password-toggle slot="end"></ion-input-password-toggle> -->
          </ion-input>
          <br>
          <ion-button shape="round" expand="full" class="ion-margin-top custom-button"><b>Login</b></ion-button>
          <br>
          <ion-button shape="round" expand="full" class="ion-margin-top" fill="outline">
            <ion-icon src="/resources/logo-google.svg" name="logo-google" class="ion-margin-end"></ion-icon>Login with Google
          </ion-button>
        </div>
        <ion-grid>
          <ion-row>
            <ion-col></ion-col>
            <ion-col size="10">Don't have an account? <b>Sign Up</b></ion-col>
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
    IonIcon
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
  margin-top: 120px;
}

ion-input {
  margin-bottom: 20px;
  width: 100%;
}

h1 {
  margin-bottom: 80px;
  text-align: center;
}
ion-icon {
  color: green;
}
.custom-button {
  color: green;
}
ion-col {
  color: #fff;
  text-align: center;
}
ion-grid {
  margin-top: 50px;
}
</style>
