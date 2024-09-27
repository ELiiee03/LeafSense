<!-- <template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Ionic Blank</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <img :src="imageSrc" />
      <ion-button @click="takePhoto()">Take Photo</ion-button>
    </ion-content>
  </ion-page>
</template> -->
<template>
  <ion-content>
    <ion-fab slot="fixed" vertical="bottom" horizontal="center">
      <ion-fab-button @click="takePhoto">
        <ion-icon :icon="add"></ion-icon>
      </ion-fab-button>
    </ion-fab>
  </ion-content>

</template>


<script setup lang="ts">
  import { IonButton, IonContent, IonHeader, IonPage, IonTitle, IonFab } from '@ionic/vue';
  import { ref } from 'vue';
  import { Camera, CameraResultType } from '@capacitor/camera';
  import { add } from 'ionicons/icons';

  const imageSrc = ref('');
  const takePhoto = async () => {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: true,
      resultType: CameraResultType.Uri,
    });

    imageSrc.value = image.webPath || '';
  };
</script>

<style>
  :root {
    /**
   * Setting the variables for DEMO purposes only.
   * Values will be set automatically when building an iOS or Android app.
   */
    --ion-safe-area-top: 20px;
    --ion-safe-area-bottom: 20px;
  }
</style>

<style scoped>
  ion-fab {
    margin-top: var(--ion-safe-area-top, 0);
    margin-bottom: var(--ion-safe-area-bottom, 0);
  }
</style>