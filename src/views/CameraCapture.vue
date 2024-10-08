<template>
  <ion-header>
    <ion-toolbar>
      <ion-title>LeafSense.</ion-title>
    </ion-toolbar>
  </ion-header>
  <ion-page>
  <ion-content class="ion-padding">
    <h4><b>LeafSense.</b></h4>
    <ion-grid>
      <ion-row>
        <ion-col></ion-col>
        <ion-col size="8">Tap Camera button to scan</ion-col>
        <ion-col></ion-col>
      </ion-row>
    </ion-grid>

    <!-- Camera button -->
    <ion-fab slot="fixed" vertical="bottom" horizontal="center">
      <ion-fab-button @click="takePhoto">
        <ion-icon src="/resources/camera-outline.svg" name="camera-outline"></ion-icon>
      </ion-fab-button>
    </ion-fab>

    <!-- Model to display the image -->
    <ion-modal :is-open="isOpen">
      <ion-header>
        <ion-toolbar>
          <ion-title>Photo Preview</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="setOpen(false)">Close</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <!-- Display the captured image -->
        <div v-if="imageSrc">
          <img :src="imageSrc" alt="Captured image" style="width: 100%;" />
        </div>
        <div v-else>
          <p>No image captured</p>
        </div>
      </ion-content>
    </ion-modal>

  </ion-content>
  </ion-page>
</template>


<script setup lang="ts">
  import { IonModal, IonButton, IonContent, IonHeader, IonTitle, IonFab,  IonToolbar, IonPage, IonGrid, IonRow, IonCol } from '@ionic/vue';
  import { ref } from 'vue';
  import { Camera, CameraResultType } from '@capacitor/camera';
// import { add } from 'ionicons/icons';

// Modal state
  const isOpen = ref(false);
  const imageSrc = ref('');

  // Function to open or close the modal
  const setOpen = (open: boolean) => {
    isOpen.value = open;
  };

  // const imageSrc = ref('');
  const takePhoto = async () => {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: true,
      resultType: CameraResultType.Uri,
    });

    imageSrc.value = image.webPath || '';

      // Open the modal to display the captured image
    setOpen(true);
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
  ion-col {
    color: #fff;
    text-align: center;
  }
  ion-grid {
    margin-top: 95%;
  }
</style>
