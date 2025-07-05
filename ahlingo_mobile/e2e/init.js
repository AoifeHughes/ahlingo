const { device, expect, element, by, waitFor } = require('detox');

describe('Example', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });
});

// Global helpers for E2E tests
global.device = device;
global.expect = expect;
global.element = element;
global.by = by;
global.waitFor = waitFor;