import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Topic } from '../types';

interface TopicCardProps {
  topic: Topic;
  onPress: (topic: Topic) => void;
}

const TopicCard: React.FC<TopicCardProps> = ({ topic, onPress }) => {
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
});

export default TopicCard;