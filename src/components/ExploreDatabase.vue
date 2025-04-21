<template>
      <div class="explore-container">
        <div class="header">
          <div class="header-left">
            <ion-icon :icon="leafOutline" class="icon" />
            <h4><b>Explore Leaf Database</b></h4>
          </div>
        </div>
  
        <div class="content">
        <!-- Search Bar -->
        <ion-searchbar placeholder="Search plants..." class="search-bar"></ion-searchbar>
  
        <!-- Category Grid -->
        <ion-grid class="categories">
          <ion-row v-if="isLoading">
            <ion-col size="12" class="loading-container">
              <ion-spinner name="crescent"></ion-spinner>
              <p>Loading plant data...</p>
            </ion-col>
          </ion-row>
          <ion-row v-else-if="queryError">
            <ion-col size="12">
              <ion-card color="danger">
                <ion-card-content>
                  Error loading data: {{ queryError }}
                </ion-card-content>
              </ion-card>
            </ion-col>
          </ion-row>
          <ion-row v-else>
            <ion-col v-for="category in displayCategories" :key="category.name" size="6">
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
  import { IonContent, IonSearchbar, IonGrid, IonRow, IonCol, IonCard, IonIcon, IonSpinner, IonCardContent } from '@ionic/vue';
  import { leafOutline } from 'ionicons/icons';
  import { ref, onMounted, computed, watch, onUnmounted } from 'vue';
  import { supabase } from '@/supabaseClient';
  import { useQuery, useQueryClient } from '@tanstack/vue-query';
  import { sqliteService } from '@/services/sqliteService';
  import { Network } from '@capacitor/network';
  import { networkState, onNetworkChange } from '@/services/networkService';

  // Define default categories with colors
  const defaultCategories = [
    { name: 'Trees', count: 0, color: '#E6F4E6' },
    { name: 'Shrubs', count: 0, color: '#F7E8D7' },
    { name: 'Grass', count: 0, color: '#F7D7D7' },
    { name: 'Herbs', count: 0, color: '#E6F4D7' },
    // { name: 'Vines', count: 0, color: '#D7E6F7' }
  ];

  // Category color mapping
  const categoryColors = {
    'Trees': '#E6F4E6',
    'Shrubs': '#F7E8D7',
    'Grass': '#F7D7D7',
    'Herbs': '#E6F4D7',
  } as const;

  // Create a normalized mapping that handles both singular/plural and case sensitivity
  const categoryNormalization: { [key: string]: string } = {
    // Trees/Tree variations
    'tree': 'Trees',
    'trees': 'Trees',
    // Shrubs/Shrub variations
    'shrub': 'Shrubs',
    'shrubs': 'Shrubs',
    // Flowers/Flower variations
    'grass': 'Grass',
    'flowers': 'Flowers',
    // Herbs/Herb variations
    'herb': 'Herbs',
    'herbs': 'Herbs',
  };

  // Get the query client to manually refetch data
  const queryClient = useQueryClient();
  
  // Network status change listener
  let unsubscribeFromNetwork: (() => void) | null = null;

  // Handler for network status changes
  const handleNetworkChange = async (status: { connected: boolean }) => {
    console.log('Network status changed in ExploreDatabase:', status.connected ? 'online' : 'offline');
    // Refetch data when network status changes
    queryClient.invalidateQueries({ queryKey: ['plantCategories'] });
  };
  
  // Set up network monitoring
  onMounted(() => {
    unsubscribeFromNetwork = onNetworkChange(handleNetworkChange);
    
    // Also watch for network state changes via the reactive ref
    watch(() => networkState.lastUpdated.value, () => {
      console.log('Network state updated in ExploreDatabase');
      queryClient.invalidateQueries({ queryKey: ['plantCategories'] });
    });
  });
  
  // Clean up
  onUnmounted(() => {
    if (unsubscribeFromNetwork) {
      unsubscribeFromNetwork();
    }
  });

  // Get categories data using TanStack Query
  const { data: categoriesData, isLoading, error: queryError } = useQuery({
    queryKey: ['plantCategories'],
    queryFn: async () => {
      const isOnline = (await Network.getStatus()).connected;
      
      if (isOnline) {
        const { data, error: fetchError } = await supabase
          .from('inference_results')
          .select('growth_habits')
          .not('growth_habits', 'is', null);
        
        if (fetchError) throw fetchError;
        return processCategories(data || []);
      } else {
        // Offline mode: fetch from SQLite
        const offlineResults = await sqliteService.getUnsyncedResults();
        return processCategories(offlineResults || []);
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
    refetchOnWindowFocus: false
  });

  // Update displayCategories to use the query data
  const displayCategories = computed(() => {
    if (!categoriesData.value) {
      return defaultCategories;
    }

    // Create a map of the fetched categories for quick lookup
    const categoryMap = new Map(
      categoriesData.value.map(cat => [cat.name, cat])
    );
    
    // Return default categories with updated counts if available
    return defaultCategories.map(defaultCat => {
      const fetchedCategory = categoryMap.get(defaultCat.name);
      return fetchedCategory || defaultCat;
    });
  });

  // Helper function to process categories
  const processCategories = (data: any[]) => {
    const counts: Record<string, number> = {};
    
    // Initialize counts with default categories set to 0
    defaultCategories.forEach(cat => {
      counts[cat.name] = 0;
    });
    
    // Process the data
    data.forEach(item => {
      const habit = item.growth_habits?.trim() || '';
      
      if (!habit) return; // Skip empty habits
      
      if (habit.includes(',')) {
        const habits = habit.split(',').map((h: string) => h.trim());
        habits.forEach((h: string) => {
          if (h) processHabit(h, counts);
        });
      } else {
        processHabit(habit, counts);
      }
    });
    
    // Convert to array format for display
    return defaultCategories.map(cat => ({
      name: cat.name,
      count: counts[cat.name] || 0,
      color: categoryColors[cat.name as keyof typeof categoryColors] || '#F0F0F0'
    }));
  };

  // Helper function to process each habit and increment the right category counter
  const processHabit = (habit: string, counts: Record<string, number>) => {
    // Convert to lowercase for normalization
    const habitLower = habit.toLowerCase().trim();
    
    // Check if this habit has a normalized mapping
    const normalizedCategory = categoryNormalization[habitLower];
    
    if (normalizedCategory) {
      // If we found a match in our normalization map, increment the normalized category
      counts[normalizedCategory] = (counts[normalizedCategory] || 0) + 1;
    }
    // We no longer count "Other" category since we're only showing default categories
  };
  </script>
  
  <style scoped>
  .explore-container {
    --background: #FDFAF6;
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
    background: #F8F8FF;
    padding: 16px;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1), 0 4px 8px rgba(0, 0, 0, 0.08);
  }

  .categories {
    display: flex;
    justify-content: center;
    margin-right: 20px;
  }
  
  .category-card {
    padding: 12px;
    border-radius: 12px;
    text-align: left;
    min-width: 100%;
    height: 100%; 
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

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  </style>
  