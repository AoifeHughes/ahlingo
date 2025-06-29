import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type PairsGameScreenRouteProp = RouteProp<RootStackParamList, 'PairsGame'>;
type PairsGameScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'PairsGame'
>;

interface Props {
  route: PairsGameScreenRouteProp;
  navigation: PairsGameScreenNavigationProp;
}

const PairsGameScreen: React.FC<Props> = ({ route, navigation }) => {
  const { topicId } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>Pairs Game Screen</Text>
      <Text style={styles.subtext}>Topic ID: {topicId}</Text>
      <Text style={styles.subtext}>To be implemented</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  placeholder: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  subtext: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
});

export default PairsGameScreen;