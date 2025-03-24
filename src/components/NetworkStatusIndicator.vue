<template>
  <div class="network-status" :class="{ 'offline': !isOnline }">
    <ion-icon :icon="isOnline ? cloudDoneOutline : cloudOfflineOutline" />
    <span>{{ isOnline ? 'Online' : 'Offline' }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { cloudDoneOutline, cloudOfflineOutline } from 'ionicons/icons';
import { Network } from '@capacitor/network';

const isOnline = ref(true);

const updateNetworkStatus = async (status: any) => {
  isOnline.value = status.connected;
};

onMounted(async () => {
  const status = await Network.getStatus();
  isOnline.value = status.connected;
  
  Network.addListener('networkStatusChange', updateNetworkStatus);
});

onUnmounted(() => {
  Network.removeAllListeners();
});
</script>

<style scoped>
.network-status {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 16px;
  font-size: 0.8rem;
  background-color: #E6F4E6;
  color: #1E8E3E;
  transition: all 0.3s ease;
}

.network-status.offline {
  background-color: #FCE8E6;
  color: #C5221F;
}

.network-status ion-icon {
  font-size: 1rem;
}
</style> 