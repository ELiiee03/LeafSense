<template>
    <ion-page>
        <ion-content>
            <GlobalHeader />
            <NetworkStatusIndicator />
            <HeroSection />
            <RecentIdentifications />
            <ExploreDatabase />
            <TipCard />
            <CameraCapture />
        </ion-content>
    </ion-page>
</template>

<script lang=ts>
import { IonIcon, IonBreadcrumb, IonBreadcrumbs, IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/vue';
import { defineComponent } from 'vue';
import CameraCapture from '@/components/CameraCapture.vue';
import HomeContent from '@/components/HomeContent.vue';
import { arrowForwardCircle } from 'ionicons/icons';
import RecentIdentifications from '@/components/RecentIdentifications.vue';
import GlobalHeader from '@/components/GlobalHeader.vue';
import HeroSection from '@/components/HeroSection.vue';
import ExploreDatabase from '@/components/ExploreDatabase.vue';
import TipCard from '@/components/TipCard.vue';
import NetworkStatusIndicator from '@/components/NetworkStatusIndicator.vue';

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
        IonIcon,
        RecentIdentifications,
        HeroSection,
        GlobalHeader,
        ExploreDatabase,
        TipCard,
        NetworkStatusIndicator
    }
});
</script>

<style scoped>
/* Network status container removed as it's now using toast notifications */
</style>