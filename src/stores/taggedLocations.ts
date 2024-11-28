// stores/taggedLocations.ts
import { defineStore } from 'pinia';

interface TaggedLocation {
  longitude: number;
  latitude: number;
  placeName: string;
  // leafCounter: Record<string, number>;
  leafCounter: number;
  leafName: string;
}

export const useTaggedLocationsStore = defineStore('taggedLocations', {
  state: () => ({
    taggedLocations: [] as TaggedLocation[]
  }),
  actions: {
    addTaggedLocation(location: TaggedLocation) {
      this.taggedLocations.push(location);
    }
  }
});