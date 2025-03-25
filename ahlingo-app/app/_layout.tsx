import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';

import { useColorScheme } from '@/hooks/useColorScheme';
import { languageContentService } from '@/services/LanguageContentService';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Function to preload language content assets
async function preloadLanguageContentAssets() {
  try {
    console.log('Preloading language content assets...');
    
    // Create necessary directories
    const assetDir = FileSystem.documentDirectory + 'assets/language_learning_content/';
    await FileSystem.makeDirectoryAsync(assetDir, { intermediates: true }).catch(() => {});
    
    // Instead of trying to load the index.json file directly, let's create a simple
    // index.json file in the document directory that we can use to bootstrap the process
    const indexPath = assetDir + 'index.json';
    const indexExists = await FileSystem.getInfoAsync(indexPath);
    
    if (!indexExists.exists) {
      // Create a simple index.json file with minimal content
      // This will be used to bootstrap the process
      const simpleIndex = {
        languages: {
          Spanish: { name: "Spanish" },
          French: { name: "French" },
          German: { name: "German" },
          Ukrainian: { name: "Ukrainian" }
        }
      };
      
      await FileSystem.writeAsStringAsync(indexPath, JSON.stringify(simpleIndex));
      console.log('Created simple index.json file at:', indexPath);
    }
    
    // Create language directories
    const languages = ["Spanish", "French", "German", "Ukrainian"];
    for (const language of languages) {
      const langDir = assetDir + language;
      await FileSystem.makeDirectoryAsync(langDir, { intermediates: true }).catch(() => {});
      console.log(`Created directory for ${language} at: ${langDir}`);
    }
    
    console.log('Language content assets preloaded successfully');
    return true;
  } catch (error) {
    console.error('Failed to preload language content assets:', error);
    return false;
  }
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [assetsPreloaded, setAssetsPreloaded] = useState(false);
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    async function loadAssets() {
      try {
        // Preload language content assets
        await preloadLanguageContentAssets();
        setAssetsPreloaded(true);
        
        // Start the background asset copy process
        languageContentService.startAssetCopyProcess().catch(err => {
          console.warn('Failed to start asset copy process:', err);
        });
        
        // Hide splash screen when everything is loaded
        if (loaded) {
          await SplashScreen.hideAsync();
        }
      } catch (error) {
        console.error('Error loading assets:', error);
        // Still hide splash screen even if there's an error
        if (loaded) {
          await SplashScreen.hideAsync();
        }
      }
    }
    
    loadAssets();
  }, [loaded]);

  if (!loaded || !assetsPreloaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
