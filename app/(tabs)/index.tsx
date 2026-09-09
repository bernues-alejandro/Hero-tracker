import { Session } from '@supabase/supabase-js';
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function HomeScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string>('');
  const [hero, setHero] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('username, selected_hero')
      .eq('id', userId)
      .single();

    if (data) {
      if (data.username) setUsername(data.username);
      if (data.selected_hero) setHero(data.selected_hero);
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FF3B30" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SPIDEY TRACKER</Text>

      <View style={styles.card}>
        <Text style={styles.label}>USUARIO:</Text>
        <Text style={styles.value}>{username || session.user.email}</Text>

        <Text style={styles.label}>HÉROE ELEGIDO:</Text>
        <Text style={styles.heroValue}>{hero || 'Sin seleccionar'}</Text>
      </View>

      <TouchableOpacity 
        style={styles.heroButton}
        onPress={() => router.push('/select-hero')}
      >
        <Text style={styles.buttonText}>CAMBIAR DE HÉROE</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.profileButton}
        onPress={() => router.push('/profile')}
      >
        <Text style={styles.buttonText}>EDITAR NOMBRE DE USUARIO</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={() => supabase.auth.signOut()}
      >
        <Text style={styles.buttonText}>CERRAR SESIÓN</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
    padding: 20,
  },
  title: {
    color: '#FF3B30',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 20,
    letterSpacing: 2,
  },
  card: {
    backgroundColor: '#1E1E1E',
    padding: 20,
    borderRadius: 12,
    width: '100%',
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#333',
  },
  label: {
    color: '#888',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 8,
  },
  value: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  heroValue: {
    color: '#FF3B30',
    fontSize: 18,
    fontWeight: '900',
  },
  heroButton: {
    backgroundColor: '#FF3B30',
    padding: 14,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileButton: {
    backgroundColor: '#0A84FF',
    padding: 14,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoutButton: {
    backgroundColor: '#333',
    padding: 14,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '900',
    letterSpacing: 1,
  },
});