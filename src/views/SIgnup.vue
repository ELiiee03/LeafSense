<template>
  <ion-page>
    <ion-content class="ion-padding">
      <div class="login-wrapper">
        <div class="container-fluid">
          <SignupForm @signup-success="handleSignupSuccess" @verification-sent="handleVerificationSent" />
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { IonContent, IonPage } from '@ionic/vue';
import { useRouter } from 'vue-router';
import SignupForm from '@/components/SignupForm.vue';

export default defineComponent({
  components: {
    IonContent,
    IonPage,
    SignupForm
  },
  setup() {
    const router = useRouter();

    const handleSignupSuccess = (user: any) => {
      console.log('User signed up successfully:', user);
      router.push('/home');
    };

    const handleVerificationSent = () => {
      console.log('Verification email sent');
      router.push('/verify-email');
    };

    return {
      handleSignupSuccess,
      handleVerificationSent
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
</style>