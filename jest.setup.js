// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Mock window.fetch for tests
global.fetch = jest.fn()

// Mock window.navigator.geolocation
Object.defineProperty(global.navigator, 'geolocation', {
  value: {
    getCurrentPosition: jest.fn(),
    watchPosition: jest.fn(),
    clearWatch: jest.fn(),
  },
  writable: true,
})

// Mock window.addEventListener for network monitoring
Object.defineProperty(global.window, 'addEventListener', {
  value: jest.fn(),
  writable: true,
})

// Mock window.dispatchEvent
Object.defineProperty(global.window, 'dispatchEvent', {
  value: jest.fn(),
  writable: true,
})

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}