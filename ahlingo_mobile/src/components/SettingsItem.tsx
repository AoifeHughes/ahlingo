import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SettingsItemProps {
  title: string;
  children: React.ReactNode;
}

const SettingsItem: React.FC<SettingsItemProps> = ({ title, children }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  content: {
    marginTop: 4,
  },
});

export default SettingsItem;
