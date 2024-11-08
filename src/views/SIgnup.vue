<template>
    <ion-page>
      <GlobalHeader />
        <ion-content class="ion-padding" fullscreen>
          <!-- <h4><b>LeafSense.</b></h4> -->
          <div class="signup-container">
            <h1><b>Sign Up</b></h1>
            <br>
            <ion-input label="Email" label-placement="floating" fill="outline" placeholder="email@example.com"></ion-input>
            <ion-input label="Phone" label-placement="floating" fill="outline" placeholder="Phone"></ion-input>
            <ion-input label="Password" label-placement="floating" fill="outline" placeholder="password" type="password" >
              <!-- <ion-input-password-toggle slot="end"></ion-input-password-toggle> -->
            </ion-input>
            <br>
            <ion-button shape="round" expand="full" class="ion-margin-top custom-button"><b>Sign In</b></ion-button>
            <br>
          </div>
          <ion-grid>
            <ion-row>
              <ion-col></ion-col>
              <ion-col size="auto">Already have an account? <b>Sign Up</b></ion-col>
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
import GlobalHeader from '@/components/GlobalHeader.vue';
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
    GlobalHeader
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
.signup-container {
  margin-top: 20px;
  border: solid red;
}

ion-input {
  margin-bottom: 15px;
  width: 100%;
}

h1 {
  margin-bottom: 40px;
  text-align: center;
  
}
ion-icon {
  color: green;
}
ion-grid {
  margin-top: 10px;
  border: solid red;
}
ion-page {
  height: 100%;
}

ion-content {
  height: 100%;
  overflow: hidden;
  border: solid red;
}
</style>
