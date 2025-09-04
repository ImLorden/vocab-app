const path = require('path');

module.exports = {
  target: 'electron-preload',
  entry: './src/main/preload.ts',
  output: {
    path: path.resolve(__dirname, 'dist/main'),
    filename: 'preload.js',
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: 'ts-loader',
      },
    ],
  },
  node: {
    __dirname: false,
    __filename: false,
  },
};