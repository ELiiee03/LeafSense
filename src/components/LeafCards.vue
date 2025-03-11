<template>
    <ion-card class="leaf-card" @click="navigateToDetail">
      <div class="image-container">
        <img 
          :src="leaf.leafInfo.image || defaultImage"
          alt="Leaf image"
          class="leaf-image"
        />
        <div class="confidence-badge">
          {{ Math.round(leaf.inference.confidence * 100) }}%
        </div>
      </div>
  
      <div class="card-content">
        <h3 class="leaf-name">{{ leaf.leafInfo.name }}</h3>
        <p class="scientific-name">{{ leaf.leafInfo.scientificName }}</p>
        
        <div class="date-container">
          <ion-icon :icon="calendarOutline" class="date-icon" />
          <span class="date-text">{{ leaf.formattedDate || formatDate(leaf.created_at) }}</span>
        </div>
      </div>
    </ion-card>
  </template>
  
  <script setup lang="ts">
  import { IonCard, IonIcon } from '@ionic/vue'
  import { calendarOutline } from 'ionicons/icons'
  import { useRouter } from 'vue-router'
  import defaultLeafImage from '@/assets/pine needle.jpg'
  
  const router = useRouter()
  const defaultImage = defaultLeafImage
  
  const props = defineProps<{
    leaf: {
      id: string
      created_at: string
      formattedDate?: string
      inference: {
        confidence: number
      }
      leafInfo: {
        name: string
        scientificName: string
        image?: string
      }
    }
  }>()
  
  const navigateToDetail = () => {
    router.push(`/leaf/${props.leaf.id}`)
  }
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }
  </script>
  
  <style scoped>
  .leaf-card {
    width: 140px;
    height: 170px;
    display: flex;
    flex-direction: column;
    margin: 0;
    cursor: pointer;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  
  .leaf-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  }
  
  .image-container {
    position: relative;
    height: 100px;
  }
  
  .leaf-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 8px 8px 0 0;
  }
  
  .confidence-badge {
    position: absolute;
    bottom: 8px;
    right: 8px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 500;
  }
  
  .card-content {
    padding: 15px;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
  }
  
  .leaf-name {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--ion-color-dark);
  }
  
  .scientific-name {
    margin: 4px 0;
    font-size: 0.9rem;
    color: var(--ion-color-medium);
    font-style: italic;
  }
  
  .date-container {
    margin-top: auto;
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--ion-color-medium);
    font-size: 0.8rem;
  }
  
  .date-icon {
    font-size: 0.9rem;
  }
  </style>
  