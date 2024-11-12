<template>
    <ion-content class="ion-padding">
        <ion-grid class="center-content">
            <ion-row>
              <ion-col>

            </ion-col>
              <ion-col size="auto">
                <h1><b>LeafSense.</b></h1>
                <p>Leaf Identification App</p>
              </ion-col>
              <ion-col>

              </ion-col>
            </ion-row>
            <!-- Signup button -->
            <ion-grid class="center-content1">
                <ion-row>
                  <ion-col>
    
                </ion-col>
                  <ion-col size="auto" class="button">
                    <ion-button class="custom-button" href="/login">Sign In</ion-button>
                    <!-- <p>Don't have an acount? Sign Up</p> -->
                  </ion-col>
                  <ion-col>
                   
                  </ion-col>
                </ion-row>
              </ion-grid>
              <p class="signuptext">Don't have an account?<a href="#">Sign Up</a></p>
          </ion-grid>

    </ion-content>
  </template>
  
  <script lang="ts">
  import { IonContent, IonButton } from '@ionic/vue';
  import { defineComponent } from 'vue';
  
  export default defineComponent({
    components: { IonContent, IonButton },
  });
  </script>
  
  <style scoped>
  h1 {
    font-size: 45px;
  }
  p {
    font-size: 20px;
    margin-top: 0;
  }
  .center-content h1, p {
    text-align: center;
    margin: auto;
    border: 3px solid red;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .center-content {
    border: 3px solid red;
    margin-top: 65%;
  }
  .ion-padding {
    border: 3px solid red;
  }
  .center-content1 {
    margin-top: 55%;
    border: 3px solid red;
  }
  .custom-button {
    width: 250px; /* Set the width to your preference */
    height: 50px; /* Optional: Adjust the height */
    --background: #034e28;
    --border-radius: 10px;
    margin-bottom: 0px;
  }
  .signuptext {
    font-size: 17px;
    color: #000;
  }
  .signuptext  a{
    font-size: 17px;
    font-weight: bold;
    color: #000;
    text-decoration: none;
  }
  </style>
  