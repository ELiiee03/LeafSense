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
import { defineComponent } from 'vue';

import Tabs from '@/components/Tabs.vue';


export default defineComponent({
  name: 'App',
  components: {
    IonApp,
    IonContent,
    IonPage,
    IonRouterOutlet,
  }
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