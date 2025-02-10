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

import App from './App.vue';
import router from './router';
import { CapacitorSQLite } from '@capacitor-community/sqlite';
import { syncService } from './services/syncService';
import { registerPlugin } from '@capacitor/core';

const LeafInference = registerPlugin<{
  runInference(options: { imagePath: string }): Promise<{
      predictedClass: string;
      confidence: number;
  }>;
}>('LeafInference');


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

const app = createApp(App).use(IonicVue).use(router);
const pinia = createPinia();
app.use(pinia);

// Initialize SQLite
const initializeSQLite = async () => {
  try {
      await CapacitorSQLite.createConnection({
          database: 'leaf_results',
          encrypted: false,
          mode: 'no-encryption',
          version: 1
      });
  } catch (error) {
      console.error('Error initializing SQLite:', error);
  }
};  

initializeSQLite()
  
syncService.init();

router.isReady().then(() => {
  app.mount('#app');
});
