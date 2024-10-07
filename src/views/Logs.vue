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
  
  <script lang="ts">
    import { IonGrid, IonRow, IonCol, IonHeader, IonTitle, IonToolbar, IonIcon, IonContent, IonPage, IonItem, IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonList } from '@ionic/vue';
    import { archive, heart, trash } from 'ionicons/icons';
    import { defineComponent } from 'vue';
  
    export default defineComponent({
      components: { IonGrid, IonRow, IonCol, IonHeader, IonTitle, IonToolbar, IonContent, IonPage, IonIcon, IonItem, IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonList },
      setup() {
        return { archive, heart, trash };
      },
    });
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