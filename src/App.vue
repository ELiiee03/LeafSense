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
       
      </ion-content>
      <ion-router-outlet></ion-router-outlet>
    </ion-page>
  </ion-app>
</template>




<script lang="ts">
  import { IonApp, IonButtons, IonContent, IonHeader, IonIcon, IonLabel, IonMenu, IonMenuButton, IonPage, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs, IonTitle, IonToolbar, IonFab } from '@ionic/vue';
  import { defineComponent, ref } from 'vue';
  // import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
  import { useRoute } from 'vue-router';
  // import CameraComponent from './views/CameraCapture.vue';
  import Tabs from '@/components/Tabs.vue';
  // import { playCircle, radio, library, search } from 'ionicons/icons';
  

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
  setup() {
    const route = useRoute();

    // Check if the current page is the login page
    const isLoginPage = route.name === 'login';  // Adjust the route name to match your login route

    return {
      isLoginPage,
    };
  },
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
