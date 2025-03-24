import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { Language, languageService } from '@/services/LanguageService';
import { router } from 'expo-router';

interface LanguageItemProps {
  language: Language;
  onPress: (language: Language) => void;
}

const LanguageItem = ({ language, onPress }: LanguageItemProps) => {
  return (
    <TouchableOpacity
      style={styles.languageItem}
      onPress={() => onPress(language)}
    >
      <ThemedView style={styles.languageCard}>
        <ThemedText type="subtitle">{language.name}</ThemedText>
      </ThemedView>
    </TouchableOpacity>
  );
};

export const LanguageList = () => {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLanguages = async () => {
      try {
        const availableLanguages = await languageService.getLanguages();
        setLanguages(availableLanguages);
      } catch (error) {
        console.error('Failed to load languages:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLanguages();
  }, []);

  const handleLanguagePress = (language: Language) => {
    // This would navigate to a language detail screen in the future
    console.log(`Selected language: ${language.name}`);
    // Example navigation: router.push(`/language/${language.id}`);
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>Loading languages...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.header}>
        Available Languages
      </ThemedText>
      <FlatList
        data={languages}
        renderItem={({ item }) => (
          <LanguageItem language={item} onPress={handleLanguagePress} />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  header: {
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 16,
  },
  languageItem: {
    marginBottom: 12,
  },
  languageCard: {
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});
