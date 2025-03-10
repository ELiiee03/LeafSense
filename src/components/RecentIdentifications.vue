<template>
  <div class="recent-identifications">
    <div class="header">
      <h4 class="section-title">
        <ion-icon :icon="timeOutline" class="icon" />
        Recent Identifications
      </h4>
      <a href="#" class="view-all">View All →</a>
    </div>

    <div class="scroll-wrapper">
      <div class="scroll-container">
        <LeafCard 
          v-for="leaf in recentLeaves" 
          :key="leaf.id"
          :leaf="leaf"
          class="card-item"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { timeOutline } from 'ionicons/icons'
import LeafCard from './LeafCards.vue'

// Sample Data
const recentLeaves = ref([
  { 
    id: '1', 
    created_at: '2023-12-08T12:00:00Z',
    inference: { confidence: 0.98 },
    leafInfo: { 
      name: 'Maple Leaf', 
      scientificName: 'Acer palmatum',
      image: '/assets/maple.jpg' 
    } 
  },
  { 
    id: '2', 
    created_at: '2023-12-07T10:15:00Z',
    inference: { confidence: 0.95 },
    leafInfo: { 
      name: 'Oak Leaf', 
      scientificName: 'Quercus robur',
      image: '/assets/oak.jpg' 
    } 
  },
  { 
    id: '3', 
    created_at: '2023-12-06T08:45:00Z',
    inference: { confidence: 0.92 },
    leafInfo: { 
      name: 'Birch Leaf', 
      scientificName: 'Betula pendula',
      image: '/assets/birch.jpg' 
    } 
  },
  { 
    id: '4', 
    created_at: '2023-12-05T15:30:00Z',
    inference: { confidence: 0.89 },
    leafInfo: { 
      name: 'Aspen Leaf', 
      scientificName: 'Populus tremula',
      image: '/assets/aspen.jpg' 
    } 
  }
])
</script>

<style scoped>
.icon {
  font-size: 1.5rem;
  color: #5a9155;
}

.recent-identifications {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  color: var(--ion-color-dark);
  font-weight: bold;
}

.view-all {
  font-size: 0.9rem;
  color: var(--ion-color-primary);
  text-decoration: none;
}

.scroll-wrapper {
  overflow-x: auto;
  white-space: nowrap;
  padding-bottom: 10px;
}

.scroll-container {
  display: flex;
  gap: 16px;
}

.card-item {
  flex: 0 0 auto;
  width: 150px;
  height: 200px;
}
</style>
