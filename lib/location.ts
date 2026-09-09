import * as Location from 'expo-location';

export async function requestLocationPermissions() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Permiso de localización denegado');
  }
  return true;
}

export async function getCurrentLocation() {
  await requestLocationPermissions();
  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
}

import { supabase } from './supabase';

export async function updateHeroLocation(latitude: number, longitude: number) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from('locations').upsert({
    user_id: user.id,
    lat: latitude,
    lng: longitude,
  });

  if (error) {
    console.error('Error al actualizar la ubicación:', error.message);
  }
}