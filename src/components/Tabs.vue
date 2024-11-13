<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="home" href="/home">
          <ion-icon size="large" :icon="home" />
          <ion-label>Home</ion-label>
        </ion-tab-button>

        <!-- <ion-tab-button tab="radio" href="/radio">
          <ion-icon :icon="radio" />
          <ion-label>Radio</ion-label>
        </ion-tab-button> -->

        <ion-tab-button tab="library" href="/logs">
          <ion-icon size="large" :icon="albums" />
          <ion-label>Logs</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="search" href="/geo">
          <ion-icon size="large" :icon="location" />
          <ion-label>Analytics</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script lang="ts">
  import { IonPage, IonTabs, IonRouterOutlet, IonTabBar, IonTabButton, IonLabel, IonIcon } from '@ionic/vue';

  import { home, albums, location } from 'ionicons/icons';

  export default {
    components: { IonPage, IonTabs, IonRouterOutlet, IonTabBar, IonTabButton, IonLabel, IonIcon },
    data() {
      return {
        home,
        albums,
        location,
      };
    },
  };
</script>