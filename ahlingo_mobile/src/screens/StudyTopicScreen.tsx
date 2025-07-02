import React from 'react';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import ComingSoonScreen from './ComingSoonScreen';

type StudyTopicScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'StudyTopic'
>;

type StudyTopicScreenRouteProp = RouteProp<
  RootStackParamList,
  'StudyTopic'
>;

interface Props {
  navigation: StudyTopicScreenNavigationProp;
  route: StudyTopicScreenRouteProp;
}

const StudyTopicScreen: React.FC<Props> = ({ navigation, route }) => {
  return (
    <ComingSoonScreen
      navigation={navigation}
      route={route}
      featureName="Study Topic"
      featureIcon="📚"
      description="Dive deep into specific topics with comprehensive study materials and focused practice sessions."
    />
  );
};

export default StudyTopicScreen;