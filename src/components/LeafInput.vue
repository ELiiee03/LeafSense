<template>
    <ion-list>
      <ion-item>
        <ion-select  class="left-align-label" label="Plant Type" :interface-options="customModalOptions" interface="modal" placeholder="Select One">
          <ion-select-option value="reese's">Herb</ion-select-option>
          <ion-select-option value="snickers">Tree</ion-select-option>
          <ion-select-option value="twix">Shrub</ion-select-option>
        </ion-select>
      </ion-item>
      <ion-item>
        <ion-select  class="left-align-label" label="Edge Type" :interface-options="customModalOptions" interface="modal" placeholder="Select One">
          <ion-select-option value="reese's">smooth</ion-select-option>
          <ion-select-option value="snickers">serrated</ion-select-option>
          <ion-select-option value="twix">crenate</ion-select-option>
          <ion-select-option value="twix">Spiny</ion-select-option>
        </ion-select>
      </ion-item>
      <ion-item>
        <ion-select  class="left-align-label" label="Texture" :interface-options="customModalOptions" interface="modal" placeholder="Select One">
          <ion-select-option value="reese's">smooth</ion-select-option>
          <ion-select-option value="snickers">rough</ion-select-option>
          <ion-select-option value="twix">waxy</ion-select-option>
          <ion-select-option value="twix">hairy</ion-select-option>
          <ion-select-option value="twix">sticky</ion-select-option>
        </ion-select>
      </ion-item>
    </ion-list>
  </template>
  
  <script>
    import { IonItem, IonLabel, IonList, IonSelect, IonSelectOption } from '@ionic/vue';
    import { defineComponent } from 'vue';
  
    export default defineComponent({
      components: { IonItem, IonLabel, IonList, IonSelect, IonSelectOption },
      setup() {
        const customAlertOptions = {
          header: 'Pizza Toppings',
          subHeader: 'Select your favorite topping',
          message: 'Choose only one',
          translucent: true,
        };
  
        const customPopoverOptions = {
          header: 'Hair Color',
          subHeader: 'Select your hair color',
          message: 'Only select your dominant hair color',
        };
  
        const customActionSheetOptions = {
          header: 'Colors',
          subHeader: 'Select your favorite color',
        };
  
        const customModalOptions = {
        //   header: 'Plant type',
          breakpoints: [0, 0.5],
          initialBreakpoint: 0.5,
        };
  
        return {
          customAlertOptions,
          customPopoverOptions,
          customActionSheetOptions,
          customModalOptions,
        };
      },
    });
  </script>
  <style scoped>
  .left-align-label {
    text-align: left;
  }
  </style>