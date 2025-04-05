// filepath: /c:/laragon/www/leafify/leafify/src/stores/inferenceStore.ts
import { defineStore } from 'pinia';

interface InferenceResult {
  inference: {
    predictedClass: string;
    confidence: number;
  };
  leafInfo: {
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
    // Additional properties from data.json
    foliage?: string;
    bark?: string;
    fruit?: string;
    flowers?: string;
    // Shape & structure properties
    crown?: string;
    trunk?: string;
    leaves?: string;
    // Ethnobotanical uses
    edibleUses?: string;
    medicinalUses?: string;
    timberUses?: string;
    otherUses?: string;
    // Additional details
    climate?: string;
    lifespan?: string;
    lightNeeds?: string;
    waterNeeds?: string;
    soilRequirements?: string;
    // Leaf characteristics
    retention?: string;
    texture?: string;
    foliarVenation?: string;
    uniqueBehavior?: string;
    // Common names (aliases)
    aliases?: string[];
  };
}

export const useInferenceStore = defineStore('inference', {
  state: () => ({
    result: null as InferenceResult | null,
  }),
  actions: {
    setInferenceResult(this: { result: InferenceResult | null }, result: InferenceResult) {
      this.result = result;
    },
  },
});