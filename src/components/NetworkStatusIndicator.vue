<template>
  <!-- Empty template since we're using toast notifications -->
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { cloudDoneOutline, cloudOfflineOutline } from 'ionicons/icons';
import { Network } from '@capacitor/network';
import { toastController } from '@ionic/vue';

const isOnline = ref(true);
let previousState = true;
let offlineToast: HTMLIonToastElement | null = null;

const showOnlineToast = async () => {
  const toast = await toastController.create({
    message: 'Network connection restored',
    icon: cloudDoneOutline,
    color: 'success',
    duration: 3000,
    position: 'top'
  });
  
  await toast.present();
};

const showOfflineToast = async () => {
  // Dismiss any existing offline toast first
  if (offlineToast) {
    await offlineToast.dismiss();
  }
  
  offlineToast = await toastController.create({
    message: 'You are offline',
    icon: cloudOfflineOutline,
    color: 'danger',
    position: 'top',
    buttons: [
      {
        text: 'OK',
        role: 'cancel'
      }
    ]
  });
  
  await offlineToast.present();
};

const updateNetworkStatus = async (status: any) => {
  // Only process when the status changes
  if (previousState !== status.connected) {
    isOnline.value = status.connected;
    previousState = status.connected;
    
    if (status.connected) {
      // Online: dismiss offline toast and show temporary online toast
      if (offlineToast) {
        await offlineToast.dismiss();
        offlineToast = null;
      }
      showOnlineToast();
    } else {
      // Offline: show persistent offline toast
      showOfflineToast();
    }
  }
};

onMounted(async () => {
  const status = await Network.getStatus();
  isOnline.value = status.connected;
  previousState = status.connected;
  
  // Only show initial toast if offline
  if (!status.connected) {
    showOfflineToast();
  }
  
  Network.addListener('networkStatusChange', updateNetworkStatus);
});

onUnmounted(() => {
  // Clean up any remaining toast when component is unmounted
  if (offlineToast) {
    offlineToast.dismiss();
  }
  Network.removeAllListeners();
});
</script>

<style scoped>
/* No styles needed as we're using toast notifications */
</style> 