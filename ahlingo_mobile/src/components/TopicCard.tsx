import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Dimensions } from 'react-native';
import { TopicWithProgress } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import ProgressRing from './ProgressRing';
// import ProgressRingSimple from './ProgressRingSimple';

interface TopicCardProps {
  topic: TopicWithProgress;
  onPress: (topic: TopicWithProgress) => void;
}

const TopicCard: React.FC<TopicCardProps> = ({ topic, onPress }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { width } = Dimensions.get('window');
  const cardSize = (width - 48) / 2; // 48 = padding (16 * 3)

  return (
    <TouchableOpacity
      style={[styles.card, { width: cardSize, height: cardSize }]}
      onPress={() => onPress(topic)}
      activeOpacity={0.7}
      testID={`topic-card-${topic.id}`}
      accessibilityRole="button"
      accessibilityLabel={`${topic.topic} topic`}
      accessibilityHint="Tap to practice exercises for this topic"
    >
      <View style={styles.progressContainer}>
        <ProgressRing percentage={topic.progress.percentage} testID="progress-ring" />
        <Text style={styles.percentage}>{topic.progress.percentage}%</Text>
      </View>
      <Text style={styles.title} numberOfLines={2}>{topic.topic}</Text>
      <Text style={styles.subtitle}>
        {topic.progress.completedExercises}/{topic.progress.totalExercises} exercises
      </Text>
    </TouchableOpacity>
  );
};

const createStyles = (currentTheme: ReturnType<typeof useTheme>['theme']) => StyleSheet.create({
  card: {
    backgroundColor: currentTheme.colors.surface,
    borderRadius: currentTheme.borderRadius.lg,
    padding: currentTheme.spacing.lg,
    margin: currentTheme.spacing.base,
    elevation: 3,
    shadowColor: currentTheme.colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: currentTheme.spacing.base,
  },
  percentage: {
    position: 'absolute',
    fontSize: currentTheme.typography.fontSizes.lg,
    fontWeight: currentTheme.typography.fontWeights.bold,
    color: currentTheme.colors.text,
  },
  title: {
    fontSize: currentTheme.typography.fontSizes.lg,
    fontWeight: currentTheme.typography.fontWeights.semibold,
    color: currentTheme.colors.text,
    textAlign: 'center',
    marginBottom: currentTheme.spacing.xs,
  },
  subtitle: {
    fontSize: currentTheme.typography.fontSizes.sm,
    color: currentTheme.colors.textSecondary,
    textAlign: 'center',
  },
});

export default TopicCard;
