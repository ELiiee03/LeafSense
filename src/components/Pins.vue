<template>
  <ion-page>
    <ion-content class="map-content">
      <!-- <div class="map-container"> -->
        <div id="map"></div>
      <!-- </div> -->
      <!-- <ion-button @click="openMapInBrowser">Open Map in Browser</ion-button> -->
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
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
</script>

<style scoped>
.map-content {
  height: 100%; /* Full height of the parent container */
}

#map {
  height: 300px

}
</style>