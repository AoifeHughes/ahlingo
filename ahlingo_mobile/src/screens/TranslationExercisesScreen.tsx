import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { RootStackParamList, ExerciseInfo } from '../types';
import { RootState } from '../store';
import {
  getRandomTranslationExerciseForTopic,
  getTranslationExerciseData,
  getUserSettings,
  getMostRecentUser,
} from '../services/SimpleDatabaseService';

type TranslationExercisesScreenRouteProp = RouteProp<RootStackParamList, 'TranslationExercises'>;
type TranslationExercisesScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'TranslationExercises'
>;

interface Props {
  route: TranslationExercisesScreenRouteProp;
  navigation: TranslationExercisesScreenNavigationProp;
}

const TranslationExercisesScreen: React.FC<Props> = ({ route, navigation }) => {
  const { topicId } = route.params || {};
  const { settings } = useSelector((state: RootState) => state.settings);

  // Safety check: if no topicId is provided, go back
  useEffect(() => {
    if (!topicId) {
      Alert.alert('Error', 'No topic selected. Please select a topic first.');
      navigation.goBack();
      return;
    }
  }, [topicId, navigation]);
  
  const [loading, setLoading] = useState(true);
  const [currentExercise, setCurrentExercise] = useState<ExerciseInfo | null>(null);
  const [translationData, setTranslationData] = useState<any[]>([]);
  const [userLanguage, setUserLanguage] = useState<string>('French');
  const [userDifficulty, setUserDifficulty] = useState<string>('Beginner');

  useEffect(() => {
    if (topicId) {
      loadTranslationData();
    }
  }, [topicId]);

  const loadTranslationData = async () => {
    try {
      setLoading(true);
      
      // Get user settings
      const username = await getMostRecentUser();
      const userSettings = await getUserSettings(username);
      const language = userSettings.language || settings.language || 'French';
      const difficulty = userSettings.difficulty || settings.difficulty || 'Beginner';
      
      setUserLanguage(language);
      setUserDifficulty(difficulty);
      
      // Get random translation exercise for this topic
      const exercise = await getRandomTranslationExerciseForTopic(topicId, language, difficulty);
      
      if (!exercise) {
        Alert.alert('Error', 'No translation exercises found for this topic.');
        navigation.goBack();
        return;
      }
      
      setCurrentExercise(exercise);
      
      // Get translation data for this exercise
      const exerciseData = await getTranslationExerciseData(exercise.id);
      setTranslationData(exerciseData);
      
    } catch (error) {
      console.error('Failed to load translation data:', error);
      Alert.alert('Error', 'Failed to load translation exercise. Please try again.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadTranslationData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Loading translation exercise...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with refresh button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Text style={styles.refreshButtonText}>🔄 New Exercise</Text>
        </TouchableOpacity>
      </View>
      
      {/* Exercise info */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>
          {currentExercise?.exercise_name || 'Translation Exercise'}
        </Text>
        <Text style={styles.infoSubtitle}>
          {userLanguage} • {userDifficulty}
        </Text>
      </View>
      
      {/* Raw data display for testing */}
      <ScrollView style={styles.dataContainer} contentContainerStyle={styles.dataContent}>
        <Text style={styles.dataTitle}>Raw Exercise Data (for testing):</Text>
        
        <View style={styles.exerciseInfoSection}>
          <Text style={styles.sectionTitle}>Exercise Info:</Text>
          <Text style={styles.dataText}>
            {JSON.stringify(currentExercise, null, 2)}
          </Text>
        </View>
        
        <View style={styles.translationDataSection}>
          <Text style={styles.sectionTitle}>Translation Data:</Text>
          {translationData.length > 0 ? (
            <Text style={styles.dataText}>
              {JSON.stringify(translationData, null, 2)}
            </Text>
          ) : (
            <Text style={styles.noDataText}>
              No translation data found. This might mean:
              {'\n'}• No translation_exercises table exists
              {'\n'}• No data for this exercise ID
              {'\n'}• Using pair_exercises as fallback data
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  refreshButton: {
    backgroundColor: '#1976D2',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  infoSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  dataContainer: {
    flex: 1,
  },
  dataContent: {
    padding: 16,
  },
  dataTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  exerciseInfoSection: {
    marginBottom: 24,
  },
  translationDataSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 8,
  },
  dataText: {
    fontSize: 12,
    fontFamily: 'monospace',
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    color: '#333',
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
});

export default TranslationExercisesScreen;