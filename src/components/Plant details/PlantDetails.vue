<template>
        <ion-segment v-model="selectedTab">
          <ion-segment-button value="overview">
            <ion-label>Overview</ion-label>
          </ion-segment-button>
          <ion-segment-button value="features">
            <ion-label>Features</ion-label>
          </ion-segment-button>
          <ion-segment-button value="uses">
            <ion-label>Uses</ion-label>
          </ion-segment-button>
          <ion-segment-button value="ecology">
            <ion-label>Ecology</ion-label>
          </ion-segment-button>
        </ion-segment>
  
        <div v-if="selectedTab === 'overview'" class="tab-content">
          <ion-card class="details-card">
            <ion-card-header>
              <ion-card-title>Description</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <p class="description-text">{{ leafData?.leafInfo?.description || 'No overview available' }}</p>
            </ion-card-content>
          </ion-card>
          
          <div class="info-cards-container">
            <ion-card class="info-card">
              <ion-card-content>
                <div class="info-header">
                  <ion-icon name="leaf-outline" class="info-icon"></ion-icon>
                  <h3>Habitat</h3>
                </div>
                <p>{{ leafData?.leafInfo?.habitat || 'Habitat information unavailable' }}</p>
              </ion-card-content>
            </ion-card>
            
            <ion-card class="info-card">
              <ion-card-content>
                <div class="info-header">
                  <ion-icon name="pricetag-outline" class="info-icon"></ion-icon>
                  <h3>Also Known As</h3>
                </div>
                <div class="alias-container" v-if="leafData?.leafInfo?.aliases && leafData.leafInfo.aliases.length > 0">
                  <ion-chip v-for="alias in leafData.leafInfo.aliases" :key="alias" class="alias-chip">
                    {{ alias }}
                  </ion-chip>
                </div>
                <p v-else>No alternate names available</p>
              </ion-card-content>
            </ion-card>
          </div>
        </div>
        <div v-if="selectedTab === 'features'" class="tab-content">
          <ion-card class="feature-card">
            <ion-card-header>
              <ion-card-title>Physical Characteristics</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <div class="feature-table">
                <div class="feature-row">
                  <div class="feature-label">Color</div>
                  <div class="feature-value">{{ leafData?.leafInfo?.color || 'Green foliage, dark grey to greyish brown bark' }}</div>
                </div>
                <div class="feature-row">
                  <div class="feature-label">Foliage</div>
                  <div class="feature-value">{{ leafData?.leafInfo?.foliage || 'Thin-leathery and obovate-elliptic to elliptic leaves, smooth on surface and rough on undersides' }}</div>
                </div>
                <div class="feature-row">
                  <div class="feature-label">Bark</div>
                  <div class="feature-value">{{ leafData?.leafInfo?.bark || 'Rough or scaly, dark grey to greyish brown in colour' }}</div>
                </div>
                <div class="feature-row">
                  <div class="feature-label">Fruit</div>
                  <div class="feature-value">{{ leafData?.leafInfo?.fruit || 'Large composite fruit covered with conical warts, juicy and sweet-tasting aril' }}</div>
                </div>
              </div>
            </ion-card-content>
          </ion-card>

          <ion-card class="feature-card">
            <ion-card-header>
              <ion-card-title>Shape & Structure</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <div class="feature-table">
                <div class="feature-row">
                  <div class="feature-label">Crown</div>
                  <div class="feature-value">{{ leafData?.leafInfo?.crown || 'Dense and conical when young, becomes rounded and spreading when older' }}</div>
                </div>
                <div class="feature-row">
                  <div class="feature-label">Trunk</div>
                  <div class="feature-value">{{ leafData?.leafInfo?.trunk || 'Straight with rough bark' }}</div>
                </div>
                <div class="feature-row">
                  <div class="feature-label">Leaves</div>
                  <div class="feature-value">{{ leafData?.leafInfo?.leaves || 'Obovate-elliptic to elliptic' }}</div>
                </div>
              </div>
            </ion-card-content>
          </ion-card>

          <ion-card class="feature-card">
            <ion-card-header>
              <ion-card-title>Leaf Characteristics</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <div class="feature-table">
                <div class="feature-row">
                  <div class="feature-label">Retention</div>
                  <div class="feature-value">{{ leafData?.leafInfo?.retention || 'Evergreen' }}</div>
                </div>
                <div class="feature-row">
                  <div class="feature-label">Texture</div>
                  <div class="feature-value">{{ leafData?.leafInfo?.texture || 'Leathery, Thin' }}</div>
                </div>
                <div class="feature-row">
                  <div class="feature-label">Venation</div>
                  <div class="feature-value">{{ leafData?.leafInfo?.foliarVenation || 'Pinnate' }}</div>
                </div>
                <div class="feature-row">
                  <div class="feature-label">Behavior</div>
                  <div class="feature-value">{{ leafData?.leafInfo?.uniqueBehavior || 'Leaves often have variable shapes on the same plant' }}</div>
                </div>
                <div class="feature-row">
                  <div class="feature-label">Growth Habits</div>
                  <div class="feature-value">{{ leafData?.leafInfo?.growthHabits || 'Leaves often have variable shapes on the same plant' }}</div>
                </div>
              </div>
            </ion-card-content>
          </ion-card>
        </div>
        <div v-if="selectedTab === 'uses'" class="tab-content">
          <ion-card class="uses-card">
            <ion-card-content>
              <div class="use-section">
                <div class="use-header">
                  <ion-icon :icon="restaurantOutline" class="use-icon edible-icon"></ion-icon>
                  <h3>Edible Uses</h3>
                </div>
                <p class="use-description">{{ leafData?.leafInfo?.edibleUses || 'Young fruit cooked as vegetable, ripe fruit eaten fresh or made into delicacies; seeds edible after boiling/roasting or ground into flour' }}</p>
              </div>
            </ion-card-content>
          </ion-card>

          <ion-card class="uses-card">
            <ion-card-content>
              <div class="use-section">
                <div class="use-header">
                  <ion-icon :icon="medkitOutline" class="use-icon medicinal-icon"></ion-icon>
                  <h3>Medicinal Uses</h3>
                </div>
                <p class="use-description">{{ leafData?.leafInfo?.medicinalUses || 'Pulp and seeds as cooling tonic; latex treats abscesses and snakebites; root treats skin diseases and asthma; extract for fever and diarrhea, leaves for wounds' }}</p>
              </div>
            </ion-card-content>
          </ion-card>

          <ion-card class="uses-card">
            <ion-card-content>
              <div class="use-section">
                <div class="use-header">
                  <ion-icon :icon="constructOutline" class="use-icon timber-icon"></ion-icon>
                  <h3>Timber Uses</h3>
                </div>
                <p class="use-description">{{ leafData?.leafInfo?.timberUses || 'Superior hardwood resistant to termites and decay; used for furniture, construction, musical instruments; takes polish well' }}</p>
              </div>
            </ion-card-content>
          </ion-card>

          <ion-card class="uses-card">
            <ion-card-content>
              <div class="use-section">
                <div class="use-header">
                  <ion-icon :icon="ellipsisHorizontalCircleOutline" class="use-icon other-icon"></ion-icon>
                  <h3>Other Uses</h3>
                </div>
                <p class="use-description">{{ leafData?.leafInfo?.otherUses || 'Wood particles yield yellow dye for silk and cotton' }}</p>
              </div>
            </ion-card-content>
          </ion-card>
        </div>
        <div v-if="selectedTab === 'ecology'" class="tab-content">
          <div class="ecology-grid">
            <ion-card class="ecology-card">
              <ion-card-content>
                <div class="ecology-icon-container">
                  <ion-icon :icon="thermometerOutline" class="ecology-icon"></ion-icon>
                </div>
                <h4 class="ecology-title">Climate</h4>
                <p class="ecology-value">{{ leafData?.leafInfo?.climate || 'Tropical' }}</p>
              </ion-card-content>
            </ion-card>
            
            <ion-card class="ecology-card">
              <ion-card-content>
                <div class="ecology-icon-container">
                  <ion-icon :icon="syncOutline" class="ecology-icon"></ion-icon>
                </div>
                <h4 class="ecology-title">Lifespan</h4>
                <p class="ecology-value">{{ leafData?.leafInfo?.lifespan || 'Perennial' }}</p>
              </ion-card-content>
            </ion-card>
            
            <ion-card class="ecology-card">
              <ion-card-content>
                <div class="ecology-icon-container">
                  <ion-icon :icon="sunnyOutline" class="ecology-icon"></ion-icon>
                </div>
                <h4 class="ecology-title">Light Needs</h4>
                <p class="ecology-value">{{ leafData?.leafInfo?.lightNeeds || 'Full Sun' }}</p>
              </ion-card-content>
            </ion-card>
            
            <ion-card class="ecology-card">
              <ion-card-content>
                <div class="ecology-icon-container">
                  <ion-icon :icon="waterOutline" class="ecology-icon"></ion-icon>
                </div>
                <h4 class="ecology-title">Water Needs</h4>
                <p class="ecology-value">{{ leafData?.leafInfo?.waterNeeds || 'Moderate Water' }}</p>
              </ion-card-content>
            </ion-card>
          </div>
          
          <ion-card class="soil-card">
            <ion-card-header>
              <ion-card-title>Soil Requirements</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <p class="soil-description">{{ leafData?.leafInfo?.soilRequirements || 'Deep, well-drained, alluvial and sandy or loamy soils, pH 6.0-7.5' }}</p>
            </ion-card-content>
          </ion-card>
        </div>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue';
  import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonSegment, IonSegmentButton, IonLabel, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonChip, IonIcon } from '@ionic/vue';
  import { arrowBack, leafOutline, restaurantOutline, 
           medkitOutline, constructOutline, ellipsisHorizontalCircleOutline,
           thermometerOutline, syncOutline, sunnyOutline, waterOutline, pricetagOutline } from 'ionicons/icons';

  interface LeafData {
    inference?: {
        predictedClass: string;
        confidence: number;
    };
    leafInfo?: {
        name: string;
        scientificName: string;
        familyName: string;
        description: string;
        habitat: string;
        color: string;
        shape: string;
        margin: string;
        growthHabits: string;
        imageData?: string;
        imageType?: string;
        imagePath?: string;
        aliases?: string[];
        foliage?: string;
        bark?: string;
        fruit?: string;
        crown?: string;
        trunk?: string;
        retention?: string;
        texture?: string;
        edibleUses?: string;
        medicinalUses?: string;
        timberUses?: string;
        otherUses?: string;
        climate?: string;
        lifespan?: string;
        lightNeeds?: string;
        waterNeeds?: string;
        soilRequirements?: string;
        foliarVenation?: string;
        uniqueBehavior?: string;
        leaves?: string;
    };
  }

  const props = defineProps<{
    leafData: LeafData;
  }>();

  const selectedTab = ref('overview');
  </script>
  
  <style scoped>
  ion-segment {
    margin: 2px;
    --background: #f2f3f2;
    border-radius: 20px;
    padding: 3px;
  }

  ion-segment-button {
    --border-radius: 20px;
    --background-checked: white;
    --background-focused: transparent;
    --background-hover: transparent;
    --color: #7a7a7a;
    --color-checked: #333333;
    --indicator-color: transparent;
    min-height: 35px;
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 0;
    text-transform: none;
  }

  .details-card {
    margin: 10px;
    --background: #F8F8FF;
    border-radius: 15px;
  }

  .description-text {
    color: #666;
    line-height: 1.5;
    margin: 0;
  }

  .info-cards-container {
    display: flex;
    gap: 10px;
    margin: 0 10px;
  }

  .info-card {
    flex: 1;
    margin: 0;
    border-radius: 15px;
    --background: #F8F8FF;
  }

  .info-header {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
  }

  .info-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #416d3f;
  }

  .info-icon {
    color: #416d3f;
    margin-right: 8px;
    font-size: 18px;
  }

  .alias-container {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
  }

  .alias-chip {
    --background: #A1EEBD;
    --color: #333;
    font-size: 12px;
    height: 26px;
    --border-radius: 12px;
    margin: 0;
    padding: 0 4px;
    font-weight: 500;
  }

  .feature-card {
    margin: 10px;
    --background: #F8F8FF;
    border-radius: 15px;
  }

  .feature-table {
    width: 100%;
  }

  .feature-row {
    display: flex;
    border-bottom: 1px solid #eee;
    padding: 10px 0;
  }

  .feature-row:last-child {
    border-bottom: none;
  }

  .feature-label {
    flex: 0 0 80px;
    color: #666;
    font-weight: 500;
  }

  .feature-value {
    flex: 1;
    text-align: right;
    color: #333;
  }

  .uses-card {
    margin: 10px;
    --background: #F8F8FF;
    border-radius: 15px;
  }

  .use-section {
    padding: 5px 0;
  }

  .use-header {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
  }

  .use-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #333;
  }

  .use-icon {
    margin-right: 10px;
    font-size: 20px;
    padding: 5px;
    border-radius: 50%;
  }

  .edible-icon {
    color: #4d8b31;
    background-color: #f0f7ea;
  }

  .medicinal-icon {
    color: #3a86ff;
    background-color: #e6f0ff;
  }

  .timber-icon {
    color: #8f5a2c;
    background-color: #f7f0ea;
  }

  .other-icon {
    color: #555;
    background-color: #f0f0f0;
  }

  .use-description {
    margin: 0;
    color: #666;
    line-height: 1.5;
  }

  .ecology-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    padding: 10px;
  }

  .ecology-card {
    margin: 0;
    --background: #ffffff;
    border-radius: 15px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
    border: 1px solid #f0f0f0;
  }

  .ecology-icon-container {
    display: flex;
    justify-content: center;
    margin-bottom: 5px;
  }

  .ecology-icon {
    font-size: 24px;
    color: #416d3f;
  }

  .ecology-title {
    text-align: center;
    margin: 5px 0;
    font-weight: 600;
    font-size: 16px;
    color: #333;
  }

  .ecology-value {
    text-align: center;
    margin: 0;
    color: #666;
    font-size: 14px;
  }

  .soil-card {
    margin: 10px;
    --background: #ffffff;
    border-radius: 15px;
  }

  .soil-description {
    color: #666;
    line-height: 1.5;
  }

  .tab-content {
    margin-bottom: 30px; /* Add space for the fixed button container */
    padding-bottom: 10px;
  }

  .feature-card:last-of-type, 
  .uses-card:last-of-type,
  .soil-card {
    margin-bottom: 30px; /* Ensure last card has extra margin to avoid button overlap */
  }
  </style>
  