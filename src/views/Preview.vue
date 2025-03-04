<template>
  <div  class="background">
  <ion-content class="ion-padding">
    <!-- <div  class="background"> -->
    <ion-grid class="center-content">
      <ion-row>
        <ion-col></ion-col>
        <ion-col size="auto">
          <h1 class="custom-font"><b>Leaf Sense.</b></h1>
          <p>From Forest to Field, Know Every Leaf.</p>
        </ion-col>
        <ion-col></ion-col>
      </ion-row>
      <!-- Signup button -->
      <ion-grid class="center-content1">
        <ion-row>
          <ion-col></ion-col>
          <ion-col size=10 class="button">
            <ion-button class="custom-buttons1" @click="goToSignUp">Get Started</ion-button>
            <ion-button class="custom-buttons2" @click="goToLogin">Sign in</ion-button>
          </ion-col>
          <ion-col>
  
          </ion-col>
        </ion-row>
      </ion-grid>
      <!-- <p class="signuptext">Don't have an account?<a href="/login">Sign In</a></p> -->
    </ion-grid>
   <!-- </div> -->
  </ion-content>
</div>
</template>

<script lang="ts">
import { IonContent, IonButton } from '@ionic/vue';
import { useRouter } from 'vue-router';
import { defineComponent } from 'vue';
// import { window } from 'vue';

export default defineComponent({
  components: { IonContent, IonButton },

  setup() {
    const router = useRouter();

    const goToSignUp = () => {
      router.push({ name: 'signup' }); // Ensure 'signup' is the name of your signup route
    };

    const goToLogin = () => {
      router.push({ name: 'login' }); // Ensure 'login' is the name of your login route
    };

    return {
      goToSignUp,
      goToLogin,
    };
  },
});
</script>

<style scoped>
.custom-font p{
  font-family: 'Reboto', sans-serif;
}

.background {
  --ion-background-color: transparent;
  width: 100%;
  height: 100vh;
  background: url('/public/leaf2.jpg') no-repeat center center;
  background-size: cover;
}
.ion-padding {
  background-color: rgba(79, 73, 73, 0.399); 
  height: 100%;
  width: 100%;
  position: relative;
}

h1 {
  font-size: 45px;
}

p {
  font-size: 15px;
  margin-top: 0;
}

.center-content h1, p {
  text-align: center;
  margin: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffff;
}

.center-content {
  margin-top: 65%;
}

.center-content1 {
  margin-top: 35%;
}

.custom-buttons1 {
  width: 250px; /* Set the width to your preference */
  height: 50px; /* Optional: Adjust the height */
  --background: rgba(153, 158, 153, 0.786);
  --border-color: #717771; /* Add a border color */
  --border-width: 2px; /* Add a border width */
  --border-style: solid; /* Add a border style */
  --border-radius: 25px;
  margin-bottom: 0px;
}

.custom-buttons2 {
  width: 250px; /* Set the width to your preference */
  height: 50px; /* Optional: Adjust the height */
  --background: #416d3f;
  --border-radius: 25px;
  margin-top: 15px;
  margin-bottom: 0px;
}

.signuptext {
  font-size: 17px;
  color: #ffff;
}

.signuptext a {
  font-size: 17px;
  font-weight: bold;
  color: #ffff;
  text-decoration: none;
}
</style>