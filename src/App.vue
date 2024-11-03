<template>
  <ion-app>
    <ion-page id="main-content">
      <!-- <ion-header>
        <ion-toolbar>
          <ion-title>LeafSense</ion-title>
          <ion-buttons slot="end">
            <ion-menu-button></ion-menu-button> -->
          <!-- </ion-buttons>
        </ion-toolbar>
      </ion-header> -->
      <ion-content class="ion-padding">
        <!-- <h1>LeafSense.</h1> -->
        <ion-router-outlet></ion-router-outlet>
      </ion-content>
      <!-- <ion-router-outlet></ion-router-outlet> -->
    </ion-page>
  </ion-app>
</template>




<script lang="ts">
  import { IonApp, IonButtons, IonContent, IonHeader, IonIcon, IonLabel, IonMenu, IonMenuButton, IonPage, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs, IonTitle, IonToolbar, IonFab } from '@ionic/vue';
  import { defineComponent, ref } from 'vue';
  import { useRoute } from 'vue-router';
  // import Tabs from './components/Tabs.vue';
  

export default defineComponent({
    name: 'App',
    components: {
      IonApp,
      IonButtons,
      IonContent,
      IonHeader,
      IonMenu,
      IonMenuButton,
      IonPage,
      IonTitle,
      IonToolbar,
      IonTabs,
      IonTabBar,
      IonLabel,
      IonTabButton,
      IonIcon,
      IonRouterOutlet,
      // CameraComponent
    },
    // data() {
    //   return {
    //     playCircle,
    //     radio,
    //     library,
    //     search,
    //   };
  // },

    // methods: {
    //   async takePhoto() {
    //     console.log('Button clicked!');
    //     try {
    //       const image = await Camera.getPhoto({
    //         quality: 90,
    //         allowEditing: false,
    //         resultType: CameraResultType.Uri,
    //         source: CameraSource.Camera,
    //       });
 
    //       const imageUrl = image.webPath;
    //       console.log('Image URL:', imageUrl);
    //       // Do something with the image, e.g., display it or upload it
    //     } catch (error) {
    //       console.error('Error taking photo:', error);
    //     }
    //   },
    // },
  });
</script>
