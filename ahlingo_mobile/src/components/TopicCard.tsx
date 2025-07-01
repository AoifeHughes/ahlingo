import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Topic } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface TopicCardProps {
  topic: Topic;
  onPress: (topic: Topic) => void;
}

const TopicCard: React.FC<TopicCardProps> = ({ topic, onPress }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(topic)}
      activeOpacity={0.7}
    >
      <Text style={styles.title}>{topic.topic}</Text>
    </TouchableOpacity>
  );
};

const createStyles = (currentTheme: ReturnType<typeof useTheme>['theme']) => StyleSheet.create({
  card: {
    backgroundColor: currentTheme.colors.surface,
    borderRadius: currentTheme.borderRadius.lg,
    padding: currentTheme.spacing.xl,
    marginVertical: currentTheme.spacing.base,
    marginHorizontal: currentTheme.spacing.lg,
    elevation: 3,
    shadowColor: currentTheme.colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderLeftWidth: 4,
    borderLeftColor: currentTheme.colors.primary,
  },
  title: {
    fontSize: currentTheme.typography.fontSizes.xl,
    fontWeight: currentTheme.typography.fontWeights.semibold,
    color: currentTheme.colors.text,
    textAlign: 'center',
  },
});

export default TopicCard;
