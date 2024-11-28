<!-- <template>
  <ion-page>
    <ion-content class="map-content">
      <!-- <div class="map-container"> -->
        <!-- <div id="map"></div>
  </ion-page>
</template>  -->

<!-- <script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import mapboxgl from 'mapbox-gl';
import { defineProps } from 'vue';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';



interface TaggedLocation {
  longitude: number;
  latitude: number;
  placeName: string;
  leafCounts: Record<string, number>;
}

const props = defineProps<{
  taggedLocations: TaggedLocation[];
}>();

let map: mapboxgl.Map;

const initializeMap = () => {
  if (!props.taggedLocations || props.taggedLocations.length === 0) {
    console.error("No tagged locations provided!");
    // Handle the case where there are no locations gracefully.
    // You might want to display a message to the user or hide the map.
    return; // Exit the function early
  }
  mapboxgl.accessToken = 'pk.eyJ1IjoiZWxlY2Npb25saWVjYTAzIiwiYSI6ImNtM2c0cnlvMDAwc2oybXBzYm1oa255NGwifQ.dLRAV2QLeEQxQorFeKONYA'
  map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [props.taggedLocations[0]?.longitude || 0, props.taggedLocations[0]?.latitude || 0],
    zoom: 13
  });
  map.on('load', () => {
    props.taggedLocations.forEach(tag => {
      addMarker(tag.latitude, tag.longitude, tag.placeName, tag.leafCounter);
    });
  });
};

const addMarker = (latitude: number, longitude: number, placeName: string, leafCounts: Record<string, number>) => {
  const leafCountsHtml = Object.entries(leafCounts).map(([leafName, count]) => `<p>${leafName}: ${count} leaves found</p>`).join('');
  new mapboxgl.Marker()
    .setLngLat([longitude, latitude])
    .setPopup(new mapboxgl.Popup().setHTML(`<h3>${placeName}</h3>${leafCountsHtml}`))
    .addTo(map);
};

const openMapInBrowser = () => {
  if (Capacitor.isNativePlatform()) {
    Geolocation.getCurrentPosition().then((position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const url = `https://api.mapbox.com/styles/v1/mapbox/streets-v11.html?access_token=${mapboxgl.accessToken}#13/${latitude}/${longitude}`;
      window.open(url, '_blank');
    }).catch((error) => {
      console.error('Error getting location:', error);
      alert('Error getting location. Please try again.');
    });
  } else {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const url = `https://api.mapbox.com/styles/v1/mapbox/streets-v11.html?access_token=${mapboxgl.accessToken}#13/${latitude}/${longitude}`;
        window.open(url, '_blank');
      }, (error) => {
        console.error('Error getting location:', error);
        alert('Error getting location. Please try again.');
      });
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  }
};

onMounted(() => {
  initializeMap();
});

watch(() => props.taggedLocations, (newTaggedLocations) => {
  if (map) {
    newTaggedLocations.forEach(tag => {
      addMarker(tag.latitude, tag.longitude, tag.placeName, tag.leafCounts);
    });
  }
});
</script> -->

<!-- <script setup lang="ts">
import { onMounted } from 'vue';
import { useTaggedLocationsStore } from '@/stores/taggedLocations';
import mapboxgl from 'mapbox-gl';

const store = useTaggedLocationsStore();

let map: mapboxgl.Map;

const initializeMap = () => {
  if (!store.taggedLocations || store.taggedLocations.length === 0) {
    console.error("No tagged locations provided!");
    return;
  }
  mapboxgl.accessToken = 'pk.eyJ1IjoiZWxlY2Npb25saWVjYTAzIiwiYSI6ImNtM2c0cnlvMDAwc2oybXBzYm1oa255NGwifQ.dLRAV2QLeEQxQorFeKONYA';
  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [store.taggedLocations[0].longitude, store.taggedLocations[0].latitude],
    zoom: 13
  });
  map.on('load', () => {
    store.taggedLocations.forEach(tag => {
      addMarker(tag.latitude, tag.longitude, tag.placeName, tag.leafCounts);
    });
  });
};

const addMarker = (latitude: number, longitude: number, placeName: string, leafCounts: Record<string, number>) => {
  const leafCountsHtml = Object.entries(leafCounts).map(([leafName, count]) => `<p>${leafName}: ${count} leaves found</p>`).join('');
  new mapboxgl.Marker()
    .setLngLat([longitude, latitude])
    .setPopup(new mapboxgl.Popup().setHTML(`<h3>${placeName}</h3>${leafCountsHtml}`))
    .addTo(map);
};

onMounted(() => {
  initializeMap();
});
</script> -->

<template>
    <ion-content>
      <div id="map"></div>
      <PinLogs />
    </ion-content>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useTaggedLocationsStore } from '@/stores/taggedLocations';
import mapboxgl from 'mapbox-gl';
import PinLogs from '@/components/PinLogs.vue';

const store = useTaggedLocationsStore();

let map: mapboxgl.Map;

const initializeMap = () => {
  if (!store.taggedLocations || store.taggedLocations.length === 0) {
    console.error("No tagged locations provided!");
    return;
  }
  mapboxgl.accessToken = 'pk.eyJ1IjoiZWxlY2Npb25saWVjYTAzIiwiYSI6ImNtM2c0cnlvMDAwc2oybXBzYm1oa255NGwifQ.dLRAV2QLeEQxQorFeKONYA';
  map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [store.taggedLocations[0].longitude, store.taggedLocations[0].latitude],
    zoom: 13
  });
  map.on('load', () => {
    console.log('Map loaded');
    store.taggedLocations.forEach(tag => {
      console.log('Adding marker:', tag);
      addMarker(tag.latitude, tag.longitude, tag.placeName, tag.leafCounter);
    });
  });
};

const addMarker = (latitude: number, longitude: number, placeName: string, leafCounter: number) => {
  const leafCountsHtml = `<h5>Leaves found: ${leafCounter}</h5>`;
  new mapboxgl.Marker()
    .setLngLat([longitude, latitude])
    .setPopup(new mapboxgl.Popup().setHTML(`<h4>${placeName}</h4>${leafCountsHtml}`))
    .addTo(map);
};

onMounted(() => {
  initializeMap();
});

watch(
  () => store.taggedLocations,
  (newTaggedLocations) => {
    if (map) {
      // Clear existing markers
      const style = map.getStyle();
      if (style && style.layers) {
        style.layers.forEach((layer) => {
          if (layer.type === 'symbol' && map.getLayer(layer.id)) {
            map.removeLayer(layer.id);
          }
          if (map.getSource(layer.id)) {
            map.removeSource(layer.id);
          }
        });
      }

      // Add new markers
      newTaggedLocations.forEach(tag => {
        console.log('Adding marker:', tag);
        addMarker(tag.latitude, tag.longitude, tag.placeName, tag.leafCounter);
      });
    } else {
      // Re-initialize the map if it was not initialized
      initializeMap();
    }
  },
  { deep: true }
);
</script>

<style scoped>

#map {
  height: 300px;
}
</style>