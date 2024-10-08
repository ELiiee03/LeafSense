<template>
    <ion-header>
        <ion-toolbar>
          <ion-title>LeafSense.</ion-title>
        </ion-toolbar>
      </ion-header>
    <ion-page>
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
                    <ion-label>Sliding Item with Icons Only</ion-label>
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
            
                <!-- Modal -->
                <ion-modal :is-open="isOpen">
                  <ion-header>
                    <ion-toolbar>
                      <ion-title>Modal</ion-title>
                      <ion-buttons slot="end">
                        <ion-button @click="setOpen(false)">Close</ion-button>
                      </ion-buttons>
                    </ion-toolbar>
                  </ion-header>
                  <ion-content class="ion-padding">
                    <p>
                      Lorem ipsum dolor sit amet consectetur adipisicing elit. Magni illum quidem recusandae ducimus quos
                      reprehenderit. Veniam, molestias quos, dolorum consequuntur nisi deserunt omnis id illo sit cum qui. Eaque,
                      dicta.
                    </p>
                  </ion-content>
                </ion-modal>
                <!-- End of Modal -->

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
                    
                    <ion-item>
                      <ion-label>Sliding Item with Icons Only</ion-label>
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
              
                    <ion-item>
                      <ion-label>Sliding Item with Icons Only</ion-label>
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
  

      const isOpen = ref(false);
  
      const setOpen = (open: boolean) => (isOpen.value = open);
  </script>

<style scoped>
ion-list {
    margin-top: 15%;
}
ion-col {
    color: #fff;
    text-align: center;
}
ion-grid {
    margin-top: 25%;
  }
</style>