<template>
    <ion-page>
      <GlobalHeader />
        <ion-content>
        <ion-grid>
            <ion-row>
                <ion-col></ion-col>
                <ion-col size="auto">Recent Identifications</ion-col>
                <ion-col>

                </ion-col>
              </ion-row>
        </ion-grid>
        <LogsComponent />
        </ion-content>
    </ion-page>
   
  </template>
  
  <script setup lang="ts">
    import { IonModal, IonButton, IonGrid, IonRow, IonCol, IonHeader, IonTitle, IonToolbar, IonIcon, IonContent, IonPage, IonItem, IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonList } from '@ionic/vue';
    import { archive, heart, trash } from 'ionicons/icons';
    import { ref } from 'vue';
    import LogsComponent from '@/components/LogsComponent.vue';
    import GlobalHeader from '@/components/GlobalHeader.vue';
  // import LeafInfoModal from '@/components/LeafInfoModal.vue';
  

      const isOpen = ref(false);
  
      const setOpen = (open: boolean) => (isOpen.value = open);
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
</style>