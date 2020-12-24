module.exports = {
  testTimeout: 50000,
  verbose: true,
  moduleFileExtensions: ['js'],
  testMatch: ['<rootDir>/tests/**/**.test.js'],
  transform: {
    '^.+\\.js?$': 'babel-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@ledgerhq))/'
  ]
}
