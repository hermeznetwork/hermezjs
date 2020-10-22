const path = require('path')

module.exports = module.exports = {
  entry: './src/index.js',
  name: 'cjs',
  output: {
    path: path.resolve(__dirname),
    filename: 'hermez.js',
    library: 'hermez',
    libraryTarget: 'umd'
  },
  target: ['node']
}
