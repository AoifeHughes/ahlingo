import React from 'react';
import { render } from '@testing-library/react-native';

// Simple render function without complex providers for now
export const renderSimple = (component: React.ReactElement) => {
  return render(component);
};

// Mock helpers
export const createMockFunction = () => jest.fn();

export const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  replace: jest.fn(),
};

export const mockRoute = {
  params: {},
  name: 'TestScreen',
  key: 'test-key',
};
