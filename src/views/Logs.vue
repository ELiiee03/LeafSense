<template>
  <ion-page>
    <!-- <GlobalHeader /> -->
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-title><b><h1>History</h1></b></ion-title>
      </ion-toolbar>
    </ion-header>
      <ion-content>
      <!-- <ion-grid>
          <ion-row>
              <ion-col></ion-col>
              <ion-col size="auto">Recent Identifications</ion-col>
              <ion-col></ion-col>
            </ion-row>
      </ion-grid> -->
      
      <!-- Always render LogsComponent regardless of loading state -->
      <LogsComponent @loading-changed="handleLoadingChange" />
      </ion-content>
  </ion-page>
 
</template>

<script setup lang="ts">
  import { IonModal, IonButton, IonGrid, IonRow, IonCol, IonHeader, IonTitle, IonToolbar, IonIcon, IonContent, IonPage, IonItem, IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonList } from '@ionic/vue';
  import { archive, heart, trash } from 'ionicons/icons';
  import { ref, onMounted } from 'vue';
  import LogsComponent from '@/components/LogsComponent.vue';
  import GlobalHeader from '@/components/GlobalHeader.vue';
  import { networkState } from '@/services/networkService';
// import LeafInfoModal from '@/components/LeafInfoModal.vue';

  const isOpen = ref(false);
  const isLoading = ref(false); // Keep this false to avoid triggering spinner
  const isOnline = ref(true);

  const setOpen = (open: boolean) => (isOpen.value = open);
  
  // Simplified handler - still listen for loading changes but don't show spinner
  const handleLoadingChange = (loading: boolean) => {
    console.log('Parent received loading state:', loading);
    // Don't set loading state visibly
    isLoading.value = false;
  };
  
  onMounted(() => {
    // Initialize isOnline from the network state
    isOnline.value = networkState.isOnline.value;
    
    // Watch for network state changes
    const updateNetworkState = () => {
      isOnline.value = networkState.isOnline.value;
    };
    
    // Set up an event listener for network state changes
    window.addEventListener('network-status-changed', updateNetworkState);
    
    // Regular polling as a backup to ensure we have the latest network state
    const intervalId = setInterval(updateNetworkState, 2000);
    
    // Clean up on component unmount
    return () => {
      window.removeEventListener('network-status-changed', updateNetworkState);
      clearInterval(intervalId);
    };
  });
</script>

<style scoped>
ion-list {
margin-top: 8%;
}
ion-col {
text-align: center;
}
ion-grid {
margin-top: 5%;
}

ion-header {
  margin-top: 0 !important;
  padding-top: 0 !important;
}

ion-toolbar {
  padding-top: 30px !important;
}
</style>