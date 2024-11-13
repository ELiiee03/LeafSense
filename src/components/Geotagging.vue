<!-- <template>
  <div>
    <p v-if="location">Latitude: {{ location.latitude }}, Longitude: {{ location.longitude }}</p>
    <p v-else>Loading location...</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

import { Geolocation } from '@capacitor/geolocation';

const location = ref<{ latitude: number; longitude: number } | null>(null);

const getLocation = async () => {
  try {
    const permission = await Geolocation.requestPermissions();
    if (permission.location === 'granted') {
      const coordinates = await Geolocation.getCurrentPosition();
      location.value = {
        latitude: coordinates.coords.latitude,
        longitude: coordinates.coords.longitude,
      };
    } else {
      alert('Location permission denied. Please enable location permissions to use this feature.');
    }
  } catch (error) {
    console.error('Error getting location:', error);
    alert('Error getting location. Please try again.');
  }
};

onMounted(() => {
  getLocation();
});
 
function alert(arg0: string) {
    throw new Error('Function not implemented.');
}
</script>

<style scoped>
/* Add your styles here */
</style> -->
<template>
  <div>
    <p v-if="location"><b>Latitude: </b> {{ location.latitude }}</p>
    <p v-if="location"><b>Longitude: {{ location.longitude }}</b></p>
    <p v-if="placeName">Place: {{ placeName }}</p>
    <p v-else>Loading location...</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Geolocation } from '@capacitor/geolocation';
import axios from 'axios';

const location = ref<{ latitude: number; longitude: number } | null>(null);
const placeName = ref<string | null>(null);

const getLocation = async () => {
  try {
    // Use Capacitor Geolocation plugin for native platforms
    const permission = await Geolocation.requestPermissions();
    if (permission.location === 'granted') {
      const coordinates = await Geolocation.getCurrentPosition();
      location.value = {
        latitude: coordinates.coords.latitude,
        longitude: coordinates.coords.longitude,
      };
      printCurrentPosition(); // Call the function to print the current position
      await fetchPlaceName(coordinates.coords.latitude, coordinates.coords.longitude);
    } else {
      alert('Location permission denied. Please enable location permissions to use this feature.');
    }
  } catch (error) {
    console.error('Error getting location:', error);
    alert('Error getting location. Please try again.');
  }
};

const fetchPlaceName = async (latitude: number, longitude: number) => {
  try {
    const apiKey = 'd413042a180b494ca331c2f3f82c2d19'; // Replace with your OpenCage API key
    const response = await axios.get(`https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${apiKey}`);
    if (response.data && response.data.results && response.data.results.length > 0) {
      placeName.value = response.data.results[0].formatted;
    } else {
      placeName.value = 'Unknown location';
    }
  } catch (error) {
    console.error('Error fetching place name:', error);
    placeName.value = 'Error fetching place name';
  }
};

const printCurrentPosition = async () => {
  try {
    const coordinates = await Geolocation.getCurrentPosition();
    console.log('Current position:', coordinates);
  } catch (error) {
    console.error('Error getting current position:', error);
  }
};

onMounted(() => {
  getLocation();
});

function alert(arg0: string) {
  throw new Error('Function not implemented.');
}
</script>

<style scoped>
/* Add your styles here */
</style>