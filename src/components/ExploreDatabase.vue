<template>
      <div class="explore-container">
        <div class="header">
          <ion-icon :icon="leafOutline" class="icon" />
          <h4>Explore Leaf Database</h4>
        </div>
  
        <div class="content">
        <!-- Search Bar -->
        <ion-searchbar placeholder="Search plants..." class="search-bar"></ion-searchbar>
  
        <!-- Category Grid -->
        <ion-grid class="categories">
          <ion-row>
            <ion-col v-for="category in categories" :key="category.name" size="6">
              <ion-card :style="{ background: category.color }" class="category-card">
                <div class="category-content">
                  <h3>{{ category.name }}</h3>
                  <p>{{ category.count }} species</p>
                </div>
              </ion-card>
            </ion-col>
          </ion-row>
        </ion-grid>
        </div>
      </div>
  </template>
  
  <script setup lang="ts">
  import { IonContent, IonSearchbar, IonGrid, IonRow, IonCol, IonCard, IonIcon } from '@ionic/vue';
  import { leafOutline } from 'ionicons/icons';
  
  const categories = [
    { name: 'Trees', count: 156, color: '#E6F4E6' },
    { name: 'Shrubs', count: 89, color: '#F7E8D7' },
    { name: 'Flowers', count: 213, color: '#F7D7D7' },
    { name: 'Herbs', count: 75, color: '#E6F4D7' }
  ];
  </script>
  
  <style scoped>
  .explore-container {
    --background: #f8faf5;
    padding: 16px;
    border-radius: 12px;
    padding-top: 2px;
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
  
  .search-bar {
    margin-bottom: 12px;
    --border-radius: 12px;
    --background: white;
  }
  
  .content {
    background: white;
    padding: 16px;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1), 0 4px 8px rgba(0, 0, 0, 0.08);
  }

  .categories {
    display: flex;
    justify-content: center;
  }
  
  .category-card {
    padding: 12px;
    border-radius: 12px;
    text-align: left;
  }
  
  .category-content h3 {
    margin: 0;
    font-size: 1.1rem;
    color: #333;
  }
  
  .category-content p {
    margin: 4px 0 0;
    font-size: 0.9rem;
    color: #666;
  }
  </style>
  