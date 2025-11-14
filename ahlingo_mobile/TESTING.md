# Testing Guide

This document describes the testing setup and best practices for the Ahlingo Mobile application.

## Table of Contents

- [Overview](#overview)
- [Testing Framework](#testing-framework)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Test Structure](#test-structure)
- [Mocking](#mocking)
- [Coverage](#coverage)
- [CI/CD Integration](#cicd-integration)
- [Best Practices](#best-practices)

## Overview

We use a comprehensive testing strategy that includes:
- **Unit Tests**: Testing individual functions and components in isolation
- **Integration Tests**: Testing how different parts of the application work together
- **E2E Tests**: End-to-end testing of complete user flows using Detox

## Testing Framework

### Core Dependencies

- **Jest 29.7.0**: JavaScript testing framework
- **React Native Testing Library 13.3.3**: React Native component testing utilities
- **Detox 20.45.1**: End-to-end testing framework for React Native
- **MSW (Mock Service Worker) 2.0.11**: API mocking for tests

### Test Utilities

Custom test utilities are located in `src/test-utils/`:
- `index.tsx`: Custom render functions with providers
- `setup.ts`: Global test configuration and mocks
- `factories.ts`: Test data factories
- `mocks.ts`: Mock helpers
- `simple-render.tsx`: Simple render without providers

## Running Tests

### Unit Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for CI (with coverage, no watch)
npm run test:ci

# Update snapshots
npm run test:update-snapshots
```

### E2E Tests

```bash
# iOS E2E tests
npm run test:e2e:build:ios
npm run test:e2e:test:ios

# Android E2E tests
npm run test:e2e:build:android
npm run test:e2e:test:android
```

## Writing Tests

### Component Tests

Use `renderWithProviders` for components that need Redux, Navigation, or Theme context:

```typescript
import { renderWithProviders } from '../../test-utils';
import { fireEvent } from '@testing-library/react-native';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    const { getByText } = renderWithProviders(<MyComponent />);
    expect(getByText('Hello')).toBeTruthy();
  });

  it('handles user interaction', () => {
    const mockOnPress = jest.fn();
    const { getByTestId } = renderWithProviders(
      <MyComponent onPress={mockOnPress} />
    );

    fireEvent.press(getByTestId('my-button'));
    expect(mockOnPress).toHaveBeenCalled();
  });
});
```

### Simple Component Tests

Use `simpleRender` for components without context dependencies:

```typescript
import { simpleRender } from '../../test-utils/simple-render';
import PureComponent from '../PureComponent';

describe('PureComponent', () => {
  it('renders text', () => {
    const { getByText } = simpleRender(<PureComponent text="Test" />);
    expect(getByText('Test')).toBeTruthy();
  });
});
```

### Service/Hook Tests

```typescript
import { renderHook, act } from '@testing-library/react-native';
import { useMyHook } from '../useMyHook';

describe('useMyHook', () => {
  it('returns expected values', () => {
    const { result } = renderHook(() => useMyHook());

    expect(result.current.value).toBe(initialValue);

    act(() => {
      result.current.updateValue(newValue);
    });

    expect(result.current.value).toBe(newValue);
  });
});
```

## Test Structure

### File Organization

```
src/
├── components/
│   ├── MyComponent.tsx
│   └── __tests__/
│       ├── MyComponent.test.tsx
│       └── MyComponent.simple.test.tsx
├── services/
│   ├── MyService.ts
│   └── __tests__/
│       └── MyService.test.ts
└── test-utils/
    ├── index.tsx
    ├── setup.ts
    ├── factories.ts
    └── mocks.ts
```

### Test File Naming

- Unit/Component tests: `ComponentName.test.tsx`
- Simple tests (no providers): `ComponentName.simple.test.tsx`
- Integration tests: `ServiceName.test.ts`
- E2E tests: `featureName.test.js` (in `e2e/` directory)

## Mocking

### Global Mocks

Global mocks are configured in `src/test-utils/setup.ts`:
- React Native modules (SQLite, AsyncStorage, File System)
- Navigation hooks and components
- BackHandler
- Theme utilities

### Custom Mocks

Create mocks for specific tests:

```typescript
jest.mock('../services/MyService', () => ({
  fetchData: jest.fn(() => Promise.resolve(mockData)),
  saveData: jest.fn(() => Promise.resolve()),
}));
```

### Using Test Factories

```typescript
import { createTopic, createExercise } from '../../test-utils/factories';

const topic = createTopic({ topic: 'Greetings' });
const exercise = createExercise({ exercise_name: 'Test Exercise' });
```

## Coverage

### Coverage Thresholds

Current coverage thresholds (defined in `jest.config.js`):
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 80%
- **Statements**: 80%

### Viewing Coverage

```bash
# Generate and view coverage report
npm run test:coverage

# Coverage report will be in coverage/lcov-report/index.html
open coverage/lcov-report/index.html
```

### Coverage Exclusions

The following are excluded from coverage:
- Type definition files (`*.d.ts`)
- Test utilities (`src/test-utils/**`)
- Type files (`src/types/**`)
- Index files (`src/**/index.ts`)

## CI/CD Integration

### GitHub Actions Workflows

#### test.yml
Runs on push to `main`/`develop` and on pull requests:
- Unit tests with coverage
- iOS E2E tests
- Android E2E tests
- Code quality checks (lint, format, type-check)
- Codecov integration

#### pr-checks.yml
Runs on pull requests:
- Quick quality checks
- Unit tests with coverage reporting in PR comments
- Security scanning (npm audit, sensitive file detection)

#### nightly-e2e.yml
Runs daily at 2 AM UTC:
- Comprehensive E2E tests on multiple devices/OS versions
- Performance testing
- Automated test result reporting

### Running CI Locally

To simulate CI environment locally:

```bash
# Run all checks that CI runs
npm run type-check
npm run lint
npm run format:check
npm run test:ci
```

## Best Practices

### General Guidelines

1. **Test Behavior, Not Implementation**
   - Focus on what the component does, not how it does it
   - Avoid testing internal state or implementation details

2. **Use Descriptive Test Names**
   - Test names should describe what is being tested
   - Use "should" or "it" format: `it('should handle user login')`

3. **Arrange-Act-Assert Pattern**
   ```typescript
   it('calculates total correctly', () => {
     // Arrange
     const items = [1, 2, 3];

     // Act
     const total = calculateTotal(items);

     // Assert
     expect(total).toBe(6);
   });
   ```

4. **Keep Tests Focused**
   - One test should test one thing
   - Break complex tests into multiple smaller tests

5. **Use Test IDs for Elements**
   ```typescript
   // In component
   <TouchableOpacity testID="submit-button">

   // In test
   const button = getByTestId('submit-button');
   ```

### Component Testing

1. **Test User Interactions**
   ```typescript
   fireEvent.press(button);
   fireEvent.changeText(input, 'new text');
   ```

2. **Test Accessibility**
   ```typescript
   expect(button.props.accessibilityRole).toBe('button');
   expect(button.props.accessibilityLabel).toContain('Submit');
   ```

3. **Test Different States**
   - Loading states
   - Error states
   - Empty states
   - Success states

### Async Testing

```typescript
import { waitFor } from '@testing-library/react-native';

it('loads data asynchronously', async () => {
  const { getByText } = renderWithProviders(<MyComponent />);

  await waitFor(() => {
    expect(getByText('Loaded Data')).toBeTruthy();
  });
});
```

### Avoiding Common Pitfalls

1. **Don't test external libraries** - Focus on your code
2. **Avoid testing too many things at once** - Keep tests focused
3. **Don't couple tests** - Each test should be independent
4. **Mock external dependencies** - Don't make real API calls
5. **Clean up after tests** - Use `beforeEach`/`afterEach` hooks

### Example Test Structure

```typescript
describe('MyComponent', () => {
  // Setup
  const mockOnPress = jest.fn();
  const defaultProps = {
    title: 'Test',
    onPress: mockOnPress,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Group related tests
  describe('Rendering', () => {
    it('renders title correctly', () => {
      const { getByText } = renderWithProviders(
        <MyComponent {...defaultProps} />
      );
      expect(getByText('Test')).toBeTruthy();
    });
  });

  describe('User Interactions', () => {
    it('calls onPress when button is pressed', () => {
      const { getByTestId } = renderWithProviders(
        <MyComponent {...defaultProps} />
      );
      fireEvent.press(getByTestId('button'));
      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty title', () => {
      const { queryByText } = renderWithProviders(
        <MyComponent {...defaultProps} title="" />
      );
      expect(queryByText('')).toBeNull();
    });
  });
});
```

## Test database fixture

We keep a reduced copy of the runtime SQLite bundle under `test-fixtures/databases/testLanguageLearningDatabase.db` together with the SQL script that generates it (`test-fixtures/databases/testLanguageLearningDatabase.db.sql`). The file lives outside of `assets/` so it is never bundled in production, and it is only referenced by tests (currently `src/services/__tests__/databaseSample.test.ts`). Recreate the fixture at any time by running:

```
sqlite3 test-fixtures/databases/testLanguageLearningDatabase.db < test-fixtures/databases/testLanguageLearningDatabase.db.sql
```

Maintaining this fixture keeps schema-dependent suites fast and deterministic while staying aligned with the real database.

## Troubleshooting

### Common Issues

**Tests failing with "Cannot find module"**
- Run `npm ci` to ensure all dependencies are installed
- Check that the import path is correct

**Mock not working**
- Ensure mocks are defined before imports
- Check that the mock path matches the actual module path

**Tests timeout**
- Increase Jest timeout: `jest.setTimeout(10000)`
- Check for unhandled promises

**Coverage not updating**
- Clear Jest cache: `npm test -- --clearCache`
- Ensure files aren't excluded in `jest.config.js`

### Getting Help

- Check Jest documentation: https://jestjs.io/
- Check React Native Testing Library docs: https://callstack.github.io/react-native-testing-library/
- Check Detox documentation: https://wix.github.io/Detox/

## Contributing

When adding new features:
1. Write tests for new code before or alongside implementation
2. Ensure all tests pass: `npm test`
3. Maintain or improve coverage: `npm run test:coverage`
4. Follow the testing patterns established in this guide
5. Update this guide if you introduce new testing patterns

---

Last updated: 2025-11-14
