// stores/taggedLocations.ts
import { defineStore } from 'pinia';

interface TaggedLocation {
  longitude: number;
  latitude: number;
  placeName: string;
  leafCounts: Record<string, number>;
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