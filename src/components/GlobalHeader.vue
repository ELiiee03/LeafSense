<template>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-title><b>LeafSense.</b></ion-title>
      </ion-toolbar>
    </ion-header>
  </template>
  
  <script lang="ts">
  import { defineComponent } from 'vue';
  import { IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuButton } from '@ionic/vue';
  
  export default defineComponent({
    name: 'GlobalHeader',
    components: {
      IonHeader,
      IonToolbar,
      IonTitle,
      IonButtons,
      IonMenuButton
    }
  });
  </script>