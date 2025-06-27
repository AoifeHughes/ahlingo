import React, {useEffect} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Text,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {Card} from 'react-native-elements';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {useDispatch, useSelector} from 'react-redux';
import {NavigationParams, Topic} from '@ahlingo/core';
import {useTheme} from '../components/ThemeProvider';
import {RootState} from '../store';
import {loadTopics, setCurrentTopic} from '../store/slices/exerciseSlice';

type TopicSelectionNavigationProp = StackNavigationProp<NavigationParams, 'TopicSelection'>;

export function TopicSelectionScreen(): JSX.Element {
  const theme = useTheme();
  const navigation = useNavigation<TopicSelectionNavigationProp>();
  const dispatch = useDispatch();
  
  const {topics, isLoading, error} = useSelector((state: RootState) => state.exercise);
  const {settings} = useSelector((state: RootState) => state.userSettings);

  useEffect(() => {
    dispatch(loadTopics());
  }, [dispatch]);

  const handleTopicSelect = (topic: Topic) => {
    dispatch(setCurrentTopic(topic));
    
    // For hello world, just navigate to pairs game
    // In the full implementation, you might show another selection screen
    navigation.navigate('PairsGame', {
      topicId: topic.id,
    });
  };

  const handleRefresh = () => {
    dispatch(loadTopics());
  };

  const renderTopicCard = ({item}: {item: Topic}) => (
    <TouchableOpacity
      onPress={() => handleTopicSelect(item)}
      style={styles.cardTouchable}
    >
      <Card containerStyle={[styles.topicCard, {borderColor: theme.colors.border}]}>
        <View style={styles.cardContent}>
          <Text style={[styles.topicTitle, {color: theme.colors.text}]}>
            {item.topic}
          </Text>
          <Text style={[styles.topicDescription, {color: theme.colors.textSecondary}]}>
            Practice exercises for {item.topic.toLowerCase()}
          </Text>
          {settings && (
            <Text style={[styles.topicMeta, {color: theme.colors.textSecondary}]}>
              {settings.language.language} • {settings.difficulty.difficulty_level}
            </Text>
          )}
        </View>
        <View style={[styles.cardAccent, {backgroundColor: theme.colors.primary}]} />
      </Card>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyTitle, {color: theme.colors.text}]}>
        No Topics Available
      </Text>
      <Text style={[styles.emptyText, {color: theme.colors.textSecondary}]}>
        {error || 'Pull down to refresh and load topics'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]}>
      {/* Header Information */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, {color: theme.colors.text}]}>
          Choose a Topic
        </Text>
        {settings && (
          <Text style={[styles.headerSubtitle, {color: theme.colors.textSecondary}]}>
            Learning {settings.language.language} at {settings.difficulty.difficulty_level} level
          </Text>
        )}
      </View>

      {/* Topics List */}
      <FlatList
        data={topics}
        renderItem={renderTopicCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        numColumns={1}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Loading State */}
      {isLoading && topics.length === 0 && (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, {color: theme.colors.textSecondary}]}>
            Loading topics...
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  listContainer: {
    padding: 8,
    flexGrow: 1,
  },
  cardTouchable: {
    marginVertical: 6,
    marginHorizontal: 8,
  },
  topicCard: {
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 0,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 16,
  },
  topicTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  topicDescription: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  topicMeta: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
});