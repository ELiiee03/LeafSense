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
          <ion-button shape="round" expand="full" class="ion-margin-top custom-button2" fill="outline">
            <ion-icon src="/resources/logo-google.svg" name="logo-google" class="ion-margin-end"></ion-icon>Login with Google
          </ion-button>

          <ion-grid>
            <ion-row>
              <ion-col></ion-col>
              <ion-col size="auto">Don't have an account? <b>Sign Up</b></ion-col>
              <ion-col></ion-col>
            </ion-row>
          </ion-grid>
        </div>
        
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
  position: absolute; /* Position the container absolutely */
  top: 30%; /* Adjust the top position as needed */
  left: 0;
  width: 100%; /* Full width of the viewport */
  height: 70vh; /* 75% of the viewport height */
  background-color: #DCE6CC;
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
  background: url("resources/leaf3.jpg") no-repeat center center;
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
