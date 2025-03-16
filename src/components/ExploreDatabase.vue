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
          <ion-row v-if="isLoading">
            <ion-col size="12" class="loading-container">
              <ion-spinner name="crescent"></ion-spinner>
              <p>Loading plant data...</p>
            </ion-col>
          </ion-row>
          <ion-row v-else-if="error">
            <ion-col size="12">
              <ion-card color="danger">
                <ion-card-content>
                  Error loading data: {{ error }}
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
  import { ref, onMounted, computed } from 'vue';
  import { supabase } from '@/supabaseClient';

  // Define default categories with colors
  const defaultCategories = [
    { name: 'Trees', count: 0, color: '#E6F4E6' },
    { name: 'Shrubs', count: 0, color: '#F7E8D7' },
    { name: 'Flowers', count: 0, color: '#F7D7D7' },
    { name: 'Herbs', count: 0, color: '#E6F4D7' },
    // { name: 'Vines', count: 0, color: '#D7E6F7' }
  ];

  // Category color mapping
  const categoryColors = {
    'Trees': '#E6F4E6',
    'Shrubs': '#F7E8D7',
    'Flowers': '#F7D7D7',
    'Herbs': '#E6F4D7',
    // 'Vines': '#D7E6F7',
    // 'Other': '#E6D7F7'
  };

  // Create a normalized mapping that handles both singular/plural and case sensitivity
  const categoryNormalization: { [key: string]: string } = {
    // Trees/Tree variations
    'tree': 'Trees',
    'trees': 'Trees',
    // Shrubs/Shrub variations
    'shrub': 'Shrubs',
    'shrubs': 'Shrubs',
    // Flowers/Flower variations
    'flower': 'Flowers',
    'flowers': 'Flowers',
    // Herbs/Herb variations
    'herb': 'Herbs',
    'herbs': 'Herbs',
  };

  const isLoading = ref(true);
  const error = ref<string | null>(null);
  const categories = ref<Array<{ name: string; count: number; color: string }>>(
    // Initialize with default categories showing zero counts
    [...defaultCategories]
  );
  
  // Compute the final categories to display, ensuring all default categories are included
  const displayCategories = computed(() => {
    // Create a map of the fetched categories for quick lookup
    const categoryMap = new Map();
    categories.value.forEach(cat => categoryMap.set(cat.name, cat));
    
    // Return default categories with updated counts if available
    return defaultCategories.map(defaultCat => {
      const fetchedCategory = categoryMap.get(defaultCat.name);
      return fetchedCategory || defaultCat;
    });
  });

  // Fetch growth_habits data from Supabase
  const fetchPlantCategories = async () => {
    isLoading.value = true;
    error.value = null;
    
    try {
      // Fetch all records with growth_habits data
      const { data, error: fetchError } = await supabase
        .from('inference_results')
        .select('growth_habits')
        .not('growth_habits', 'is', null);
      
      if (fetchError) {
        throw fetchError;
      }
      
      console.log('Raw growth_habits data from Supabase:', data);
      
      // Count occurrences of each growth habit
      const counts: Record<string, number> = {};
      
      // Initialize counts with default categories set to 0
      defaultCategories.forEach(cat => {
        counts[cat.name] = 0;
      });
      
      // Process the data
      data?.forEach(item => {
        const habit = item.growth_habits?.trim() || 'Other';
        console.log('Processing growth habit:', habit);
        
        // If the habit contains multiple values (comma-separated), split and count each
        if (habit.includes(',')) {
          const habits = habit.split(',').map((h: string) => h.trim());
          habits.forEach((h: string) => {
            processHabit(h, counts);
          });
        } else {
          processHabit(habit, counts);
        }
      });
      
      console.log('Final counts after processing:', counts);
      
      // Convert to array format for display
      const categoryArray = Object.entries(counts)
        .filter(([name]) => {
          // Only include default categories and "Other" in the final output
          return defaultCategories.some(cat => cat.name === name) || name === 'Other';
        })
        .map(([name, count]) => ({
          name,
          count,
          color: categoryColors[name as keyof typeof categoryColors] || '#F0F0F0' // Default color if not in mapping
        }));
      
      console.log('Category array before update:', categoryArray);
      
      // Update the categories ref
      categories.value = categoryArray;
    } catch (err) {
      console.error('Error fetching growth habits:', err);
      error.value = err instanceof Error ? err.message : 'Unknown error occurred';
    } finally {
      isLoading.value = false;
    }
  };
  
  // Helper function to process each habit and increment the right category counter
  const processHabit = (habit: string, counts: Record<string, number>) => {
    // Convert to lowercase for normalization
    const habitLower = habit.toLowerCase();
    
    // Check if this habit has a normalized mapping
    const normalizedCategory = categoryNormalization[habitLower];
    
    if (normalizedCategory) {
      // If we found a match in our normalization map, increment the normalized category
      counts[normalizedCategory]++;
      console.log(`Normalized "${habit}" to category "${normalizedCategory}", new count: ${counts[normalizedCategory]}`);
    } else {
      // For habits that don't match our normalized categories, put in "Other"
      const formattedHabit = 'Other';
      counts[formattedHabit] = (counts[formattedHabit] || 0) + 1;
      console.log(`No category match for "${habit}", counted in "Other" with count: ${counts[formattedHabit]}`);
    }
  };

  // Fetch data on component mount
  onMounted(() => {
    fetchPlantCategories();
  });
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
  </style>
  