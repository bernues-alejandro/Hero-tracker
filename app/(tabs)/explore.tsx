import { Asset } from 'expo-asset';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { requestLocationPermissions, updateHeroLocation } from '../../lib/location';
import { supabase } from '../../lib/supabase';

interface HeroMarker {
  user_id: string;
  lat: number;
  lng: number;
  username: string;
  selected_hero: string;
}

const localHeroAssets: Record<string, any> = {
  'Thor': require('../../assets/images/thor.png'),
};

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [heroes, setHeroes] = useState<HeroMarker[]>([]);
  const [heroLogos, setHeroLogos] = useState<Record<string, string>>({});
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    async function init() {
      try {
        await loadHeroImages();
        await requestLocationPermissions();

        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const initialCoords = {
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        };
        setLocation(initialCoords);
        await updateHeroLocation(initialCoords.latitude, initialCoords.longitude);

        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 10,
            timeInterval: 5000,
          },
          (newLocation) => {
            const updatedCoords = {
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
            };
            setLocation(updatedCoords);
            updateHeroLocation(updatedCoords.latitude, updatedCoords.longitude);
          }
        );

        await fetchOtherHeroes();
        setLoading(false);
      } catch (error: any) {
        Alert.alert('Error de GPS', error.message || 'No se pudo obtener la ubicación.');
        setLoading(false);
      }
    }

    init();

    const channel = supabase
      .channel('public:locations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'locations' },
        () => {
          fetchOtherHeroes();
        }
      )
      .subscribe();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadHeroImages() {
    const urisMap: Record<string, string> = {};

    for (const [heroName, assetModule] of Object.entries(localHeroAssets)) {
      try {
        const asset = Asset.fromModule(assetModule);
        await asset.downloadAsync();
        if (asset.uri) {
          urisMap[heroName] = asset.uri;
        }
      } catch (e) {
        console.warn(`No se pudo cargar la imagen de ${heroName}`, e);
      }
    }

    setHeroLogos(urisMap);
  }

  async function fetchOtherHeroes() {
    const { data, error } = await supabase
      .from('locations')
      .select(`
        user_id,
        lat,
        lng,
        profiles (
          username,
          selected_hero
        )
      `);

    if (error) {
      console.error('Error al obtener héroes:', error.message);
      return;
    }

    if (data) {
      const formatted = data.map((item: any) => ({
        user_id: item.user_id,
        lat: item.lat,
        lng: item.lng,
        username: item.profiles?.username || 'Héroe Anónimo',
        selected_hero: item.profiles?.selected_hero || 'Spider-Man',
      }));
      setHeroes(formatted);
    }
  }

  if (loading || !location) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF3B30" />
        <Text style={styles.loadingText}>Cargando mapa y gráficos Pixel Art...</Text>
      </View>
    );
  }

  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body, html, #map { height: 100%; margin: 0; padding: 0; background-color: #121212; }
        .leaflet-tile { filter: brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3); }
        .hero-popup { font-family: sans-serif; font-weight: bold; text-align: center; color: #121212; }
        
      
        .hero-marker-container {
          position: relative;
          width: 60px;
          height: 60px;
        }

        .hero-marker-container::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 2px dashed rgba(255, 255, 255, 0.95);
          box-shadow: 0 0 12px rgba(255, 255, 255, 0.8);
          animation: wavePulse 2.2s infinite ease-out;
          pointer-events: none;
          box-sizing: border-box;
        }

        @keyframes wavePulse {
          0% {
            transform: scale(0.9);
            opacity: 0.95;
          }
          100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }

        /* Imagen del héroe ampliada y sin líneas/bordes adicionales */
        .custom-hero-icon {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: none;
          background-color: transparent;
          object-fit: cover;
          padding: 0;
          box-sizing: border-box;
          image-rendering: pixelated;
          image-rendering: crisp-edges;
          display: block;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const map = L.map('map').setView([${location.latitude}, ${location.longitude}], 15);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap'
        }).addTo(map);

        const heroLogosMap = ${JSON.stringify(heroLogos)};

        function getHeroIcon(heroName) {
          const logoUrl = heroLogosMap[heroName];
          if (logoUrl) {
            return L.divIcon({
              className: 'hero-marker-container',
              html: '<img src="' + logoUrl + '" class="custom-hero-icon" />',
              iconSize: [60, 60],
              iconAnchor: [30, 30],
              popupAnchor: [0, -30]
            });
          }
          return new L.Icon.Default();
        }

        const heroesData = ${JSON.stringify(heroes)};
        heroesData.forEach(hero => {
          const icon = getHeroIcon(hero.selected_hero);
          L.marker([hero.lat, hero.lng], { icon: icon })
            .addTo(map)
            .bindPopup("<div class='hero-popup'>🦸‍♂️ " + hero.selected_hero + "<br><small>" + hero.username + "</small></div>");
        });
      </script>
    </body>
    </html>
  `;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: mapHtml }}
        style={styles.map}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loadingText: {
    color: '#FFF',
    marginTop: 10,
    fontWeight: 'bold',
  },
  map: {
    flex: 1,
  },
});