import React from 'react';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import ComingSoonScreen from './ComingSoonScreen';

type FillInTheBlankScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'FillInTheBlank'
>;

type FillInTheBlankScreenRouteProp = RouteProp<
  RootStackParamList,
  'FillInTheBlank'
>;

interface Props {
  navigation: FillInTheBlankScreenNavigationProp;
  route: FillInTheBlankScreenRouteProp;
}

const FillInTheBlankScreen: React.FC<Props> = ({ navigation, route }) => {
  return (
    <ComingSoonScreen
      navigation={navigation}
      route={route}
      featureName="Fill in the Blank"
      featureIcon="✏️"
      description="Test your vocabulary and grammar skills with challenging fill-in-the-blank exercises."
    />
  );
};

export default FillInTheBlankScreen;