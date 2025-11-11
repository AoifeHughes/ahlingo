import React from 'react';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import StudyTopicSelectionScreen from './StudyTopicSelectionScreen';

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
    <StudyTopicSelectionScreen
      navigation={navigation}
      route={route}
    />
  );
};

export default StudyTopicScreen;
