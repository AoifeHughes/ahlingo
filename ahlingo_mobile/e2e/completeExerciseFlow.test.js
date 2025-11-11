describe('Complete Exercise Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should complete a full exercise from start to finish', async () => {
    // Start on main menu
    await expect(element(by.id('app-title'))).toBeVisible();

    // Navigate to Match Words exercise
    await element(by.id('exercise-match-words')).tap();

    // Should show topic selection screen
    await waitFor(element(by.id('topic-selection-screen')))
      .toBeVisible()
      .withTimeout(5000);

    // Verify exercise type is displayed
    await expect(element(by.id('exercise-type-title'))).toBeVisible();
    await expect(element(by.text('Match Words'))).toBeVisible();

    // Verify user settings are displayed
    await expect(element(by.id('user-settings-display'))).toBeVisible();

    // Wait for topics to load and select first topic
    await waitFor(element(by.id('topics-list')))
      .toBeVisible()
      .withTimeout(10000);

    // Try to tap the first topic (topic ID 1)
    try {
      await element(by.id('topic-card-1')).tap();

      // Should navigate to the actual exercise
      await waitFor(element(by.text('Check')))
        .toBeVisible()
        .withTimeout(10000);

      // Exercise should be functional
      await expect(element(by.text('Check'))).toBeVisible();

    } catch (error) {
      // If no topics available, should show empty state
      await expect(element(by.text('No Topics Available'))).toBeVisible();
    }

    // Navigate back to main menu regardless of outcome
    await device.pressBack();
    if (!(await element(by.id('app-title')).isVisible())) {
      await device.pressBack();
    }
    await expect(element(by.id('app-title'))).toBeVisible();
  });

  it('should handle different exercise types correctly', async () => {
    const exerciseTypes = [
      { id: 'exercise-match-words', title: 'Match Words' },
      { id: 'exercise-conversations', title: 'Conversations' },
      { id: 'exercise-translate', title: 'Translate' },
      { id: 'exercise-fill-in-the-blank', title: 'Fill in the Blank' },
    ];

    for (const exercise of exerciseTypes) {
      // Navigate to exercise
      await element(by.id(exercise.id)).tap();

      // Should show topic selection
      await waitFor(element(by.id('topic-selection-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Verify correct exercise type is shown
      await expect(element(by.text(exercise.title))).toBeVisible();

      // Go back to main menu
      await device.pressBack();
      await expect(element(by.id('app-title'))).toBeVisible();
    }
  });

  it('should handle no topics available gracefully', async () => {
    // Navigate to any exercise type
    await element(by.id('exercise-match-words')).tap();

    await waitFor(element(by.id('topic-selection-screen')))
      .toBeVisible()
      .withTimeout(5000);

    // Check if topics are available or empty state is shown
    try {
      await waitFor(element(by.id('topics-list')))
        .toBeVisible()
        .withTimeout(5000);

      // Topics are available, test passed
    } catch (error) {
      // No topics available, should show empty state
      await expect(element(by.text('No Topics Available'))).toBeVisible();
      await expect(element(by.text('Try changing your language or difficulty in Settings.'))).toBeVisible();
    }

    // Go back to main menu
    await device.pressBack();
    await expect(element(by.id('app-title'))).toBeVisible();
  });

  it('should allow refreshing topics list', async () => {
    // Navigate to topic selection
    await element(by.id('exercise-conversations')).tap();

    await waitFor(element(by.id('topic-selection-screen')))
      .toBeVisible()
      .withTimeout(5000);

    // Pull to refresh
    await element(by.id('topics-list')).scrollTo('top');

    // Swipe down to trigger refresh (pull-to-refresh)
    await element(by.id('topics-list')).swipe('down', 'fast', 0.8);

    // Should still be functional after refresh
    await expect(element(by.id('topic-selection-screen'))).toBeVisible();

    // Go back to main menu
    await device.pressBack();
    await expect(element(by.id('app-title'))).toBeVisible();
  });

  it('should navigate correctly between exercise types', async () => {
    // Test rapid navigation between different exercise types

    // Match Words
    await element(by.id('exercise-match-words')).tap();
    await waitFor(element(by.id('topic-selection-screen')))
      .toBeVisible()
      .withTimeout(5000);
    await expect(element(by.text('Match Words'))).toBeVisible();
    await device.pressBack();

    // Conversations
    await element(by.id('exercise-conversations')).tap();
    await waitFor(element(by.id('topic-selection-screen')))
      .toBeVisible()
      .withTimeout(5000);
    await expect(element(by.text('Conversations'))).toBeVisible();
    await device.pressBack();

    // Translate
    await element(by.id('exercise-translate')).tap();
    await waitFor(element(by.id('topic-selection-screen')))
      .toBeVisible()
      .withTimeout(5000);
    await expect(element(by.text('Translate'))).toBeVisible();
    await device.pressBack();

    // Should still be on main menu and functional
    await expect(element(by.id('app-title'))).toBeVisible();
  });

  it('should maintain state during device rotation', async () => {
    // Navigate to topic selection
    await element(by.id('exercise-match-words')).tap();
    await waitFor(element(by.id('topic-selection-screen')))
      .toBeVisible()
      .withTimeout(5000);

    // Rotate device
    await device.setOrientation('landscape');

    // Should still show topic selection
    await expect(element(by.id('topic-selection-screen'))).toBeVisible();
    await expect(element(by.text('Match Words'))).toBeVisible();

    // Rotate back
    await device.setOrientation('portrait');

    // Should still be functional
    await expect(element(by.id('topic-selection-screen'))).toBeVisible();

    // Go back to main menu
    await device.pressBack();
    await expect(element(by.id('app-title'))).toBeVisible();
  });
});
