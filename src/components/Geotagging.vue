
<!-- Mobile geotagging -->
<template>
  <div>
    <p v-if="location"><b>Latitude: </b> {{ location.latitude }}</p>
    <p v-if="location"><b>Longitude: </b>{{ location.longitude }}</p>
    <p v-if="placeName"><b>Place: </b> {{ placeName }}</p>
    <p v-else>Loading location...</p>
    <!-- <div v-if="location" id="map" style="height: 500px;"></div> -->

    <div class="title"><p><b>Select Leaf Count</b></p></div>
    <!--LEAF COUNTER -->
    <ion-grid>
      <ion-row>
        <ion-col class="incrementBtn" size="auto">
          <ion-button size="small" @click="decrementLeafCount">
            <ion-icon slot="icon-only" :icon="removeOutline"></ion-icon>
          </ion-button>
        </ion-col>
        <ion-col class="leafcount" size="5">
          <p>{{ leafCount }}</p>
        </ion-col>
        <ion-col class="decrementBtn" size="auto">
          <ion-button size="small"  @click="incrementLeafCount">
            <ion-icon slot="icon-only" :icon="addOutline"></ion-icon>
          </ion-button>
        </ion-col>
      </ion-row>
    </ion-grid>

    <!-- LOCATION TAGGING -->
    <!-- <ion-button expand="block" v-if="location" @click="tagLocation">Save</ion-button> -->
    <!-- <ion-button expand="block" v-if="location" @click="tagLocation(); presentToast('top')">Save</ion-button> -->
    
    <ion-button expand="block" v-if="location" @click="saveAndNavigate">Save</ion-button>
    <!-- <div v-if="taggedLocations.length > 0">
      <h3>Tagged Locations:</h3>
      <ul>
        <li v-for="(tag, index) in taggedLocations":key="index">
          {{ tag.placeName }}:
          <ul>
            <li v-for="(count, leafName) in tag.leafCounts" :key="leafName">
              {{ leafName }}: {{ count }} leaves found
            </li>
          </ul>
        </li>
      </ul>
    </div> -->
  </div>
</template>

<!-- <script setup lang="ts">
import { ref, onMounted, watch, defineEmits } from 'vue';
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

const emit = defineEmits(['updateTaggedLocations']);

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
    const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
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
  mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
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
    emit('updateTaggedLocations', taggedLocations.value);
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


<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useTaggedLocationsStore } from '@/stores/taggedLocations';
import { useRouter } from 'vue-router';
import { IonButton, IonIcon, toastController, modalController } from '@ionic/vue';
import { addOutline, removeOutline } from 'ionicons/icons';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
// import mapboxgl from 'mapbox-gl';
import axios from 'axios';


// const props = defineProps({
//   identifiedLeaf: {
//     type: Object,
//     required: true
//   }
// });

// const emit = defineEmits(['updateTaggedLocations']);
// const router = useRouter();

interface Coordinates {
  latitude: number;
  longitude: number;
}

// interface TaggedLocation {
//   latitude: number;
//   longitude: number;
//   placeName: string;
//   leafCounts: Record<string, number>;
// }

interface IdentifiedLeaf {
  name: string;
}

const location = ref<Coordinates | null>(null);
const placeName = ref<string | null>(null);
// const taggedLocations = ref<TaggedLocation[]>([]);
// let map: mapboxgl.Map;
const leafCount = ref(0);

const store = useTaggedLocationsStore();
const router = useRouter();


const tagLocation = () => {
  if (location.value && placeName.value) {
    const newTaggedLocation = {
      latitude: location.value.latitude,
      longitude: location.value.longitude,
      placeName: placeName.value,
      leafCounts: { 'Leaf Count': leafCount.value }
    };
    store.addTaggedLocation(newTaggedLocation);
  }
};
const saveAndNavigate = async () => {
  tagLocation();
  await presentToast('top');
  await modalController.dismiss(); // to close the modal
  router.push({ name: 'pins' });
};

const incrementLeafCount = () => {
  leafCount.value += 1;
};

const decrementLeafCount = () => {
  if (leafCount.value > 0) {
    leafCount.value -= 1;
  }
};
const getLocation = async () => {
  try {
    if (Capacitor.isNativePlatform()) {
      const permission = await Geolocation.requestPermissions();
      if (permission.location === 'granted') {
        const coordinates = await Geolocation.getCurrentPosition();
        location.value = {
          latitude: coordinates.coords.latitude,
          longitude: coordinates.coords.longitude,
        };
        printCurrentPosition(); // Call the function to print the current position
        await fetchPlaceName(coordinates.coords.latitude, coordinates.coords.longitude);
        // initializeMap(coordinates.coords.latitude, coordinates.coords.longitude);
      } else {
        alert('Location permission denied. Please enable location permissions to use this feature.');
      }
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          location.value = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          await fetchPlaceName(position.coords.latitude, position.coords.longitude);
        },
        (error: GeolocationPositionError) => {
          console.error('Error getting location:', error);
          alert('Error getting location. Please try again.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  } catch (error) {
    console.error('Error getting location:', error);
    alert('Error getting location. Please try again.');
  }
};

const fetchPlaceName = async (latitude: number, longitude: number) => {
  try {
    const accessToken = 'pk.eyJ1IjoiZWxlY2Npb25saWVjYTAzIiwiYSI6ImNtM2c0cnlvMDAwc2oybXBzYm1oa255NGwifQ.dLRAV2QLeEQxQorFeKONYA';
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

// const initializeMap = (latitude: number, longitude: number) => {
//   const accessToken = 'pk.eyJ1IjoiZWxlY2Npb25saWVjYTAzIiwiYSI6ImNtM2c0cnlvMDAwc2oybXBzYm1oa255NGwifQ.dLRAV2QLeEQxQorFeKONYA';
//   if (!accessToken) {
//     console.error('Mapbox access token is not defined');
//     return;
//   }

//   mapboxgl.accessToken = accessToken;
//   map = new mapboxgl.Map({
//     container: 'map',
//     style: 'mapbox://styles/mapbox/streets-v11',
//     center: [longitude, latitude],
//     zoom: 13
//   });

//   new mapboxgl.Marker()
//     .setLngLat([longitude, latitude])
//     .setPopup(new mapboxgl.Popup().setHTML('<h3>Leaf found here</h3>'))
//     .addTo(map);
// };

// const tagLocation = async () => {
//   if (location.value.latitude && location.value.longitude && placeName.value) {
//     const existingTag = taggedLocations.value.find((tag: TaggedLocation) => tag.latitude === location.value.latitude && tag.longitude === location.value.longitude);
//     if (existingTag) {
//       if (props.identifiedLeaf.name in existingTag.leafCounts) {
//         existingTag.leafCounts[props.identifiedLeaf.name] += leafCount.value;
//       } else {
//         existingTag.leafCounts[props.identifiedLeaf.name] = leafCount.value;
//       }
//     } else {
//       taggedLocations.value.push({
//         latitude: location.value.latitude,
//         longitude: location.value.longitude,
//         placeName: placeName.value,
//         leafCounts: { [props.identifiedLeaf.name]: leafCount.value }
//       });
//     }
//     addMarker(location.value.latitude, location.value.longitude, placeName.value, existingTag ? existingTag.leafCounts : { [props.identifiedLeaf.name]: leafCount.value });
//     emit('updateTaggedLocations', taggedLocations.value);
//   }
// };
// const addMarker = (latitude: number, longitude: number, placeName: string, leafCount: Record<string, number>) => {
//   const leafCountsHtml = Object.entries(leafCount).map(([leafName, count]) => `<p>${leafName}: ${count} leaves found</p>`).join('');
//   new mapboxgl.Marker()
//     .setLngLat([longitude, latitude])
//     .setPopup(new mapboxgl.Popup().setHTML(`<h3>${placeName}</h3>${leafCountsHtml}`))
//     .addTo(map);
// };

const presentToast = async (position: 'top' | 'middle' | 'bottom') => {
  const toast = await toastController.create({
    message: 'Saved successfully!',
    duration: 1000,
    position: position,
  });

  await toast.present();
};

onMounted(() => {
  getLocation();
});

// watch(() => props.identifiedLeaf, (newLeaf) => {
//   if (newLeaf) {
//     tagLocation();
//   }
// });

function alert(arg0: string) {
  throw new Error('Function not implemented.');
}
</script>
 

<style scoped>
#map {
  height: 300px;
}
ion-row {
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  margin-bottom: 5px;
  margin-top: 2px;
}
ion-grid {
  margin-bottom: 3px;
  margin-top: 2px;
}
ion-col {
  width: 2px;

}
.leafcount {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 30px;
  border: 1px solid #034e28;
}
.incrementBtn {
  height: 34px;
  margin-top: 0px;
  padding-top: 0px;
  width: 1px;
  --background: #034e28;
}

.decrementBtn {
  height: 35px;
  margin-top: 0px;
  padding-top: 0px;
  width: 0px;
  --background: #034e28;
}
.title {
  margin-bottom: 2px;
  padding-bottom: 1px;
  height: 20px;;
}
ion-button {
  --background: #034e28;
}
</style>