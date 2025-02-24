import { Geolocation } from '@capacitor/geolocation';

export const requestPermissions = async () => {
  await Geolocation.requestPermissions();
};