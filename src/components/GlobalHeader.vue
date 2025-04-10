<template>
  <ion-header class="ion-no-border">
    <ion-toolbar>
      <ion-title><b>LeafSense.</b></ion-title>
      <ion-buttons slot="end">
        <ion-button @click="logout">
          <ion-icon size="large" :icon="logOutOutline" slot="start"></ion-icon>
        </ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuButton, IonButton, IonIcon, toastController } from '@ionic/vue';
import { logOutOutline } from 'ionicons/icons';
import { supabase } from '@/supabaseClient';
import { useRouter } from 'vue-router';

export default defineComponent({
  name: 'GlobalHeader',
  components: {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonMenuButton,
    IonButton,
    IonIcon
  },
  setup() {
    const router = useRouter();
    
    // Logout function
    const logout = async () => {
      try {
        // Show loading toast
        const loadingToast = await toastController.create({
          message: 'Logging out...',
          duration: 2000,
          position: 'bottom'
        });
        await loadingToast.present();
        
        // Call Supabase signOut
        const { error } = await supabase.auth.signOut();
        
        if (error) {
          throw error;
        }
        
        // Clear any user data from localStorage
        localStorage.removeItem('userInfo');
        localStorage.removeItem('pendingVerificationEmail');
        
        // Show success message
        const successToast = await toastController.create({
          message: 'Logged out successfully',
          duration: 2000,
          position: 'bottom'
        });
        await loadingToast.dismiss();
        await successToast.present();
        
        // Redirect to login page
        router.replace('/preview');
      } catch (error) {
        console.error('Logout error:', error);
        
        // Show error toast
        const errorToast = await toastController.create({
          message: 'Failed to logout. Please try again.',
          duration: 3000,
          position: 'bottom',
          color: 'danger'
        });
        await errorToast.present();
      }
    };
    
    return {
      logOutOutline,
      logout
    };
  }
});
</script>
<style scoped>
ion-toolbar {
  --color: black;
}
</style>