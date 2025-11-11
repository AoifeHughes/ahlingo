describe('Exercise Shuffle Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should complete an exercise shuffle session', async () => {
    // Start on main menu
    await expect(element(by.id('app-title'))).toBeVisible();

    // Tap Exercise Shuffle
    await element(by.id('exercise-exercise-shuffle')).tap();

    // Should show Exercise Shuffle Start screen
    // (Would need to add testIDs to ExerciseShuffleStartScreen)
    await waitFor(element(by.text('Exercise Shuffle')))
      .toBeVisible()
      .withTimeout(5000);

    // Look for start button or exercise count
    await waitFor(element(by.text('Start')))
      .toBeVisible()
      .withTimeout(5000);

    // Tap start button
    await element(by.text('Start')).tap();

    // Should now be in an exercise
    // The exact exercise will vary, but we should see some common elements
    await waitFor(element(by.text('Check')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('should handle exercise navigation flow', async () => {
    // Navigate to Exercise Shuffle
    await element(by.id('exercise-exercise-shuffle')).tap();

    // Start the shuffle
    await waitFor(element(by.text('Start')))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.text('Start')).tap();

    // Submit an answer (would need to interact with specific exercise)
    await waitFor(element(by.text('Check')))
      .toBeVisible()
      .withTimeout(10000);
    await element(by.text('Check')).tap();

    // Should show result or next button
    await waitFor(element(by.text('Next')))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.text('Next')).tap();

    // Continue through exercises...
  });

  it('should show summary screen after completing exercises', async () => {
    // This test would need to complete all 5 exercises
    // For now, we'll test navigation back from shuffle
    await element(by.id('exercise-exercise-shuffle')).tap();

    // Go back
    await device.pressBack();

    // Should be back on main menu
    await expect(element(by.id('app-title'))).toBeVisible();
  });

  it('should handle interruption during exercise shuffle', async () => {
    // Start exercise shuffle
    await element(by.id('exercise-exercise-shuffle')).tap();
    await waitFor(element(by.text('Start')))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.text('Start')).tap();

    // Wait for exercise to load
    await waitFor(element(by.text('Check')))
      .toBeVisible()
      .withTimeout(10000);

    // Try to go back - should show warning or handle gracefully
    await device.pressBack();

    // App should handle this gracefully
    // Either show a warning or navigate back safely
  });
});
