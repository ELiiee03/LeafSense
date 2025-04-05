// Above the createApp() line
import { defineCustomElements } from '@ionic/pwa-elements/loader';
// defineCustomElements(window);
declare const window: any;

if (typeof window !== 'undefined') {
  defineCustomElements(window);
}
import { createApp } from 'vue'
import { createPinia } from 'pinia';
import { IonicVue } from '@ionic/vue';
import { VueQueryPlugin } from '@tanstack/vue-query';

import App from './App.vue';
import router from './router';
import { db } from './services/dbService'; // Add this import
// import { CapacitorSQLite } from '@capacitor-community/sqlite';
// import { sqliteService } from './services/sqliteService';
import { syncService } from './services/syncService';
import { registerPlugin } from '@capacitor/core';

const LeafInference = registerPlugin<{
  runInference(options: { imagePath: string }): Promise<{
      predictedClass: string;
      confidence: number;
  }>;
}>('LeafInference');

export default LeafInference;


/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* @import '@ionic/vue/css/palettes/dark.always.css'; */
/* @import '@ionic/vue/css/palettes/dark.class.css'; */
// import '@ionic/vue/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

// Initialize IndexedDB when app starts
db.open().catch(err => {
  console.error('Failed to open database:', err);
});

// // Temporary test code - START (remove after verification)
// db.inferences.put({
//   image_path: 'test.jpg',
//   predicted_class: 'Oak',
//   scientific_name: 'Quercus',
//   family_name: 'Fagaceae',
//   description: 'Test entry',
//   habitat: 'Forest',
//   timestamp: Date.now(),
//   synced: false
// }).then(() => {
//   console.log('Test entry added to IndexedDB');
// });


const app = createApp(App)
  .use(IonicVue)
  .use(router)
  .use(VueQueryPlugin, {
    queryClientConfig: {
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60 * 5, // 5 minutes
          gcTime: 1000 * 60 * 30, // 30 minutes
          retry: 1,
          refetchOnWindowFocus: false,
        },
      },
    },
  });

const pinia = createPinia();
app.use(pinia);


// Initialize sync service
syncService.init();

router.isReady().then(() => {
  app.mount('#app');
});