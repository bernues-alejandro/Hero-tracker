import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

// Lista de los 10 héroes de Marvel disponibles

export const MARVEL_HEROES = [
  { id: 'spidey', name: 'Spider-Man', color: '#E62429' },
  { id: 'ironman', name: 'Iron Man', color: '#FFD700' },
  { id: 'cap', name: 'Capitán América', color: '#002B7F' },
  { id: 'thor', name: 'Thor', color: '#4A90E2' },
  { id: 'hulk', name: 'Hulk', color: '#2E7D32' },
  { id: 'natasha', name: 'Viuda Negra', color: '#000000' },
  { id: 'wolverine', name: 'Wolverine (Lobezno)', color: '#FFB800' },
  { id: 'deadpool', name: 'Deadpool', color: '#D32F2F' },
  { id: 'doctorstrange', name: 'Doctor Strange', color: '#7B1FA2' },
  { id: 'blackpanther', name: 'Black Panther', color: '#424242' },
];

export default function SelectHeroScreen() {
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleSelectHero(heroName: string) {
    try {
      setSaving(true);
      setSelected(heroName);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ selected_hero: heroName })
        .eq('id', user.id);

      if (error) throw error;

      // Volver a la pantalla principal
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>ELIGE TU HÉROE</Text>
      <Text style={styles.subtitle}>Selecciona quién serás en el mapa en vivo</Text>

      <FlatList
        data={MARVEL_HEROES}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const isSelected = selected === item.name;
          return (
            <TouchableOpacity
              style={[
                styles.card,
                { borderColor: item.color },
                isSelected && styles.selectedCard
              ]}
              onPress={() => handleSelectHero(item.name)}
              disabled={saving}
            >
              <View style={[styles.badge, { backgroundColor: item.color }]} />
              <Text style={styles.heroName}>{item.name}</Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FF3B30',
    textAlign: 'center',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 5,
  },
  list: {
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#1E1E1E',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
  },
  selectedCard: {
    backgroundColor: '#2A2A2A',
  },
  badge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 15,
  },
  heroName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});