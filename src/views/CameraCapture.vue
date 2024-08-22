<template>
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
</template>

<script setup lang="ts">
  import { IonButton, IonContent, IonHeader, IonPage, IonTitle } from '@ionic/vue';
  import { ref } from 'vue';
  import { Camera, CameraResultType } from '@capacitor/camera';

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