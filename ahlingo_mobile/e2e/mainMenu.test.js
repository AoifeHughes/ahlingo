describe('Main Menu Screen', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should display the app title', async () => {
    await expect(element(by.id('app-title'))).toBeVisible();
    await expect(element(by.text('AHLingo'))).toBeVisible();
  });

  it('should display the settings button', async () => {
    await expect(element(by.id('settings-button'))).toBeVisible();
  });

  it('should display all exercise options', async () => {
    await expect(element(by.id('exercise-exercise-shuffle'))).toBeVisible();
    await expect(element(by.id('exercise-match-words'))).toBeVisible();
    await expect(element(by.id('exercise-conversations'))).toBeVisible();
    await expect(element(by.id('exercise-translate'))).toBeVisible();
    await expect(element(by.id('exercise-chat-practice'))).toBeVisible();
    await expect(element(by.id('exercise-study-topic'))).toBeVisible();
    await expect(element(by.id('exercise-fill-in-the-blank'))).toBeVisible();
    await expect(element(by.id('exercise-your-stats'))).toBeVisible();
    await expect(element(by.id('exercise-retry-mistakes'))).toBeVisible();
  });

  it('should navigate to settings when settings button is tapped', async () => {
    await element(by.id('settings-button')).tap();
    // Would need to add testID to settings screen to verify navigation
    await expect(element(by.text('Settings'))).toBeVisible();
  });

  it('should be able to tap exercise shuffle', async () => {
    await element(by.id('exercise-exercise-shuffle')).tap();
    // Test would continue based on what the Exercise Shuffle screen shows
  });

  it('should be able to tap match words exercise', async () => {
    await element(by.id('exercise-match-words')).tap();
    // This should navigate to topic selection
    await expect(element(by.text('Select Topic'))).toBeVisible();
  });

  it('should handle multiple taps without crashing', async () => {
    await element(by.id('exercise-match-words')).tap();
    await device.pressBack(); // Android back button
    await element(by.id('exercise-conversations')).tap();
    await device.pressBack();
    await element(by.id('exercise-translate')).tap();
    await device.pressBack();

    // Should still be on main menu
    await expect(element(by.id('app-title'))).toBeVisible();
  });

  it('should display footer text', async () => {
    await expect(element(by.text('Start your language learning journey'))).toBeVisible();
  });
});
