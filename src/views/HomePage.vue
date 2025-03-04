<template>
    <ion-page>
        <ion-content>
            <CameraCapture />
            <ion-breadcrumbs>
                <ion-breadcrumb href="#home">
                  Home
                  <ion-icon slot="separator" :icon="arrowForwardCircle"></ion-icon>
                </ion-breadcrumb>
                <ion-breadcrumb href="#electronics">
                  Electronics
                  <ion-icon slot="separator" :icon="arrowForwardCircle"></ion-icon>
                </ion-breadcrumb>
                <ion-breadcrumb href="#cameras">
                  Cameras
                  <ion-icon slot="separator" :icon="arrowForwardCircle"></ion-icon>
                </ion-breadcrumb>
                <ion-breadcrumb href="#film">
                  Film
                  <ion-icon slot="separator" :icon="arrowForwardCircle"></ion-icon>
                </ion-breadcrumb>
              </ion-breadcrumbs>
        </ion-content>
    </ion-page>
</template>

<script lang=ts>
import { IonIcon, IonBreadcrumb, IonBreadcrumbs, IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/vue';
import { defineComponent } from 'vue';
import CameraCapture from '@/components/CameraCapture.vue';
import { arrowForwardCircle } from 'ionicons/icons';

export default defineComponent({
    name: 'HomePage',
    components: {
        IonPage,
        IonHeader,
        IonToolbar,
        IonTitle,
        IonContent,
        CameraCapture,
        IonBreadcrumb,
        IonBreadcrumbs,
        IonIcon
    }
});
</script>

<style scoped>
/* Add your styles here */

</style>