# E2E Testing with Detox

This directory contains End-to-End (E2E) tests for the AHLingo mobile app using Detox.

## Setup

1. **Prerequisites:**
   - iOS Simulator (for iOS tests)
   - Android Emulator or physical device (for Android tests)
   - Xcode (for iOS)
   - Android Studio (for Android)

2. **Configuration:**
   - Detox configuration is in `.detoxrc.js`
   - Jest configuration for E2E tests is in `e2e/jest.config.js`

## Running Tests

### iOS Tests
```bash
# Build the iOS app for testing
npm run test:e2e:build:ios

# Run iOS E2E tests
npm run test:e2e:test:ios
```

### Android Tests
```bash
# Build the Android app for testing
npm run test:e2e:build:android

# Run Android E2E tests
npm run test:e2e:test:android
```

## Test Files

- `mainMenu.test.js` - Tests for the main menu functionality
- `userJourney.test.js` - Complete user journey flows
- `init.js` - Global setup and helpers

## Writing Tests

### Test ID Guidelines
When adding new tests, ensure components have proper `testID` attributes:

```javascript
// Good
<TouchableOpacity testID="exercise-button">
  <Text>Exercise</Text>
</TouchableOpacity>

// Bad (no testID)
<TouchableOpacity>
  <Text>Exercise</Text>
</TouchableOpacity>
```

### Basic Test Structure
```javascript
describe('Feature Name', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should perform specific action', async () => {
    await expect(element(by.id('test-id'))).toBeVisible();
    await element(by.id('button-id')).tap();
    await expect(element(by.text('Expected Text'))).toBeVisible();
  });
});
```

### Common Patterns

**Wait for elements:**
```javascript
await waitFor(element(by.id('loading-indicator')))
  .not.toBeVisible()
  .withTimeout(5000);
```

**Scroll to element:**
```javascript
await element(by.id('scroll-view')).scrollTo('bottom');
```

**Handle navigation:**
```javascript
await device.pressBack(); // Android back button
```

**Text input:**
```javascript
await element(by.id('text-input')).typeText('Hello World');
```

## Debugging

1. **Screenshots:** Use `await device.takeScreenshot('test-name')` to capture screenshots during test failures
2. **Logs:** Check device logs and Detox logs for debugging information
3. **Synchronization:** Use `await waitFor()` for elements that may take time to appear

## CI/CD Integration

These tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions step
- name: Run E2E tests
  run: |
    npm run test:e2e:build:ios
    npm run test:e2e:test:ios
```

## Notes

- Tests are configured to run with a single worker (`maxWorkers: 1`) to avoid conflicts
- Default timeout is set to 120 seconds for complex operations
- Tests automatically reload React Native between test cases for isolation
