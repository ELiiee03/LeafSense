<template>
    <ion-page>
        <!-- <GlobalHeader /> -->
        <ion-content>
            <!-- <ion-searchbar show-clear-button="focus" placeholder="Search pins"></ion-searchbar> -->
            <!-- <Geotagging /> -->
            <Pins />
        </ion-content>
    </ion-page>
</template>

<script>
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonSearchbar } from '@ionic/vue';
import { ref } from 'vue';
import GlobalHeader from '@/components/GlobalHeader.vue';
// import Geotagging from '@/components/Geotagging.vue';
import Pins from '@/components/PinsComponent.vue';
// import PinLogs from '@/components/PinLogs.vue';

export default {
    components: {
        IonPage,
        IonHeader,
        IonToolbar,
        IonTitle,
        IonContent,
        IonSearchbar,
        Pins,
        GlobalHeader
    }
};

// const leaf = ref(null); // Assuming you have a way to set this
// const taggedLocations = ref([]);

// const updateTaggedLocations = (newTaggedLocations) => {
//   taggedLocations.value = newTaggedLocations;
// };
</script>

<style scoped>
/* Add your styles here */
ion-searchbar {
    margin-bottom: 20px;
    margin-top: 20px;
}
</style>