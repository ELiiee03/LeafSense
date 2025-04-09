<template>
    <ion-card class="leaf-card" @click="navigateToDetail">
      <div class="image-container">
        <img 
          :src="getLeafImage"
          alt="Leaf image"
          class="leaf-image"
        />
        <div class="confidence-badge">
          {{ Math.round(leaf.inference.confidence * 100) }}%
        </div>
      </div>
  
      <div class="card-content">
        <h3 class="leaf-name">{{ getLeafName }}</h3>
        <p class="scientific-name">{{ getScientificName }}</p>
        
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
  import { computed } from 'vue'
  
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
          familyName?: string
        }
        image?: string
        result?: string
        scientific_name?: string
        family_name?: string
      }
    }>()
  
  const navigateToDetail = () => {
    console.log('Navigating to leaf detail with ID:', props.leaf.id);
    
    // Ensure the leaf data is properly formatted before navigation
    // This helps with consistent display regardless of data source
    const formattedLeaf = {
      ...props.leaf,
      result: props.leaf.result || props.leaf.leafInfo?.name,
      scientific_name: props.leaf.scientific_name || props.leaf.leafInfo?.scientificName,
      family_name: props.leaf.family_name || props.leaf.leafInfo?.familyName,
      image: props.leaf.image || props.leaf.leafInfo?.image,
      
      // Ensure leafInfo is always present and properly formatted
      leafInfo: {
        name: props.leaf.leafInfo?.name || props.leaf.result || 'Unknown Plant',
        scientificName: props.leaf.leafInfo?.scientificName || props.leaf.scientific_name || '',
        familyName: props.leaf.leafInfo?.familyName || props.leaf.family_name || '',
        image: props.leaf.leafInfo?.image || props.leaf.image || '',
        // Add other fields as needed
      }
    };
    
    // Store the formatted leaf in sessionStorage for consistent access
    try {
      sessionStorage.setItem(`leaf_${props.leaf.id}`, JSON.stringify(formattedLeaf));
    } catch (e) {
      console.error('Failed to store leaf data in sessionStorage:', e);
    }
    
    router.push(`/leaf/${props.leaf.id}`);
  }
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }
  
  const getLeafImage = computed(() => {
    return props.leaf.leafInfo?.image || 
           props.leaf.image || 
           defaultImage;
  });
  
  const getLeafName = computed(() => {
    return props.leaf.leafInfo?.name || 
           props.leaf.result || 
           'Unknown Plant';
  });
  
  const getScientificName = computed(() => {
    return props.leaf.leafInfo?.scientificName || 
           props.leaf.scientific_name || 
           '';
  });
  </script>
  
  <style scoped>
  .leaf-card {
    width: 140px;
    height: 180px;
    display: flex;
    flex-direction: column;
    margin: 0;
    cursor: pointer;
    border-radius: 12px;
    transition: all 0.3s ease;
    position: relative;
    background: #fff;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }
  
  .leaf-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }
  
  .image-container {
    position: relative;
    height: 100px;
    overflow: hidden;
  }
  
  .leaf-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .confidence-badge {
    position: absolute;
    bottom: 8px;
    right: 8px;
    background: #416d3f;
    color: white;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.7rem;
    font-weight: 500;
  }
  
  .card-content {
    padding: 12px;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
  }
  
  .leaf-name {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #333;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .scientific-name {
    margin: 2px 0 6px;
    font-size: 0.8rem;
    color: #666;
    font-style: italic;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .date-container {
    margin-top: auto;
    display: flex;
    align-items: center;
    gap: 4px;
    color: #888;
    font-size: 0.75rem;
  }
  
  .date-icon {
    font-size: 0.9rem;
  }
  </style>
  