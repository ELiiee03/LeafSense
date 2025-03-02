<template>
    <ion-page>
      <!-- <ion-header>
        <ion-toolbar>
          <ion-title>LeafSense</ion-title>
        </ion-toolbar>
      </ion-header> -->
      
      <ion-content>
        <div class="home-container">
            <h1 class="ion-text-left"><i>Discover the world of leaves around you!</i></h1>
          <!-- Quick Scan Button -->
          <!-- <ion-button expand="full" color="success" @click="startScan">
            <ion-icon :icon="camera" slot="start"></ion-icon>
            Scan a Leaf
          </ion-button> -->

          <div>
            <ion-list lines="none">
                <ion-item>
                  <ion-label><h1><b>Recents</b></h1></ion-label>
                </ion-item>
                <ion-item>
                    <ion-card class="leafCard" color="light">
                        <img alt="Silhouette of mountains" src="https://ionicframework.com/docs/img/demos/card-media.png" />
                        <ion-card-header>
                            <ion-card-title>Jackfruit</ion-card-title>
                            <div class="subtitle-fab-container">
                                <ion-card-subtitle>
                                  Arthocarpus chiminemens
                                </ion-card-subtitle>
                                <ion-fab  horizontal="end" class="fab-button">
                                    <ion-button fill="clear" size="large" class="add-button">
                                        <ion-icon slot="icon-only" :icon="add" :md="settingsSharp"></ion-icon>
                                      </ion-button>
                                </ion-fab>
                              </div>
                          </ion-card-header>
                          <ion-card-content>

                          </ion-card-content>
                      </ion-card>
                </ion-item>
                <ion-item>
                  <ion-label>No Lines</ion-label>
                </ion-item>
              </ion-list>
          </div>
          
          <!-- Recent Identifications -->
          <ion-card v-if="recentLeaves.length">
            <ion-card-header>
              <ion-card-title>Recent Identifications</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-scroll scroll-x="true" class="horizontal-scroll">
                <ion-chip v-for="leaf in recentLeaves" :key="leaf.id">
                  <ion-label>{{ leaf.name }}</ion-label>
                </ion-chip>
              </ion-scroll>
            </ion-card-content>
          </ion-card>
          
          <!-- Explore Leaf Database -->
          <ion-card>
            <ion-card-header>
              <ion-card-title>Explore Leaf Database</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-grid>
                <ion-row>
                  <ion-col v-for="category in leafCategories" :key="category.id" size="6">
                    <ion-button expand="full" @click="exploreCategory(category)">{{ category.name }}</ion-button>
                  </ion-col>
                </ion-row>
              </ion-grid>
            </ion-card-content>
          </ion-card>
          
          <!-- Daily Leaf Fact -->
          <ion-card>
            <ion-card-content>
              <p><strong>Did you know?</strong> {{ dailyFact }}</p>
            </ion-card-content>
          </ion-card>
          
          <!-- Profile & Settings -->
          <ion-button expand="full" color="medium" @click="goToProfile">Profile & Preferences</ion-button>
        </div>
      </ion-content>
    </ion-page>
  </template>
  
  <script setup>
   import { IonIcon, IonFab, IonFabButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle } from '@ionic/vue';
  import { ref, onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import { add } from 'ionicons/icons';
  
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
  