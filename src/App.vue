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
  --ion-background-color: #DCE6CC;
}
</style>
<!-- :root {
  --ion-background-color: transparent;
} -->