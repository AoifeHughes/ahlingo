import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { Exercise, languageContentService } from '@/services/LanguageContentService';
import { Ionicons } from '@expo/vector-icons';

// Define the navigation levels
type NavigationLevel = 'language' | 'difficulty' | 'exerciseType' | 'topic' | 'exercise';

interface ContentNavigatorProps {
  initialLevel?: NavigationLevel;
}

export const ContentNavigator: React.FC<ContentNavigatorProps> = ({ initialLevel = 'language' }) => {
  // State for the current navigation level
  const [currentLevel, setCurrentLevel] = useState<NavigationLevel>(initialLevel);
  
  // State for the selected items at each level
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [selectedExerciseType, setSelectedExerciseType] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  
  // State for the items to display at the current level
  const [items, setItems] = useState<string[] | Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [exerciseContent, setExerciseContent] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Load items based on the current navigation level
  useEffect(() => {
    const loadItems = async () => {
      setLoading(true);
      setError(null);
      try {
        switch (currentLevel) {
          case 'language':
            const languages = await languageContentService.getLanguages();
            setItems(languages);
            break;
          case 'difficulty':
            if (selectedLanguage) {
              const difficulties = await languageContentService.getDifficulties(selectedLanguage);
              setItems(difficulties);
            }
            break;
          case 'exerciseType':
            if (selectedLanguage && selectedDifficulty) {
              const exerciseTypes = await languageContentService.getExerciseTypes(
                selectedLanguage,
                selectedDifficulty
              );
              setItems(exerciseTypes);
            }
            break;
          case 'topic':
            if (selectedLanguage && selectedDifficulty && selectedExerciseType) {
              const topics = await languageContentService.getTopics(
                selectedLanguage,
                selectedDifficulty,
                selectedExerciseType
              );
              setItems(topics);
            }
            break;
          case 'exercise':
            if (selectedLanguage && selectedDifficulty && selectedExerciseType && selectedTopic) {
              // Get a random exercise
              const randomExercise = await languageContentService.getRandomExercise(
                selectedLanguage,
                selectedDifficulty,
                selectedExerciseType,
                selectedTopic
              );
              
              if (randomExercise) {
                setSelectedExercise(randomExercise);
                const content = await languageContentService.getExerciseContent(randomExercise);
                setExerciseContent(content);
              } else {
                setError('No exercises found for this topic');
              }
            }
            break;
        }
      } catch (error) {
        console.error('Failed to load items:', error);
        setError('Failed to load content. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadItems();
  }, [currentLevel, selectedLanguage, selectedDifficulty, selectedExerciseType, selectedTopic]);

  // Handle item selection
  const handleItemPress = (item: string | Exercise) => {
    if (typeof item === 'string') {
      switch (currentLevel) {
        case 'language':
          setSelectedLanguage(item);
          setCurrentLevel('difficulty');
          break;
        case 'difficulty':
          setSelectedDifficulty(item);
          setCurrentLevel('exerciseType');
          break;
        case 'exerciseType':
          setSelectedExerciseType(item);
          setCurrentLevel('topic');
          break;
        case 'topic':
          setSelectedTopic(item);
          setCurrentLevel('exercise');
          break;
      }
    }
  };

  // Handle back button press
  const handleBackPress = () => {
    switch (currentLevel) {
      case 'difficulty':
        setSelectedLanguage(null);
        setCurrentLevel('language');
        break;
      case 'exerciseType':
        setSelectedDifficulty(null);
        setCurrentLevel('difficulty');
        break;
      case 'topic':
        setSelectedExerciseType(null);
        setCurrentLevel('exerciseType');
        break;
      case 'exercise':
        setSelectedTopic(null);
        setSelectedExercise(null);
        setExerciseContent(null);
        setCurrentLevel('topic');
        break;
    }
  };

  // Get the title for the current level
  const getLevelTitle = (): string => {
    switch (currentLevel) {
      case 'language':
        return 'Select a Language';
      case 'difficulty':
        return `Select a Difficulty for ${selectedLanguage}`;
      case 'exerciseType':
        return `Select an Exercise Type for ${selectedLanguage} - ${selectedDifficulty}`;
      case 'topic':
        return `Select a Topic for ${selectedLanguage} - ${selectedDifficulty} - ${selectedExerciseType}`;
      case 'exercise':
        return `Exercise: ${selectedExercise?.name || ''}`;
      default:
        return '';
    }
  };

  // Generate a unique key for each item
  const keyExtractor = (item: string | Exercise): string => {
    if (typeof item === 'string') {
      // For string items, use the string itself as the key, but ensure it's unique
      // by prefixing with the current level
      return `${currentLevel}-${item}`;
    } else {
      // For Exercise objects, use the ID
      return `exercise-${item.id}`;
    }
  };

  // Render an item in the list
  const renderItem = ({ item }: { item: string | Exercise }) => {
    if (typeof item === 'string') {
      return (
        <TouchableOpacity
          style={styles.item}
          onPress={() => handleItemPress(item)}
        >
          <ThemedView style={styles.itemCard}>
            <ThemedText type="subtitle">{item}</ThemedText>
          </ThemedView>
        </TouchableOpacity>
      );
    } else {
      // This shouldn't be reached since we're showing exercise content directly
      return (
        <TouchableOpacity
          style={styles.item}
          onPress={() => handleItemPress(item)}
        >
          <ThemedView style={styles.itemCard}>
            <ThemedText type="subtitle">{item.name}</ThemedText>
          </ThemedView>
        </TouchableOpacity>
      );
    }
  };

  // Render the back button if not at the top level
  const renderBackButton = () => {
    if (currentLevel !== 'language') {
      return (
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <Ionicons name="arrow-back" size={24} color="#0a7ea4" />
          <ThemedText type="link" style={styles.backButtonText}>Back</ThemedText>
        </TouchableOpacity>
      );
    }
    return null;
  };

  // Render the exercise content
  const renderExerciseContent = () => {
    if (currentLevel === 'exercise' && exerciseContent) {
      return (
        <ThemedView style={styles.exerciseContent}>
          <ThemedText type="defaultSemiBold">Exercise Content:</ThemedText>
          <ThemedText style={styles.jsonContent}>
            {JSON.stringify(exerciseContent, null, 2)}
          </ThemedText>
        </ThemedView>
      );
    }
    return null;
  };

  // Render error message if there is one
  const renderError = () => {
    if (error) {
      return (
        <ThemedView style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </ThemedView>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {renderBackButton()}
      
      <ThemedText type="title" style={styles.title}>
        {getLevelTitle()}
      </ThemedText>
      
      {renderError()}
      
      {currentLevel !== 'exercise' ? (
        <FlatList
          data={items as any[]}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        renderExerciseContent()
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#ffeeee',
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#cc0000',
  },
  title: {
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
  item: {
    marginBottom: 12,
  },
  itemCard: {
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButtonText: {
    marginLeft: 8,
  },
  exerciseContent: {
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  jsonContent: {
    fontFamily: 'monospace',
    marginTop: 8,
  },
});
