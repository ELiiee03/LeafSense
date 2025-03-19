<template>
  <!-- <ion-page> -->
    <!-- <ion-content class="ion-padding"> -->
      <div class="center-content">
        <ion-spinner></ion-spinner>
        <p>Completing authentication...</p>
      </div>
    <!-- </ion-content> -->
  <!-- </ion-page> -->
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue';
import { IonPage, IonContent, IonSpinner } from '@ionic/vue';
import { supabase } from '@/supabaseClient';
import { useRouter } from 'vue-router';
import { Browser } from '@capacitor/browser';

export default defineComponent({
  components: {
    IonPage,
    IonContent,
    IonSpinner
  },
  
});
</script>
  
  <style scoped>
  .center-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
  }
  </style>