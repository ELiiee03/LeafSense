<template>
    <!-- <ion-content color="light">

      <ion-list :inset="true">
        <ion-item :button="true" :detail="false">
          <div class="unread-indicator-wrapper" slot="start">
            <div class="unread-indicator"></div>
          </div>
          <ion-label>
            <strong>{{ leafName }}</strong>
            <ion-text>{{ placeName }}</ion-text>
            <br />
            <ion-note color="medium" class="ion-text-wrap">
              <p>Latitude: {{ latitude }} Longitude: {{ longitude }}</p>
            </ion-note>
          </ion-label>
          <div class="center-note-wrapper" slot="end">
            <ion-note color="medium" class="center-note">{{ leafCounter }}</ion-note>
          </div>
          <div class="metadata-end-wrapper" slot="end">
            <ion-note color="medium">06:11</ion-note>
            <ion-icon color="medium" :icon="chevronForward"></ion-icon>
          </div>
        </ion-item>
      </ion-list>
    </ion-content> -->
    <ion-content color="light">
        <ion-list :inset="true">
          <ion-item v-for="location in taggedLocations" :key="location.latitude" :button="true" :detail="false">
            <div class="unread-indicator-wrapper" slot="start">
              <div class="unread-indicator"></div>
            </div>
            <ion-label>
              <strong>{{ location.leafName }}</strong>
              <ion-text>{{ location.placeName }}</ion-text>
              <br />
              <ion-note color="medium" class="ion-text-wrap">
                <p>Latitude: {{ location.latitude }} Longitude: {{ location.longitude }}</p>
              </ion-note>
            </ion-label>
            <div class="center-note-wrapper" slot="end">
              <ion-note color="medium" class="center-note">{{ location.leafCounter }}</ion-note>
            </div>
            <div class="metadata-end-wrapper" slot="end">
              <ion-note color="medium">06:11</ion-note>
              <ion-icon color="medium" :icon="chevronForward"></ion-icon>
            </div>
          </ion-item>
        </ion-list>
      </ion-content>

  </template>
  
  <script lang="ts">
    import {
      IonContent,
      IonHeader,
      IonIcon,
      IonItem,
      IonLabel,
      IonList,
      IonNote,
      IonText,
      IonTitle,
      IonToolbar,
    } from '@ionic/vue';
    import { defineComponent } from 'vue';
    import { chevronForward, listCircle } from 'ionicons/icons';
    import { useTaggedLocationsStore } from '@/stores/taggedLocations';
    
    export default defineComponent({
      components: {
        IonContent,
        IonHeader,
        IonIcon,
        IonItem,
        IonLabel,
        IonList,
        IonNote,
        IonText,
        IonTitle,
        IonToolbar,
      },
      setup() {
        const store = useTaggedLocationsStore();
        return { taggedLocations: store.taggedLocations,
            chevronForward, listCircle };
      },
    });
  </script>
  
  <style scoped>
    .unread-indicator {
      background: var(--ion-color-primary);
  
      width: 10px;
      height: 10px;
  
      border-radius: 100%;
  
      position: absolute;
  
      inset-inline-start: 12px;
      top: 12px;
    }
  
    .metadata-end-wrapper {
      position: absolute;
  
      top: 10px;
      inset-inline-end: 10px;
  
      font-size: 0.8rem;
  
      display: flex;
      align-items: center;
    }

    .center-note-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 50px;
        margin-top: 10px;
        
    }
    .center-note {
        font-size: 1.2rem;
    }

    ion-label strong {
      display: block;
  
      max-width: calc(100% - 60px);
  
      overflow: hidden;
  
      text-overflow: ellipsis;

      margin-bottom: 10px;
    }
  
    ion-label ion-note {
      font-size: 0.9rem;
    }
  </style>
