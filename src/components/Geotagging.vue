<!-- <template>
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
</style> -->

<!-- Mobile geotagging -->
<template>
  <div>
    <p v-if="location"><b>Latitude: </b> {{ location.latitude }}</p>
    <p v-if="location"><b>Longitude: </b>{{ location.longitude }}</p>
    <p v-if="placeName"><b>Place: </b> {{ placeName }}</p>
    <p v-else>Loading location...</p>
    <div v-if="location" id="map" style="height: 300px;"></div>
    <ion-button v-if="location" @click="tagLocation">Tag Location</ion-button>
    <div v-if="taggedLocations.length > 0">
      <h3>Tagged Locations:</h3>
      <ul>
        <li v-for="(tag, index) in taggedLocations" :key="index">
          {{ tag.placeName }}:
          <ul>
            <li v-for="(count, leafName) in tag.leafCounts" :key="leafName">
              {{ leafName }}: {{ count }} leaves found
            </li>
          </ul>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { Geolocation } from '@capacitor/geolocation';
import mapboxgl from 'mapbox-gl';
import axios from 'axios';
import { defineProps } from 'vue';

const props = defineProps({
  identifiedLeaf: {
    type: Object,
    required: true
  }
});

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface TaggedLocation {
  latitude: number;
  longitude: number;
  placeName: string;
  leafCounts: Record<string, number>;
}

interface IdentifiedLeaf {
  name: string;
}

const location = ref<Coordinates | null>(null);
const placeName = ref<string | null>(null);
const taggedLocations = ref<TaggedLocation[]>([]);
let map: mapboxgl.Map;

const getLocation = async () => {
  try {
    const permission = await Geolocation.requestPermissions();
    if (permission.location === 'granted') {
      const coordinates = await Geolocation.getCurrentPosition();
      location.value = {
        latitude: coordinates.coords.latitude,
        longitude: coordinates.coords.longitude,
      };
      printCurrentPosition(); // Call the function to print the current position
      await fetchPlaceName(coordinates.coords.latitude, coordinates.coords.longitude);
      initializeMap(coordinates.coords.latitude, coordinates.coords.longitude);
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
    const accessToken = 'pk.eyJ1IjoiZWxlY2Npb25saWVjYTAzIiwiYSI6ImNtM2c0cnlvMDAwc2oybXBzYm1oa255NGwifQ.dLRAV2QLeEQxQorFeKONYA'; // Replace with your Mapbox access token
    const response = await axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${accessToken}`);
    if (response.data && response.data.features && response.data.features.length > 0) {
      placeName.value = response.data.features[0].place_name;
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

const initializeMap = (latitude: number, longitude: number) => {
  mapboxgl.accessToken = 'pk.eyJ1IjoiZWxlY2Npb25saWVjYTAzIiwiYSI6ImNtM2c0cnlvMDAwc2oybXBzYm1oa255NGwifQ.dLRAV2QLeEQxQorFeKONYA'; // Replace with your Mapbox access token
  map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [longitude, latitude],
    zoom: 13
  });

  new mapboxgl.Marker()
    .setLngLat([longitude, latitude])
    .setPopup(new mapboxgl.Popup().setHTML('<h3>Leaf found here</h3>'))
    .addTo(map);
};

const tagLocation = () => {
  if (location.value && placeName.value) {
    const existingTag = taggedLocations.value.find((tag: TaggedLocation) => tag.latitude === location.value.latitude && tag.longitude === location.value.longitude);
    if (existingTag) {
      if (props.identifiedLeaf.name in existingTag.leafCounts) {
        existingTag.leafCounts[props.identifiedLeaf.name] += 1;
      } else {
        existingTag.leafCounts[props.identifiedLeaf.name] = 1;
      }
    } else {
      taggedLocations.value.push({
        latitude: location.value.latitude,
        longitude: location.value.longitude,
        placeName: placeName.value,
        leafCounts: { [props.identifiedLeaf.name]: 1 }
      });
    }
    addMarker(location.value.latitude, location.value.longitude, placeName.value, existingTag ? existingTag.leafCounts : { [props.identifiedLeaf.name]: 1 });
  }
};

const addMarker = (latitude: number, longitude: number, placeName: string, leafCounts: Record<string, number>) => {
  const leafCountsHtml = Object.entries(leafCounts).map(([leafName, count]) => `<p>${leafName}: ${count} leaves found</p>`).join('');
  new mapboxgl.Marker()
    .setLngLat([longitude, latitude])
    .setPopup(new mapboxgl.Popup().setHTML(`<h3>${placeName}</h3>${leafCountsHtml}`))
    .addTo(map);
};

onMounted(() => {
  getLocation();
});

watch(() => props.identifiedLeaf, (newLeaf) => {
  if (newLeaf) {
    tagLocation();
  }
});

function alert(arg0: string) {
  throw new Error('Function not implemented.');
}
</script>

<style scoped>
#map {
  height: 90px;
}
</style>

<!-- <template>
  <div>
    <p v-if="location"><b>Latitude: </b> {{ location.latitude }}</p>
    <p v-if="location"><b>Longitude: </b>{{ location.longitude }}</p>
    <p v-if="placeName"><b>Place: </b> {{ placeName }}</p>
    <p v-else>Loading location...</p>
    <div v-if="location" id="map" style="height: 300px;"></div>
    <ion-button v-if="location" @click="tagLocation">Tag Location</ion-button>
    <div v-if="taggedLocations.length > 0">
      <h3>Tagged Locations:</h3>
      <ul>
        <li v-for="(tag, index) in taggedLocations" :key="index">
          {{ tag.placeName }}:
          <ul>
            <li v-for="(count, leafName) in tag.leafCounts" :key="leafName">
              {{ leafName }}: {{ count }} leaves found
            </li>
          </ul>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import mapboxgl from 'mapbox-gl';
import axios from 'axios';
import { defineProps } from 'vue';

const props = defineProps({
  identifiedLeaf: {
    type: Object,
    required: true
  }
});

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface TaggedLocation {
  latitude: number;
  longitude: number;
  placeName: string;
  leafCounts: Record<string, number>;
}

interface IdentifiedLeaf {
  name: string;
}

const location = ref<Coordinates | null>(null);
const placeName = ref<string | null>(null);
const taggedLocations = ref<TaggedLocation[]>([]);
let map: mapboxgl.Map;

const getLocation = async () => {
  try {
    if (Capacitor.isNativePlatform()) {
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
        initializeMap(coordinates.coords.latitude, coordinates.coords.longitude);
      } else {
        alert('Location permission denied. Please enable location permissions to use this feature.');
      }
    } else {
      // Use browser's Geolocation API for web
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by this browser.');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position: GeolocationPosition) => {
          location.value = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          printCurrentPosition(); // Call the function to print the current position
          await fetchPlaceName(position.coords.latitude, position.coords.longitude);
          initializeMap(position.coords.latitude, position.coords.longitude);
        },
        (error: GeolocationPositionError) => {
          console.error('Error getting location:', error);
          if (error.code === error.PERMISSION_DENIED) {
            alert('Geolocation permission denied. Please enable it in your browser settings.');
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            alert('Location information is unavailable.');
          } else if (error.code === error.TIMEOUT) {
            alert('The request to get user location timed out.');
          } else {
            alert('An unknown error occurred while getting your location.');
          }
        }
      );
    }
  } catch (error) {
    console.error('Error getting location:', error);
    alert('Error getting location. Please try again.');
  }
};

const fetchPlaceName = async (latitude: number, longitude: number) => {
  try {
    const accessToken = 'pk.eyJ1IjoiZWxlY2Npb25saWVjYTAzIiwiYSI6ImNtM2c0cnlvMDAwc2oybXBzYm1oa255NGwifQ.dLRAV2QLeEQxQorFeKONYA'; // Replace with your Mapbox access token
    const response = await axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${accessToken}`);
    if (response.data && response.data.features && response.data.features.length > 0) {
      placeName.value = response.data.features[0].place_name;
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

const initializeMap = (latitude: number, longitude: number) => {
  mapboxgl.accessToken = 'pk.eyJ1IjoiZWxlY2Npb25saWVjYTAzIiwiYSI6ImNtM2c0cnlvMDAwc2oybXBzYm1oa255NGwifQ.dLRAV2QLeEQxQorFeKONYA'; // Replace with your Mapbox access token
  map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [longitude, latitude],
    zoom: 13
  });

  new mapboxgl.Marker()
    .setLngLat([longitude, latitude])
    .setPopup(new mapboxgl.Popup().setHTML('<h3>Leaf found here</h3>'))
    .addTo(map);
};

const tagLocation = () => {
  if (location.value && placeName.value) {
    const existingTag = taggedLocations.value.find((tag: TaggedLocation) => tag.latitude === location.value.latitude && tag.longitude === location.value.longitude);
    if (existingTag) {
      if (props.identifiedLeaf.name in existingTag.leafCounts) {
        existingTag.leafCounts[props.identifiedLeaf.name] += 1;
      } else {
        existingTag.leafCounts[props.identifiedLeaf.name] = 1;
      }
    } else {
      taggedLocations.value.push({
        latitude: location.value.latitude,
        longitude: location.value.longitude,
        placeName: placeName.value,
        leafCounts: { [props.identifiedLeaf.name]: 1 }
      });
    }
    addMarker(location.value.latitude, location.value.longitude, placeName.value, existingTag ? existingTag.leafCounts : { [props.identifiedLeaf.name]: 1 });
  }
};

const addMarker = (latitude: number, longitude: number, placeName: string, leafCounts: Record<string, number>) => {
  const leafCountsHtml = Object.entries(leafCounts).map(([leafName, count]) => `<p>${leafName}: ${count} leaves found</p>`).join('');
  new mapboxgl.Marker()
    .setLngLat([longitude, latitude])
    .setPopup(new mapboxgl.Popup().setHTML(`<h3>${placeName}</h3>${leafCountsHtml}`))
    .addTo(map);
};

onMounted(() => {
  getLocation();
});

watch(() => props.identifiedLeaf, (newLeaf) => {
  if (newLeaf) {
    tagLocation();
  }
});
function alert(arg0: string) {
  throw new Error('Function not implemented.');
}
</script>

<style scoped>
#map {
  height: 90px;
}
</style> -->