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
        
        <!-- Loading state -->
        <div class="loading-state" v-if="isLoading">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Loading leaves...</p>
        </div>
        
        <!-- Always mount LogsComponent but conditionally render content -->
        <div v-show="!isLoading">
          <LogsComponent @loading-changed="handleLoadingChange" />
        </div>
        </ion-content>
    </ion-page>
   
  </template>
  
  <script setup lang="ts">
    import { IonModal, IonButton, IonGrid, IonRow, IonCol, IonHeader, IonTitle, IonToolbar, IonIcon, IonContent, IonPage, IonItem, IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonList, IonSpinner } from '@ionic/vue';
    import { archive, heart, trash } from 'ionicons/icons';
    import { ref } from 'vue';
    import LogsComponent from '@/components/LogsComponent.vue';
    import GlobalHeader from '@/components/GlobalHeader.vue';
  // import LeafInfoModal from '@/components/LeafInfoModal.vue';
  

    const isOpen = ref(false);
    const isLoading = ref(true);

    const setOpen = (open: boolean) => (isOpen.value = open);
    
    const handleLoadingChange = (loading: boolean) => {
      isLoading.value = loading;
    };
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

/* Loading state styles */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 70vh;
  text-align: center;
  color: var(--ion-color-medium);
}

.loading-state ion-spinner {
  width: 48px;
  height: 48px;
  margin-bottom: 16px;
}

.loading-state p {
  margin: 8px 0;
  font-size: 16px;
}
</style>