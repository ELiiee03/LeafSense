<template>
    <ion-page>
      <GlobalHeader />
        <ion-content>
        <ion-grid>
            <ion-row>
                <ion-col></ion-col>
                <ion-col size="8">Recent Identifications</ion-col>
                <ion-col></ion-col>
              </ion-row>
        </ion-grid>
            <ion-list>
                <ion-item-sliding>
                  <ion-item-options side="start">
                    <ion-item-option color="success">
                      <ion-icon slot="icon-only" :icon="archive"></ion-icon>
                    </ion-item-option>
                  </ion-item-options>
            
                  <ion-item button @click="setOpen(true)">
                    <ion-label>Pine Needles</ion-label>
                  </ion-item>
            
                  <ion-item-options side="end">
                    <ion-item-option>
                      <ion-icon slot="icon-only" :icon="heart"></ion-icon>
                    </ion-item-option>
                    <ion-item-option color="danger">
                      <ion-icon slot="icon-only" :icon="trash"></ion-icon>
                    </ion-item-option>
                  </ion-item-options>
                </ion-item-sliding>
            
                <!-- Use LeafInfoModal as a reusable component -->
              <LeafInfoModal :isOpen="isOpen" :onClose="() => setOpen(false)" />

                <ion-item-sliding>
                  <ion-item-options side="start">
                    <ion-item-option color="success">
                      <ion-icon slot="start" :icon="archive"></ion-icon>
                      Archive
                    </ion-item-option>
                  </ion-item-options>
                </ion-item-sliding>
                <br>

                <!-- New Slide -->
                <ion-item-sliding>
                    <ion-item-options side="start">
                      <ion-item-option color="success">
                        <ion-icon slot="icon-only" :icon="archive"></ion-icon>
                      </ion-item-option>
                    </ion-item-options>
                    
                    <ion-item button @click="setOpen(true)">
                      <ion-label>Maple Laaves</ion-label>
                    </ion-item>
              
                    <ion-item-options side="end">
                      <ion-item-option>
                        <ion-icon slot="icon-only" :icon="heart"></ion-icon>
                      </ion-item-option>
                      <ion-item-option color="danger">
                        <ion-icon slot="icon-only" :icon="trash"></ion-icon>
                      </ion-item-option>
                    </ion-item-options>
                   </ion-item-sliding>

                <!-- Use LeafInfoModal as a reusable component -->
              <LeafInfoModal :isOpen="isOpen" :onClose="() => setOpen(false)" />

                  <br>
                  <ion-item-sliding>
                    <ion-item-options side="start">
                      <ion-item-option color="success">
                        <ion-icon slot="start" :icon="archive"></ion-icon>
                        Archive
                      </ion-item-option>
                    </ion-item-options>
                  </ion-item-sliding>

                  <ion-item-sliding>
                    <ion-item-options side="start">
                      <ion-item-option color="success">
                        <ion-icon slot="icon-only" :icon="archive"></ion-icon>
                      </ion-item-option>
                    </ion-item-options>
              
                    <ion-item button @click="setOpen(true)">
                      <ion-label>Oak Tree</ion-label>
                    </ion-item>
              
                    <ion-item-options side="end">
                      <ion-item-option>
                        <ion-icon slot="icon-only" :icon="heart"></ion-icon>
                      </ion-item-option>
                      <ion-item-option color="danger">
                        <ion-icon slot="icon-only" :icon="trash"></ion-icon>
                      </ion-item-option>
                    </ion-item-options>
                  </ion-item-sliding>
              <!-- Use LeafInfoModal as a reusable component -->
              <LeafInfoModal :isOpen="isOpen" :onClose="() => setOpen(false)" />
                  <ion-item-sliding>
                    <ion-item-options side="start">
                      <ion-item-option color="success">
                        <ion-icon slot="start" :icon="archive"></ion-icon>
                        Archive
                      </ion-item-option>
                    </ion-item-options>
                  </ion-item-sliding>
              </ion-list>
        </ion-content>
    </ion-page>
   
  </template>
  
  <script setup lang="ts">
    import { IonModal, IonButton, IonGrid, IonRow, IonCol, IonHeader, IonTitle, IonToolbar, IonIcon, IonContent, IonPage, IonItem, IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonList } from '@ionic/vue';
    import { archive, heart, trash } from 'ionicons/icons';
    import { ref } from 'vue';
    import LeafInfoModal from '@/components/LeafInfoModal.vue';
    import GlobalHeader from '@/components/GlobalHeader.vue';
      

  const isOpen = ref(false);
  const capturedImage = ref('');
  
  const setOpen = (open: boolean) => (isOpen.value = open);

  // Function to set captured image
  const setCapturedImage = (image: string) => {
    capturedImage.value = image;
  }
  </script>

<style scoped>
ion-list {
    margin-top: 15%;
}
ion-col {
    text-align: center;
}
ion-grid {
    margin-top: 9%;
  }
</style>