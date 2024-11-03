<template>
    <ion-list>
      <ion-item-sliding>
        <ion-item>
          <ion-label>Sliding Item with End Options</ion-label>
        </ion-item>
  
        <ion-item-options>
          <ion-item-option>Favorite</ion-item-option>
          <ion-item-option color="danger">Delete</ion-item-option>
        </ion-item-options>
      </ion-item-sliding>
    </ion-list>
</template>

<script lang="ts">
  import { IonItem, IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonList } from '@ionic/vue';
  import { defineComponent } from 'vue';

  export default defineComponent({
    components: { IonItem, IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonList },
  });
</script>