import { Image, StyleSheet, View } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import { ContentNavigator } from '@/components/ContentNavigator';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      {/* Header section with parallax effect */}
      <View style={styles.headerSection}>
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
              Navigate through language content below:
            </ThemedText>
          </ThemedView>
        </ParallaxScrollView>
      </View>
      
      {/* Content navigator section - separate from ScrollView */}
      <ThemedView style={styles.contentNavigatorContainer}>
        <ContentNavigator />
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSection: {
    height: 350, // Adjust this height as needed
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  descriptionContainer: {
    marginBottom: 24,
  },
  contentNavigatorContainer: {
    flex: 1,
    padding: 16,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
