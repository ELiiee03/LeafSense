<template>
  <ion-header class="ion-no-border">
    <ion-toolbar>
      <ion-title><b>LeafSense.</b></ion-title>
      <ion-buttons slot="end">
        <ion-button href="/preview">
          <ion-icon size="large" :icon="logOutOutline" slot="start"></ion-icon>
      </ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuButton } from '@ionic/vue';
import { logOutOutline } from 'ionicons/icons';

export default defineComponent({
  name: 'GlobalHeader',
  components: {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonMenuButton
  },
  setup() {
  return {
    logOutOutline
  };
}
});
</script>
<style scoped>

</style>