import { Geolocation } from '@capacitor/geolocation';

export const requestPermissions = async () => {
  const permission = await Geolocation.requestPermissions();
  if (permission.location !== 'granted') {
    throw new Error('Location permission denied');
  }
};

export const getCurrentPosition = async () => {
  await requestPermissions(); // Ensure permissions before getting location

  const coordinates = await Geolocation.getCurrentPosition();
  return {
    lat: coordinates.coords.latitude,
    lng: coordinates.coords.longitude 
  };
};

export const geocodeLocation = async (lat: number, lng: number) => {
  const geocoder = new google.maps.Geocoder();
  const response = await geocoder.geocode({ location: { lat, lng } });
  if (response.results[0]) {
    return response.results[0].formatted_address;
  } else {
    throw new Error('No results found');
  }
};
// import { Geolocation } from '@capacitor/geolocation';

// export const requestPermissions = async () => {
//   await Geolocation.requestPermissions();
// };

// export const getCurrentPosition = async () => {
//   const coordinates = await Geolocation.getCurrentPosition();
//   return {
//     lat: coordinates.coords.latitude,
//     lng: coordinates.coords.longitude
//   };
// };

// export const geocodeLocation = async (lat: number, lng: number) => {
//   const geocoder = new google.maps.Geocoder();
//   const response = await geocoder.geocode({ location: { lat, lng } });
//   if (response.results[0]) {
//     return response.results[0].formatted_address;
//   } else {
//     throw new Error('No results found');
//   }
// };