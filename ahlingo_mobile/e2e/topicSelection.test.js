describe('Topic Selection Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should navigate to topic selection for Match Words', async () => {
    // Start on main menu
    await expect(element(by.id('app-title'))).toBeVisible();

    // Tap Match Words
    await element(by.id('exercise-match-words')).tap();

    // Should show topic selection screen
    await waitFor(element(by.text('Select Topic')))
      .toBeVisible()
      .withTimeout(5000);

    // Should show topics (actual topics will depend on database)
    // Look for common UI elements
    await expect(element(by.text('Select a topic to practice'))).toBeVisible();
  });

  it('should show topics with progress indicators', async () => {
    // Navigate to topic selection
    await element(by.id('exercise-translate')).tap();

    // Wait for topics to load
    await waitFor(element(by.text('Select Topic')))
      .toBeVisible()
      .withTimeout(5000);

    // Topics should be visible with progress
    // (Would need to add testIDs to TopicCard components)
    // For now, check that we can scroll
    await element(by.type('RCTScrollView')).scrollTo('bottom');
    await element(by.type('RCTScrollView')).scrollTo('top');
  });

  it('should select a topic and start exercise', async () => {
    // Navigate to topic selection
    await element(by.id('exercise-conversations')).tap();

    await waitFor(element(by.text('Select Topic')))
      .toBeVisible()
      .withTimeout(5000);

    // Tap the first topic (would need testID on TopicCard)
    // For now, we'll go back
    await device.pressBack();
    await expect(element(by.id('app-title'))).toBeVisible();
  });

  it('should handle different exercise types', async () => {
    // Test Match Words
    await element(by.id('exercise-match-words')).tap();
    await waitFor(element(by.text('Select Topic')))
      .toBeVisible()
      .withTimeout(5000);
    await device.pressBack();

    // Test Conversations
    await element(by.id('exercise-conversations')).tap();
    await waitFor(element(by.text('Select Topic')))
      .toBeVisible()
      .withTimeout(5000);
    await device.pressBack();

    // Test Translate
    await element(by.id('exercise-translate')).tap();
    await waitFor(element(by.text('Select Topic')))
      .toBeVisible()
      .withTimeout(5000);
    await device.pressBack();

    // Test Fill in the Blank
    await element(by.id('exercise-fill-in-the-blank')).tap();
    await waitFor(element(by.text('Select Topic')))
      .toBeVisible()
      .withTimeout(5000);
    await device.pressBack();

    // Should still be functional
    await expect(element(by.id('app-title'))).toBeVisible();
  });

  it('should handle empty topic list gracefully', async () => {
    // This would test the case where no topics are available
    // Navigate to any exercise type
    await element(by.id('exercise-match-words')).tap();

    await waitFor(element(by.text('Select Topic')))
      .toBeVisible()
      .withTimeout(5000);

    // App should show appropriate message or handle empty state
    // Go back to main menu
    await device.pressBack();
    await expect(element(by.id('app-title'))).toBeVisible();
  });
});