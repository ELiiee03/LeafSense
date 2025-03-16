<template>
  <ion-app>
    <ion-page id="main-content">
      <ion-content class="ion-padding">
        <ion-router-outlet></ion-router-outlet>
      </ion-content>
    </ion-page>
  </ion-app>
</template>

<script lang="ts">
import { IonApp, IonContent, IonPage, IonRouterOutlet } from '@ionic/vue';
import { defineComponent, onMounted } from 'vue';
import { syncService } from '@/services/syncService';
// import { Network } from '@capacitor/network';


export default defineComponent({
  name: 'App',
  components: {
    IonApp,
    IonContent,
    IonPage,
    IonRouterOutlet,
  }
});


onMounted(() => {
    // Initialize sync service
    syncService.init();
});
</script>
<style>
:root {
  --ion-background-color: #fff;
}

ion-toolbar {
  --padding-top: env(safe-area-inset-top);
  --padding-end: env(safe-area-inset-right);
  --padding-bottom: env(safe-area-inset-bottom);
  --padding-start: env(safe-area-inset-left);
}

ion-header {
  padding-top: env(safe-area-inset-top);
}
</style>
<!-- :root {
  --ion-background-color: transparent;
} -->