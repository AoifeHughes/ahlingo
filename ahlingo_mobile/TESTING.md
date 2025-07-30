# Testing Strategy - AHLingo Mobile App

This document outlines the comprehensive testing strategy for the AHLingo React Native mobile application.

## Testing Philosophy

Our testing approach follows the **Testing Pyramid** principle:
- **Many unit tests** - Fast, isolated, reliable
- **Some integration tests** - Test component interactions
- **Few E2E tests** - Test complete user journeys

## Test Types & Coverage

### 1. Unit Tests (`src/**/__tests__/**`)
**Coverage Target: 80% lines, 70% branches**

- **Component Tests**: Individual React components in isolation
  - `PairButton.test.tsx` - Button states and interactions
  - `WordButton.test.tsx` - Selection states and styling
  - `TopicCard.test.tsx` - Progress display and navigation

- **Service Tests**: Business logic and data layer
  - `SimpleDatabaseService.test.ts` - Database operations and optimization
  - API interactions and error handling

- **Utility Tests**: Helper functions and pure logic
  - `basic.test.ts` - Fundamental utility functions

**Tools**: Jest, @testing-library/react-native, custom test utilities

### 2. Integration Tests (Screen Tests)
**Purpose**: Test screen-level interactions and state management

- **Screen Tests**: Complete screen functionality
  - `ComingSoonScreen.test.tsx` - Static content and navigation
  - `ExerciseShuffleSummaryScreen.test.tsx` - Results display and calculations

**Tools**: Jest, React Native Testing Library, mock providers

### 3. End-to-End Tests (`e2e/`)
**Purpose**: Test complete user workflows on real devices/simulators

- **User Journey Tests**: Critical user paths
  - `userJourney.test.js` - Complete app navigation flows
  - `completeExerciseFlow.test.js` - Exercise selection to completion
  - `mainMenu.test.js` - Main menu functionality
  - `exerciseShuffle.test.js` - Multi-exercise session flows
  - `topicSelection.test.js` - Topic browsing and selection

**Tools**: Detox, Jest, iOS Simulator, Android Emulator

## Testing Infrastructure

### Test Utilities (`src/test-utils/`)
- **`setup.ts`**: Global mocks and configuration
- **`simple-render.tsx`**: Simplified component rendering
- **`factories.ts`**: Test data generation
- **`helpers.ts`**: Common test functions and assertions

### Mock Strategy
- **Theme Context**: Consistent styling values
- **Navigation**: Mock navigation functions and route props
- **Database**: SQLite operations without real database
- **React Native**: Platform-specific modules and APIs

### Test IDs
Components include `testID` attributes for reliable E2E testing:
```typescript
<TouchableOpacity testID="exercise-match-words">
<View testID="topic-selection-screen">
<Text testID="app-title">
```

## Running Tests

### Unit & Integration Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test file
npm test -- PairButton.test.tsx

# Update snapshots
npm run test:update-snapshots
```

### E2E Tests
```bash
# iOS
npm run test:e2e:build:ios
npm run test:e2e:test:ios

# Android
npm run test:e2e:build:android
npm run test:e2e:test:android
```

### Quality Checks
```bash
# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Code formatting
npm run format
npm run format:check
```

## CI/CD Pipeline

### Pull Request Checks (`.github/workflows/pr-checks.yml`)
**Triggers**: Every PR to main/develop
**Duration**: ~5 minutes

- ✅ TypeScript type checking
- ✅ ESLint code quality
- ✅ Prettier formatting
- ✅ Unit test suite with coverage
- ✅ Security scanning (npm audit)
- ✅ Coverage reporting

### Full Test Suite (`.github/workflows/test.yml`)
**Triggers**: Push to main/develop branches
**Duration**: ~20-30 minutes

- ✅ All unit and integration tests
- ✅ iOS E2E tests on iPhone 15 simulator
- ✅ Android E2E tests on API 30 emulator
- ✅ Code quality checks
- ✅ Test artifact collection

### Nightly Comprehensive Tests (`.github/workflows/nightly-e2e.yml`)
**Triggers**: Daily at 2 AM UTC, manual dispatch
**Duration**: ~60-90 minutes

- ✅ Multi-device iOS testing (iPhone 15, Pro, iPad)
- ✅ Multi-API Android testing (28, 30, 33)
- ✅ Performance profiling
- ✅ Memory leak detection
- ✅ Failure notifications

## Test Data Management

### Database Tests
- Mock SQLite operations for unit tests
- Test data factories for consistent test objects
- Database state isolation between tests

### User Settings
- Mock Redux store with realistic state
- Test different language/difficulty combinations
- User context simulation

## Best Practices

### Writing Tests
1. **Arrange, Act, Assert** pattern
2. **Descriptive test names** that explain behavior
3. **Test one thing per test** - single responsibility
4. **Use data-testid** for E2E element selection
5. **Mock external dependencies** consistently

### Component Testing
```typescript
it('calls onPress when button is pressed', () => {
  const mockOnPress = jest.fn();
  const { getByText } = renderWithProviders(
    <PairButton text="Hello" onPress={mockOnPress} />
  );
  
  fireEvent.press(getByText('Hello'));
  expect(mockOnPress).toHaveBeenCalledTimes(1);
});
```

### E2E Testing
```javascript
it('should complete exercise selection flow', async () => {
  await expect(element(by.id('app-title'))).toBeVisible();
  await element(by.id('exercise-match-words')).tap();
  await waitFor(element(by.id('topic-selection-screen')))
    .toBeVisible()
    .withTimeout(5000);
});
```

### Test Maintenance
- **Regular test review** - Remove obsolete tests
- **Update mocks** when APIs change
- **Refactor test utilities** for reusability
- **Monitor test performance** and optimize slow tests

## Coverage Goals

| Test Type | Coverage Target | Current Status |
|-----------|----------------|----------------|
| Unit Tests | 80% lines, 70% branches | ✅ Configured |
| Integration | 70% screen coverage | ✅ In Progress |
| E2E Tests | Critical user journeys | ✅ Implemented |

## Debugging Tests

### Jest Debugging
```bash
# Run tests in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand

# Run specific test with full output
npm test -- --verbose PairButton.test.tsx
```

### Detox Debugging
```bash
# Run with artifacts collection
detox test --configuration ios.sim.debug --artifacts-location artifacts

# Take screenshots on failure
await device.takeScreenshot('test-failure');
```

### Common Issues
- **Async timing**: Use `waitFor()` for elements that load asynchronously
- **Mock conflicts**: Ensure mocks are properly scoped and cleaned up
- **Device state**: Reset app state between E2E tests with `device.reloadReactNative()`

## Future Enhancements

- [ ] Visual regression testing with screenshot comparison
- [ ] Performance benchmarking automation
- [ ] Accessibility testing integration
- [ ] Cross-platform test result comparison
- [ ] Test result dashboard and analytics
- [ ] Automated test generation for new components

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Detox E2E Testing](https://github.com/wix/Detox)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)