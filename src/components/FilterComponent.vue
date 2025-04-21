<template>
  <div class="filter-container">
    <!-- Search Bar -->
    <ion-searchbar 
      v-model="searchTerm"
      placeholder="Search history..."
      :debounce="300"
      @ionInput="handleSearch"
      class="custom-searchbar"
    ></ion-searchbar>

    <!-- Scrollable Filter Tabs -->
    <div class="scrollable-tabs">
      <ion-segment v-model="selectedFilter" class="filter-tabs">
        <ion-segment-button value="all" @click="applyFilters('all')">
          <div class="tab-content">
            <ion-icon :icon="filterOutline" class="tab-icon" />
            <ion-label>All</ion-label>
          </div>
        </ion-segment-button>
        
        <ion-segment-button 
          v-for="habit in commonHabits"
          :key="habit.name"
          :value="habit.name"
          @click="applyFilters(habit.name)"
        >
          <div class="tab-content">
            <ion-icon :icon="habit.icon" class="tab-icon" />
            <ion-label>{{ habit.name }}</ion-label>
          </div>
        </ion-segment-button>
      </ion-segment>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { IonSearchbar, IonSegment, IonSegmentButton, IonLabel, IonIcon } from '@ionic/vue';
import { filterOutline, leafOutline, flowerOutline } from 'ionicons/icons';

// Props
const props = defineProps<{
  allLogs: any[];
}>();

// Emits
const emit = defineEmits(['filter-changed']);

// Search term
const searchTerm = ref('');
const selectedFilter = ref('all');

// Growth habits with icons
const commonHabits = ref([
  { name: 'Trees', icon: leafOutline, value: 'tree' },
  { name: 'Shrubs', icon: leafOutline, value: 'shrub' },
  { name: 'Herbs', icon: flowerOutline, value: 'herb' },
  { name: 'Grass', icon: flowerOutline, value: 'grass' }
]);

// Handle search input
const handleSearch = () => {
  applyFilters(selectedFilter.value);
};

// Apply filters
const applyFilters = (filter: string) => {
  selectedFilter.value = filter;
  
  let filtered = [...props.allLogs];

  if (filter !== 'all') {
    // Find the selected habit from commonHabits
    const selectedHabit = commonHabits.value.find(h => h.name === filter);
    if (selectedHabit) {
      filtered = filtered.filter(log => {
        // Check both growth_habits and growthHabits, use includes() instead of exact match
        const growthHabit1 = (log.growth_habits || '').toLowerCase();
        const growthHabit2 = (log.growthHabits || '').toLowerCase();
        // Also check leafInfo structure for growthHabits
        const growthHabit3 = (log.leafInfo?.growthHabits || '').toLowerCase();
        
        const habitValue = selectedHabit.value.toLowerCase();
        
        return growthHabit1.includes(habitValue) || 
               growthHabit2.includes(habitValue) || 
               growthHabit3.includes(habitValue);
      });
    }
  }

  if (searchTerm.value) {
    filtered = filtered.filter(log => {
      const searchLower = searchTerm.value.toLowerCase();
      // Check all possible property paths
      const growthHabit1 = (log.growth_habits || '').toLowerCase();
      const growthHabit2 = (log.growthHabits || '').toLowerCase();
      const growthHabit3 = (log.leafInfo?.growthHabits || '').toLowerCase();
      const description = (log.description || log.leafInfo?.description || '').toLowerCase();
      const result = (log.result || log.leafInfo?.name || '').toLowerCase();
      const scientificName = (log.scientific_name || log.leafInfo?.scientificName || '').toLowerCase();
      
      return growthHabit1.includes(searchLower) || 
             growthHabit2.includes(searchLower) ||
             growthHabit3.includes(searchLower) ||
             description.includes(searchLower) ||
             result.includes(searchLower) ||
             scientificName.includes(searchLower);
    });
  }

  emit('filter-changed', filtered);
};

// Watch logs to update filters
watch(() => props.allLogs, () => {
  applyFilters(selectedFilter.value);
}, { deep: true });
</script>

<style scoped>
/* Container */
.filter-container {
  padding: 12px;
  background: #E4EFE7;
  border-radius: 12px;
  margin-bottom: 0;
  padding-bottom: 0;
}

/* Custom Search Bar */
.custom-searchbar {
  --background: white;
  --border-radius: 12px;
  margin-bottom: 10px;
}

/* Scrollable Tabs */
.scrollable-tabs {
  overflow-x: auto;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
  width: 100%;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */

}

/* Hide scrollbar */
.scrollable-tabs::-webkit-scrollbar {
  display: none;
}

/* Filter Tabs */
.filter-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: nowrap;
  background: #E4EFE7;
  border-radius: 12px;
  padding: 6px;
  min-width: max-content;
  border: 2px soild red;
}

/* Segment Buttons */
ion-segment-button {
  display: flex;
  align-items: center;
  justify-content: start; /* Align content to the left */
  min-width: 90px;
  padding: 8px 12px;
  border-radius: 12px;
  background: #F8F8FF;
  color: #416d3f;
  transition: all 0.3s ease;
  height: 5px;
  padding-top: 0;
  border: 2px soild red;
}

/* Tab Content */
.tab-content {
  display: flex;
  align-items: center;
  gap: 6px; /* Space between icon and text */
  border: 2px soild red;
}

/* Active Segment */
ion-segment-button.ion-activated {
  background: #416d3f;
  color: white;
  border: 2px soild red;
}

/* Badge (Adjusted) */
.badge {
  background: rgba(255, 255, 255, 0.7);
  color: #416d3f;
  font-size: 5px;
  padding: 1px 3px;
  border-radius: 8px; /* Reduced height */
  margin-left: 4px;
  min-width: 20px;
  height: 14px; /* Smaller badge */
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid red;
  font-size: 8px; /* Reduced font size */
}

/* Icon alignment */
.tab-icon {
  font-size: 12px;
  margin-right: 2px;
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
}

/* Label positioning */
ion-segment-button ion-label {
  margin: 0;
  padding: 0;
  font-size: 14px;
  white-space: nowrap;
}
</style>
