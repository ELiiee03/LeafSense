<template>
    <ion-page>
        <ion-content>
            <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
                <ion-refresher-content
                    pullingText="Pull to refresh"
                    refreshingText="Refreshing..."
                >
                </ion-refresher-content>
            </ion-refresher>
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
import { IonIcon, IonBreadcrumb, IonBreadcrumbs, IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonRefresher, IonRefresherContent } from '@ionic/vue';
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
import { Network } from '@capacitor/network';
import { networkState } from '@/services/networkService';
import { toastController } from '@ionic/vue';

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
        NetworkStatusIndicator,
        IonRefresher,
        IonRefresherContent
    },
    setup() {
        const handleRefresh = async (event: CustomEvent) => {
            console.log('HomePage: Pull to refresh triggered');
            try {
                // Check network status
                const networkStatus = await Network.getStatus();
                const previousState = networkState.isOnline.value;
                networkState.isOnline.value = networkStatus.connected;
                networkState.lastUpdated.value = new Date();
                
                // If network state has changed, show a toast notification
                if (previousState !== networkStatus.connected) {
                    const message = networkStatus.connected 
                        ? 'Network connection restored' 
                        : 'Network connection lost - switching to offline mode';
                    
                    const toast = await toastController.create({
                        message,
                        duration: 2000,
                        color: networkStatus.connected ? 'success' : 'warning',
                        position: 'top',
                        cssClass: 'no-shadow-toast'
                    });
                    await toast.present();
                }
                
                // Force components to re-evaluate their state
                // This will trigger the appropriate network-aware components to update
                window.dispatchEvent(new CustomEvent('network-status-changed', { 
                    detail: { connected: networkStatus.connected } 
                }));
                
            } catch (error) {
                console.error('Error during HomePage refresh:', error);
            } finally {
                // Always complete the refresher
                setTimeout(() => {
                    // Use type assertion for TypeScript
                    const refresher = event.target as HTMLIonRefresherElement;
                    if (refresher && refresher.complete) {
                        refresher.complete();
                        console.log('HomePage refresh completed');
                    }
                }, 500);
            }
        };
        
        return {
            handleRefresh
        };
    }
});
</script>

<style scoped>
/* Network status container removed as it's now using toast notifications */
:global(.no-shadow-toast) {
  --box-shadow: none !important;
}
</style>