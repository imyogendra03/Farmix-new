module.exports = {
  testEnvironment: 'node',
  clearMocks: true,
  collectCoverageFrom: [
    'middleware/**/*.js',
    'utils/**/*.js',
    '!**/node_modules/**'
  ]
};
