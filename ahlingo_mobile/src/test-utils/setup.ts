// Note: Jest matchers are now built into @testing-library/react-native v12.4+

// Mock react-native modules
jest.mock('react-native-sqlite-storage', () => {
  const mockDB = {
    executeSql: jest.fn((query, params) =>
      Promise.resolve([{ rows: { length: 0, item: () => ({}) } }])
    ),
    close: jest.fn(() => Promise.resolve()),
  };

  return {
    __esModule: true,
    default: {
      DEBUG: jest.fn(),
      enablePromise: jest.fn(),
      openDatabase: jest.fn(() => mockDB),
    },
  };
});

jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/mock/path',
  exists: jest.fn(() => Promise.resolve(true)),
  copyFile: jest.fn(() => Promise.resolve()),
  mkdir: jest.fn(() => Promise.resolve()),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

jest.mock('react-native-vector-icons/MaterialIcons', () => 'MaterialIcons');

// Mock navigation-related modules for screen tests
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  let focusEffectHasRun = false;

  const resetFocusEffect = () => {
    focusEffectHasRun = false;
  };

  (globalThis as any).__resetFocusEffectMock = resetFocusEffect;

  return {
    ...actual,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      replace: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
    useFocusEffect: jest.fn((callback) => {
      if (!focusEffectHasRun && typeof callback === 'function') {
        focusEffectHasRun = true;
        const cleanup = callback();
        return cleanup;
      }
      return () => {};
    }),
    usePreventRemove: jest.fn(),
    NavigationContainer: ({ children }: any) => children,
  };
});

// Mock BackHandler
jest.doMock('react-native/Libraries/Utilities/BackHandler', () => ({
  __esModule: true,
  default: {
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    removeEventListener: jest.fn(),
  },
}));

// Mock theme utilities
jest.mock('../utils/theme', () => ({
  setTheme: jest.fn(),
  getCurrentTheme: jest.fn(() => 'light'),
  getTheme: jest.fn(() => ({
    colors: {
      primary: '#007AFF',
      secondary: '#5856D6',
      background: '#FFFFFF',
      text: '#000000',
      success: '#34C759',
      error: '#FF3B30',
      warning: '#FF9500',
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
    borderRadius: { base: 8, large: 12 },
    typography: {
      fontSizes: { sm: 12, md: 16, lg: 20, xl: 24 },
      fontWeights: { normal: '400', medium: '500', bold: '700' },
    },
    shadows: { base: {} },
  })),
}));

// Mock Redux hooks
jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: () => jest.fn(),
  Provider: ({ children }: any) => children,
  connect: () => (Component: any) => Component,
}));

// Global test timeout
jest.setTimeout(10000);

if (typeof window === 'undefined') {
  (global as any).window = global;
}

if (typeof window.dispatchEvent !== 'function') {
  window.dispatchEvent = () => {};
}

beforeEach(() => {
  (globalThis as any).__resetFocusEffectMock?.();
});
