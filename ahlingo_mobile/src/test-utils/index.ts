import React from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider } from '../contexts/ThemeContext';
import settingsSlice from '../store/slices/settingsSlice';

// Mock store factory
export const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      settings: settingsSlice,
    },
    preloadedState: initialState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  });
};

// Default mock state
export const defaultMockState = {
  settings: {
    settings: {
      language: 'French',
      difficulty: 'Beginner',
      userId: 1,
    },
    isLoading: false,
    error: null,
  },
};

// Test wrapper component
interface AllTheProvidersProps {
  children: React.ReactNode;
  initialState?: any;
  store?: any;
}

const AllTheProviders: React.FC<AllTheProvidersProps> = ({ 
  children, 
  initialState = defaultMockState,
  store = createMockStore(initialState)
}) => {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <NavigationContainer>
          {children}
        </NavigationContainer>
      </ThemeProvider>
    </Provider>
  );
};

// Custom render function
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialState?: any;
  store?: any;
}

export const renderWithProviders = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { initialState, store, ...renderOptions } = options;

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <AllTheProviders initialState={initialState} store={store}>
      {children}
    </AllTheProviders>
  );

  return {
    store: store || createMockStore(initialState),
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
};

// Async testing helpers
export const waitForAsync = (ms = 0) => 
  new Promise(resolve => setTimeout(resolve, ms));

export const flushPromises = () => new Promise(setImmediate);

// Mock user context helper
export const mockUserContext = () => ({
  username: 'testuser',
  userId: 1,
  settings: {
    language: 'French',
    difficulty: 'Beginner',
  },
});

// Mock navigation props
export const createMockNavigationProp = () => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  replace: jest.fn(),
  push: jest.fn(),
  pop: jest.fn(),
  setParams: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  canGoBack: jest.fn(() => true),
  isFocused: jest.fn(() => true),
  dispatch: jest.fn(),
  getId: jest.fn(() => 'test-screen'),
  getParent: jest.fn(),
  getState: jest.fn(),
});

export const createMockRouteProp = (params = {}) => ({
  key: 'test-route',
  name: 'TestScreen' as any,
  params,
  path: undefined,
});

// Re-export everything from testing library
export * from '@testing-library/react-native';