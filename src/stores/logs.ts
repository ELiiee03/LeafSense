// stores/logs.ts
import { defineStore } from 'pinia';

export const useLogsStore = defineStore('logs', {
  state: () => ({
    logs: [] as Array<{ id: number; imageSrc: string; leaf: any }>,
  }),
  actions: {
    addLog(log: { id: number; imageSrc: string; leaf: any }) {
      this.logs.push(log);
    },
  },
});