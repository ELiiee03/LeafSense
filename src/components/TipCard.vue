<template>
      <div class="tips-container">
        <!-- Header -->
        <div class="header">
          <ion-icon :icon="bulbOutline" class="icon" />
          <h4><b>Tips & Facts</b></h4>
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
    "Deciduous trees shed their leaves in the fall to conserve water and energy during winter.",
    "The largest leaf in the world belongs to the raffia palm, reaching up to 25 meters in length.",
    "The pattern of veins in a leaf is called venation and helps transport water and nutrients throughout the leaf.",
    "Some leaves, like those of the sensitive plant (Mimosa pudica), can rapidly fold when touched as a defense mechanism.",
    "Leaves can be simple (single blade) or compound (multiple leaflets arranged on a common stalk).",
    "The autumn colors of leaves appear when chlorophyll breaks down, revealing other pigments like carotenoids and anthocyanins.",
    "Some plants, like the Venus flytrap, have modified leaves that can trap and digest insects.",
    "Leaf arrangements on stems can be alternate, opposite, or whorled, which helps with identification.",
    "Many medicinal compounds come from plant leaves, like the antimalarial drug quinine from cinchona tree leaves.",
    "The waxy cuticle on leaf surfaces helps protect plants from water loss and pathogen invasion.",
    "A tree with 200,000 leaves can remove about 70 pounds of air pollutants per year.",
    "The leaf shape is often adapted to the climate - large, broad leaves in tropical areas and needle-like leaves in cold regions."
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
    background: #F8F8FF ;
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
