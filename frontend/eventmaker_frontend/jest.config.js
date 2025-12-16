module.exports = {
  transformIgnorePatterns: [
    "node_modules/(?!(axios|other-esm-package)/)"
  ],
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
};