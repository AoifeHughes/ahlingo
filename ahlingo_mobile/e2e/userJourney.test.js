describe('User Journey E2E Tests', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should complete a full exercise selection journey', async () => {
    // Start on main menu
    await expect(element(by.id('app-title'))).toBeVisible();
    await expect(element(by.text('AHLingo'))).toBeVisible();

    // Tap on Match Words exercise
    await element(by.id('exercise-match-words')).tap();

    // Should navigate to topic selection
    // (Would need to add testIDs to TopicSelectionScreen)
    await waitFor(element(by.text('Select Topic')))
      .toBeVisible()
      .withTimeout(5000);

    // Go back to main menu
    await device.pressBack();

    // Verify we're back on main menu
    await expect(element(by.id('app-title'))).toBeVisible();
  });

  it('should navigate to settings and interact with elements', async () => {
    // Start on main menu
    await expect(element(by.id('app-title'))).toBeVisible();

    // Tap settings button
    await element(by.id('settings-button')).tap();

    // Should navigate to settings screen
    await waitFor(element(by.id('settings-screen')))
      .toBeVisible()
      .withTimeout(5000);

    // Scroll down to danger zone
    await element(by.id('settings-scroll')).scrollTo('bottom');

    // Verify danger zone is visible
    await expect(element(by.id('danger-zone'))).toBeVisible();
    await expect(element(by.text('Danger Zone'))).toBeVisible();

    // Verify reset button is present
    await expect(element(by.id('reset-button'))).toBeVisible();

    // Go back to main menu
    await device.pressBack();

    // Verify we're back on main menu
    await expect(element(by.id('app-title'))).toBeVisible();
  });

  it('should handle rapid navigation without crashes', async () => {
    // Test rapid navigation to ensure app stability
    await expect(element(by.id('app-title'))).toBeVisible();

    // Rapidly navigate between different exercises
    await element(by.id('exercise-match-words')).tap();
    await device.pressBack();

    await element(by.id('exercise-conversations')).tap();
    await device.pressBack();

    await element(by.id('exercise-translate')).tap();
    await device.pressBack();

    await element(by.id('exercise-chat-practice')).tap();
    await device.pressBack();

    // Go to settings and back
    await element(by.id('settings-button')).tap();
    await waitFor(element(by.id('settings-screen')))
      .toBeVisible()
      .withTimeout(3000);
    await device.pressBack();

    // Should still be on main menu and functional
    await expect(element(by.id('app-title'))).toBeVisible();
    await expect(element(by.text('AHLingo'))).toBeVisible();
  });

  it('should display all exercise cards with correct content', async () => {
    await expect(element(by.id('app-title'))).toBeVisible();

    // Verify all exercise cards are present and have correct text
    await expect(element(by.text('Exercise Shuffle'))).toBeVisible();
    await expect(element(by.text('Match Words'))).toBeVisible();
    await expect(element(by.text('Conversations'))).toBeVisible();
    await expect(element(by.text('Translate'))).toBeVisible();
    await expect(element(by.text('Chat Practice'))).toBeVisible();
    await expect(element(by.text('Study Topic'))).toBeVisible();
    await expect(element(by.text('Fill in the Blank'))).toBeVisible();
    await expect(element(by.text('Your Stats'))).toBeVisible();
    await expect(element(by.text('Retry Mistakes'))).toBeVisible();

    // Verify footer text
    await expect(element(by.text('Start your language learning journey'))).toBeVisible();
  });

  it('should handle device rotation', async () => {
    await expect(element(by.id('app-title'))).toBeVisible();

    // Rotate device to landscape
    await device.setOrientation('landscape');

    // App should still be functional
    await expect(element(by.id('app-title'))).toBeVisible();
    await expect(element(by.id('exercise-match-words'))).toBeVisible();

    // Rotate back to portrait
    await device.setOrientation('portrait');

    // App should still be functional
    await expect(element(by.id('app-title'))).toBeVisible();
    await expect(element(by.id('exercise-match-words'))).toBeVisible();
  });

  it('should handle app backgrounding and foregrounding', async () => {
    await expect(element(by.id('app-title'))).toBeVisible();

    // Send app to background
    await device.sendToHome();

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Bring app back to foreground
    await device.launchApp({ newInstance: false });

    // App should still be functional
    await expect(element(by.id('app-title'))).toBeVisible();
    await expect(element(by.text('AHLingo'))).toBeVisible();
  });
});
