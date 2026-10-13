
import { Platform, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function HomeScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{
        light: '#A1CEDC',
        dark: '#1D3D47',
      }}
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">
          Welcome!
        </ThemedText>

        <HelloWave />
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">
          Step 1: Try it
        </ThemedText>

        <ThemedText>
          Edit{' '}
          <ThemedText type="defaultSemiBold">
            app/(tabs)/index.tsx
          </ThemedText>{' '}
          to see changes.
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <Link href="/modal">
          <ThemedText type="subtitle">
            Step 2: Explore
          </ThemedText>
        </Link>

        <ThemedText>
          Tap the Explore tab to learn more about what's included
          in this starter app.
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">
          Step 3: Get a fresh start
        </ThemedText>

        <ThemedText>
          Run{' '}
          <ThemedText type="defaultSemiBold">
            npm run reset-project
          </ThemedText>{' '}
          when you're ready to start with a fresh app.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
});

