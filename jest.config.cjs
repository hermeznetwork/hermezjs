module.exports = {
  testTimeout: 300000,
  verbose: true,
  moduleFileExtensions: ['js', 'json'],
  testMatch: ['<rootDir>/tests/**/**.test.js'],
  transform: {
    '^.+\\.js?$': 'babel-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@ledgerhq))/'
  ]
}
