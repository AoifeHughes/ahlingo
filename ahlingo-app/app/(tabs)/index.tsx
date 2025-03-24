import { Image, StyleSheet } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import { LanguageList } from '@/components/LanguageList';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">AHLingo</ThemedText>
        <HelloWave />
      </ThemedView>
      
      <ThemedView style={styles.descriptionContainer}>
        <ThemedText>
          Choose a language below to start learning!
        </ThemedText>
      </ThemedView>
      
      <ThemedView style={styles.languageListContainer}>
        <LanguageList />
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  descriptionContainer: {
    marginBottom: 24,
  },
  languageListContainer: {
    flex: 1,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
