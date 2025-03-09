<template>
      <div class="tips-container">
        <!-- Header -->
        <div class="header">
          <ion-icon :icon="bulbOutline" class="icon" />
          <h2>Tips & Facts</h2>
        </div>
  
        <!-- Tip Card -->
        <ion-card class="tip-card">
          <div class="tip-header">Did you know?</div>
          <p class="tip-text">{{ currentTip }}</p>
  
          <!-- Next Tip Button -->
          <div class="next-tip" @click="showNextTip">
            <span>Next tip</span>
            <ion-icon :icon="chevronForwardOutline" class="arrow-icon" />
          </div>
        </ion-card>
  
        <!-- Footer -->
        <p class="footer">© 2023 LeafID. All rights reserved.</p>
      </div>
  </template>
  
  <script setup lang="ts">
  import { IonContent, IonCard, IonIcon } from '@ionic/vue';
  import { ref } from 'vue';
  import { bulbOutline, chevronForwardOutline } from 'ionicons/icons';
  
  // Tips array
  const tips = [
    "Leaves have tiny pores called stomata that allow them to breathe by taking in carbon dioxide and releasing oxygen.",
    "Chlorophyll, the pigment in leaves, is what gives them their green color and helps in photosynthesis.",
    "Some plants, like cacti, have modified leaves called spines to reduce water loss.",
    "Deciduous trees shed their leaves in the fall to conserve water and energy during winter."
  ];
  
  const currentIndex = ref(0);
  const currentTip = ref(tips[currentIndex.value]);
  
  // Function to change tip
  const showNextTip = () => {
    currentIndex.value = (currentIndex.value + 1) % tips.length;
    currentTip.value = tips[currentIndex.value];
  };
  </script>
  
  <style scoped>
  .tips-container {
    --background: #f8faf5;
    padding: 5px;
    border-radius: 12px;
    text-align: center;
  }
  
  .header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }
  
  .icon {
    font-size: 1.5rem;
    color: #5a9155;
  }
  
  .tip-card {
    background: white;
    padding: 16px;
    border-radius: 12px;
    text-align: left;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  }
  
  .tip-header {
    background: #e6f4e6;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: bold;
    color: #4a7c4a;
    display: inline-block;
  }
  
  .tip-text {
    margin: 12px 0;
    color: #333;
    font-size: 1rem;
  }
  
  .next-tip {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #4a7c4a;
    font-weight: bold;
    cursor: pointer;
  }
  
  .arrow-icon {
    font-size: 1.2rem;
  }
  
  .footer {
    margin-top: 100px;
    font-size: 0.8rem;
    color: #666;
  }
  </style>
  