<template>
    <ion-page>
      <GlobalHeader />
        <ion-content>
        <!-- <ion-grid>
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
                    <ion-thumbnail slot="start">
                      <img alt="Silhouette of mountains" src="/resources/pine needle.jpg" />
                    </ion-thumbnail>
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
            
                <!-- Use LeafInfoModal as a reusable component
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

                <!-- New Slide
                <ion-item-sliding>
                    <ion-item-options side="start">
                      <ion-item-option color="success">
                        <ion-icon slot="icon-only" :icon="archive"></ion-icon>
                      </ion-item-option>
                    </ion-item-options>
                    
                    <ion-item button @click="setOpen(true)">
                      <ion-thumbnail slot="start">
                        <img alt="Silhouette of mountains" src="/resources/maple.jpg" />
                      </ion-thumbnail>
                      <ion-label>Maple Leaves</ion-label>
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

                <!-- Use LeafInfoModal as a reusable component
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
                      <ion-thumbnail slot="start">
                        <img alt="Silhouette of mountains" src="/resources/oak-tree.jpg" />
                      </ion-thumbnail>
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
              <!-- Use LeafInfoModal as a reusable component
              <LeafInfoModal :isOpen="isOpen" :onClose="() => setOpen(false)" />
                  <ion-item-sliding>
                    <ion-item-options side="start">
                      <ion-item-option color="success">
                        <ion-icon slot="start" :icon="archive"></ion-icon>
                        Archive
                      </ion-item-option>
                    </ion-item-options>
                  </ion-item-sliding>
              </ion-list> -->
              <ion-grid>
                <ion-row>
                  <ion-col></ion-col>
                  <ion-col size="8">Recent Identifications</ion-col>
                  <ion-col></ion-col>
                </ion-row>
              </ion-grid>
              <ion-list>
                <ion-item-sliding v-for="log in logs" :key="log.id">
                  <ion-item-options side="start">
                    <ion-item-option color="success">
                      <ion-icon slot="icon-only" :icon="archive"></ion-icon>
                    </ion-item-option>
                  </ion-item-options>
                  <ion-item button @click="openLog(log)">
                    <ion-thumbnail slot="start">
                      <img :alt="log.leaf.name" :src="log.imageSrc" />
                    </ion-thumbnail>
                    <ion-label>{{ log.leaf.name }}</ion-label>
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
                <LeafInfoModal :isOpen="isOpen" :onClose="closeLog" :imageSrc="selectedLog?.imageSrc" :leaf="selectedLog?.leaf" />
              </ion-list>
        </ion-content>
    </ion-page>
   
  </template>
  
  <script setup lang="ts">
    import { IonModal, IonButton, IonGrid, IonRow, IonCol, IonHeader, IonTitle, IonToolbar, IonIcon, IonContent, IonPage, IonItem, IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonList, IonThumbnail } from '@ionic/vue';
    import { archive, heart, trash } from 'ionicons/icons';
  import { ref } from 'vue';
  import { useLogsStore } from '../stores/logs';
    import LeafInfoModal from '@/components/LeafInfoModal.vue';
    import GlobalHeader from '@/components/GlobalHeader.vue';

    
interface Leaf {
  name: string;
  scientificName: string;
  description: string;
  uses: string;
  habitat: string;
  medicinalValues: string;
}

interface Log {
  id: number;
  imageSrc: string;
  leaf: Leaf;
}

  const isOpen = ref(false);
  const store = useLogsStore();
  const logs = store.logs;
  // const capturedImage = ref('');
  const selectedLog = ref<Log | null>(null);
  
  const setOpen = (open: boolean) => (isOpen.value = open);
  const openLog = (log: Log) => {
    selectedLog.value = log;
    setOpen(true);
  };
  
  const closeLog = () => {
      selectedLog.value = null;
      setOpen(false);
    };

  // // Function to set captured image
  // const setCapturedImage = (image: string) => {
  //   capturedImage.value = image;
  // }
  </script>
<style scoped>
ion-list {
    margin-top: 8%;
}
ion-col {
    text-align: center;
}
ion-grid {
    margin-top: 9%;
  }
</style>
 