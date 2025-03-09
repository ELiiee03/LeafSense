<template>
    <!-- <ion-content class="ion-padding"> -->
      <div class="recent-identifications">
        <h4 class="section-title">
          <ion-icon :icon="leafOutline" class="icon" />
          Recent Scans</h4>
        
        <div class="scroll-wrapper">
          <div class="scroll-container">
            <div v-for="(group, dateGroup) in dateGroups" :key="dateGroup" class="date-group">
              <h3 class="date-title">{{ dateGroup }}</h3>
              <div class="cards-container">
                <LeafCard 
                  v-for="leaf in group" 
                  :key="leaf.id"
                  :leaf="leaf"
                  class="card-item"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    <!-- </ion-content> -->
  </template>
  
  <script setup lang="ts">
  import { IonContent } from '@ionic/vue'
  import { ref } from 'vue'
  import { leafOutline } from 'ionicons/icons';
  import LeafCard from './LeafCards.vue'
  
  // Sample Data
  const dateGroups = ref({
    'Today': [
      { 
        id: '1', 
        created_at: '2023-12-08T12:00:00Z',
        inference: { confidence: 0.95 },
        leafInfo: { 
          name: 'Oak Leaf', 
          scientificName: 'Quercus' 
        } 
      },
      { 
        id: '2', 
        created_at: '2023-12-08T14:30:00Z',
        inference: { confidence: 0.92 },
        leafInfo: { 
          name: 'Maple Leaf', 
          scientificName: 'Acer' 
        } 
      },
    ],
    'Yesterday': [
      { 
        id: '3', 
        created_at: '2023-12-07T10:15:00Z',
        inference: { confidence: 0.89 },
        leafInfo: { 
          name: 'Pine Leaf', 
          scientificName: 'Pinus' 
        } 
      },
      { 
        id: '4', 
        created_at: '2023-12-07T16:45:00Z',
        inference: { confidence: 0.94 },
        leafInfo: { 
          name: 'Birch Leaf', 
          scientificName: 'Betula' 
        } 
      },
    ],
  })
  </script>
  
  <style scoped>
  .icon {
    font-size: 1.5rem;
    color: #5a9155;
  }

  .recent-identifications {
    padding: 20px;
    height: 340px;
  }
  
  .section-title {
    margin-bottom: 0px;
    color: var(--ion-color-dark);
  }
  
  /* Enable horizontal scrolling */
  .scroll-wrapper {
    overflow-x: auto;
    white-space: nowrap;
    padding-bottom: 10px;
  }
  
  .scroll-container {
    display: flex;
    gap: 24px;
  }
  
  /* Each date group */
  .date-group {
    flex: 0 0 auto;
    width: 280px;
  }
  
  /* Horizontal cards */
  .cards-container {
    display: flex;
    gap: 12px;
    flex-wrap: nowrap; /* Ensures all cards stay in one row */
    overflow-x: auto;
    padding-bottom: 10px;
  }
  
  /* Ensure cards remain in a row */
  .card-item {
    flex: 0 0 auto;
    width: 140px;
  }
  </style>
  