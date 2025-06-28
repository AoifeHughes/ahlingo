import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  ActivityIndicator 
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { usePairsGame } from '@ahlingo/core';
import { NavigationParams } from '@ahlingo/core';

type PairsGameRouteProp = RouteProp<NavigationParams, 'PairsGame'>;

export const PairsGameScreen: React.FC = () => {
  const route = useRoute<PairsGameRouteProp>();
  const { topicId } = route.params;
  
  const {
    leftPairs,
    rightPairs,
    score,
    isLoading,
    error,
    isGameComplete,
    selectLeftPair,
    selectRightPair,
    startNewGame,
    resetCurrentGame,
  } = usePairsGame();

  useEffect(() => {
    if (topicId) {
      startNewGame(topicId);
    }
  }, [topicId, startNewGame]);

  useEffect(() => {
    if (isGameComplete) {
      Alert.alert(
        'Congratulations!',
        `You completed the game!\nScore: ${score.correct} correct, ${score.incorrect} incorrect`,
        [
          { text: 'Play Again', onPress: resetCurrentGame },
          { text: 'OK', style: 'default' }
        ]
      );
    }
  }, [isGameComplete, score, resetCurrentGame]);

  const renderPairButton = (pair: any, isLeft: boolean) => (
    <TouchableOpacity
      key={`${isLeft ? 'left' : 'right'}-${pair.id}`}
      style={[
        styles.pairButton,
        pair.matched && styles.matchedButton,
        (isLeft ? pair.leftSelected : pair.rightSelected) && styles.selectedButton,
      ]}
      onPress={() => isLeft ? selectLeftPair(pair.id) : selectRightPair(pair.id)}
      disabled={pair.matched}
    >
      <Text style={[
        styles.pairText,
        pair.matched && styles.matchedText,
        (isLeft ? pair.leftSelected : pair.rightSelected) && styles.selectedText,
      ]}>
        {isLeft ? pair.leftText : pair.rightText}
      </Text>
    </TouchableOpacity>
  );

  if (isLoading && leftPairs.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading pairs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => startNewGame(topicId)}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pairs Game</Text>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>Correct: {score.correct}</Text>
          <Text style={styles.scoreText}>Wrong: {score.incorrect}</Text>
        </View>
      </View>

      <ScrollView style={styles.gameArea}>
        <View style={styles.pairsContainer}>
          <View style={styles.column}>
            <Text style={styles.columnTitle}>English</Text>
            {leftPairs.map(pair => renderPairButton(pair, true))}
          </View>
          
          <View style={styles.column}>
            <Text style={styles.columnTitle}>Translation</Text>
            {rightPairs.map(pair => renderPairButton(pair, false))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.resetButton} onPress={resetCurrentGame}>
          <Text style={styles.resetButtonText}>Reset Game</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  scoreText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  gameArea: {
    flex: 1,
    padding: 20,
  },
  pairsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    flex: 1,
    marginHorizontal: 8,
  },
  columnTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
  },
  pairButton: {
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  selectedButton: {
    borderColor: '#2196F3',
    backgroundColor: '#e3f2fd',
  },
  matchedButton: {
    borderColor: '#4CAF50',
    backgroundColor: '#e8f5e8',
  },
  pairText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
  selectedText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  matchedText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  resetButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});