<template>
    <ion-page>
     <ion-content>
      <RecentIdentifications />
     </ion-content>
    </ion-page>
  </template>
  
  <script setup>
   import { IonIcon, IonFab, IonFabButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle } from '@ionic/vue';
  import { ref, onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import { add } from 'ionicons/icons';
import RecentIdentifications from './RecentIdentifications.vue';
  
  const router = useRouter();
  
  const recentLeaves = ref([
    { id: 1, name: 'Mango Leaf' },
    { id: 2, name: 'Guava Leaf' },
      { id: 3, name: 'Jackfruit Leaf' },
  ]);
  
  const leafCategories = ref([
    { id: 1, name: 'Medicinal' },
    { id: 2, name: 'Edible' },
    { id: 3, name: 'Toxic' },
    { id: 4, name: 'Ornamental' }
  ]);
  
  const dailyFact = ref("Some leaves can help purify the air by removing toxins!");
  
  const startScan = () => {
    console.log("Starting leaf scan...");
  };
  
  const exploreCategory = (category) => {
    console.log("Exploring category:", category.name);
  };
  
  const goToProfile = () => {
    router.push('/profile');
  };
  </script>
  
  <style scoped>
  .home-container {
    padding: 15px;
    text-align: center;
  }
  .horizontal-scroll {
    display: flex;
    gap: 10px;
    overflow-x: auto;
    white-space: nowrap;
  }

  .leafCard {
    width: 55%;
    height: 90%;
  }
  .subtitle-fab-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .fab-button {
    align-self: flex-end;
    margin-top: 30px;
    margin-right: -6px;
    --border-color: #000;
    --border-style: solid;
  }
.add-button {
    --color: green;
    --background-hover: #9ce0be;
}

</style>
  