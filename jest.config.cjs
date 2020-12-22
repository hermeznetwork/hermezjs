module.exports = {
  testTimeout: 50000,
  verbose: true,
  moduleFileExtensions: [
    'mjs',
    'js',
    'json',
    'jsx',
    'ts',
    'tsx',
    'node'
  ],
  testMatch: [
    '<rootDir>/tests/**/**.test.mjs'
  ],
  transform: {
    '^.+\\.js?$': 'babel-jest',
    '^.+\\.mjs?$': 'babel-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@ledgerhq))/'
  ]
}
