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