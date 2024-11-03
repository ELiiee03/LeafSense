<template>
    <ion-list>
      <ion-item-sliding>
        <ion-item button @click="setOpen(true)">
          <ion-label>Pine Needles</ion-label>
        </ion-item>
  
        <ion-item-options>
          <ion-item-option>Favorite</ion-item-option>
          <ion-item-option color="danger">Delete</ion-item-option>
        </ion-item-options>
      </ion-item-sliding>
      
      <!-- Use LeafInfoModal as a reusable component -->
      <LeafInfoModal :isOpen="isOpen" :onClose="() => setOpen(false)" />
    </ion-list>
  </template>
  
  <script lang="ts">
  import { defineComponent, ref } from 'vue';
  import { IonItem, IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonList } from '@ionic/vue';
  import LeafInfoModal from './LeafInfoModal.vue';
  
  export default defineComponent({
    components: {
      IonItem,
      IonItemOption,
      IonItemOptions,
      IonItemSliding,
      IonLabel,
      IonList,
      LeafInfoModal,
    },
    setup() {
      // Declare isOpen reactive state and setOpen function inside setup
      const isOpen = ref(false);
      const setOpen = (open: boolean) => {
        isOpen.value = open;
      };
  
      return {
        isOpen,
        setOpen,
      };
    },
  });
  </script>
  