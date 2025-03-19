<template>
  <ion-app>
    <ion-page id="main-content">
      <ion-content class="ion-padding">
        <ion-router-outlet></ion-router-outlet>
      </ion-content>
    </ion-page>
  </ion-app>
</template>

<script lang="ts">
import { IonApp, IonContent, IonPage, IonRouterOutlet } from '@ionic/vue';
import { defineComponent, onMounted } from 'vue';
import { syncService } from '@/services/syncService';
// import { Network } from '@capacitor/network';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { supabase } from './supabaseClient';
import { useRouter } from 'vue-router';

// const router = useRouter();

export default defineComponent({
  name: 'App',
  components: {
    IonApp,
    IonRouterOutlet,
    IonContent,
    IonPage,
  },
  setup() {
    const router = useRouter();

    onMounted(() => {
      console.log('Setting up deep link handler in App.vue');
      
      // This is the critical handler for OAuth redirects
      App.addListener('appUrlOpen', async (appData: { url: string }) => {
        console.log('App opened with URL:', appData.url);
        
        // Check if this is our OAuth callback
        if (appData.url.includes('/auth-callback')) {
          console.log('Processing auth callback URL');
          
          try {
            // Try to close the browser
            await Browser.close().catch(e => 
              console.log('Browser may already be closed:', e)
            );
            
            // Check authentication status
            const { data: authData, error } = await supabase.auth.getSession();
            console.log('Auth check result:', authData, error);
            
            if (authData?.session) {
              console.log('Successfully authenticated, redirecting to home');
              setTimeout(() => router.replace('/home'), 500);
            } else {
              console.log('No session found, redirecting to login');
              setTimeout(() => router.replace('/login'), 500);
            }
          } catch (e) {
            console.error('Error handling auth callback:', e);
            router.replace('/login');
          }
        }
      });
    });

    return {};
  },
});


// onMounted(() => {
//     // Initialize sync service
//     syncService.init();
// });
</script>
<style>
:root {
  --ion-background-color: #fff;
}

ion-toolbar {
  --padding-top: env(safe-area-inset-top);
  --padding-end: env(safe-area-inset-right);
  --padding-bottom: env(safe-area-inset-bottom);
  --padding-start: env(safe-area-inset-left);
}

ion-header {
  padding-top: env(safe-area-inset-top);
}
</style>
<!-- :root {
  --ion-background-color: transparent;
} -->