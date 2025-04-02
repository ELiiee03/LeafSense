<template>
  <!-- Empty template since we're using toast notifications -->
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { cloudDoneOutline, cloudOfflineOutline } from 'ionicons/icons';
import { toastController } from '@ionic/vue';
import { networkState, onNetworkChange, initNetworkService, cleanupNetworkService } from '@/services/networkService';

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

const updateNetworkStatus = async (status: { connected: boolean }) => {
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
  // Initialize the network service if it hasn't been initialized yet
  await initNetworkService();
  
  // Set initial state from network service
  isOnline.value = networkState.isOnline.value;
  previousState = networkState.isOnline.value;
  
  // Only show initial toast if offline
  if (!networkState.isOnline.value) {
    showOfflineToast();
  }
  
  // Subscribe to network changes
  const unsubscribe = onNetworkChange(updateNetworkStatus);
  
  // Also watch the reactive state
  watch(() => networkState.isOnline.value, (newValue) => {
    if (previousState !== newValue) {
      updateNetworkStatus({ connected: newValue });
    }
  });
  
  onUnmounted(() => {
    // Clean up listeners
    unsubscribe();
    
    // Clean up any remaining toast when component is unmounted
    if (offlineToast) {
      offlineToast.dismiss();
    }
  });
});
</script>

<style scoped>
/* No styles needed as we're using toast notifications */
</style> 