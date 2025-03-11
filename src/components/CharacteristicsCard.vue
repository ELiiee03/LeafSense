<template>
    <ion-card>
        <div class="characteristics-container">
            <div class="header">
              <h4>Characteristics</h4>
            </div>
        
            <div class="content">
              <ion-grid class="characteristics-grid">
                <ion-row>
                  <ion-col v-for="(char, index) in characteristics" :key="index" size="6">
                    <ion-card class="characteristic-card">
                      <div class="char-content">
                        <h3>{{ char.name }}</h3>
                        <p>{{ char.value }}</p>
                      </div>
                    </ion-card>
                  </ion-col>
                </ion-row>
              </ion-grid>
            </div>
          </div>
    </ion-card>

  </template>
  
  <script setup lang="ts">
  import { IonGrid, IonRow, IonCol, IonCard, IonIcon } from '@ionic/vue';
  import { leafOutline } from 'ionicons/icons';
  import { useInferenceStore } from '@/stores/inferenceStores';
  import { computed } from 'vue';
  
  const inferenceStore = useInferenceStore();

  const characteristics = computed(() => [
    { name: 'Color', value: inferenceStore.result?.leafInfo?.color || 'Not available' },
    { name: 'Shape', value: inferenceStore.result?.leafInfo?.shape || 'Not available' },
    { name: 'Margin', value: inferenceStore.result?.leafInfo?.margin || 'Not available' },
    { name: 'Growth Habits', value: inferenceStore.result?.leafInfo?.growthHabits || 'Not available' }
  ]);
  
  </script>
  
  <style scoped>
  ion-card {
    margin: 10px;
    border-radius: 15px;
  }

  .characteristics-container {
    --background: #f8faf5;
    padding: 10px;
    margin: 5px;
  }
  
  .header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 0;
    color: black;
  }
  
  .icon {
    font-size: 1.5rem;
    color: #5a9155;
  }
  
  .content {
    padding: 16px;
    border-radius: 12px;

  }
  
  .characteristics-grid {
    display: flex;
    justify-content: center;
  }
  
  .characteristic-card {
    padding: 10px;
    margin-top: 1px;
    margin-left: 1px;
    border-radius: 12px;
    width: 100%;
    text-align: left;
    background: #E6F4E6;
  }
  
  .char-content h3 {
    margin: 0;
    font-size: 1.1rem;
    color: #333;
  }
  
  .char-content p {
    margin: 2px 0 0;
    font-size: 0.9rem;
    color: #666;
  }
  </style>
  