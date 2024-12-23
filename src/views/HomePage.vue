<template>
    <ion-page>
        <ion-content>
            <CameraCapture />
        </ion-content>
    </ion-page>
</template>

<script>
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/vue';
import CameraCapture from '@/components/CameraCapture.vue';

export default {
    name: 'HomePage',
    components: {
        IonPage,
        IonHeader,
        IonToolbar,
        IonTitle,
        IonContent,
        CameraCapture
    }
};
</script>

<style scoped>
/* Add your styles here */

</style>