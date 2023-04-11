// // webpack.config.js
// const path = require('path');
// const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

import path from 'path';
import {fileURLToPath} from 'url';
import NodePolyfillPlugin from 'node-polyfill-webpack-plugin';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export default {
  entry: path.resolve(__dirname, 'platfm/cfw.js'),
  target: 'webworker',
  output: {
    filename: 'worker.js',
    path: path.resolve(__dirname, 'dist'),
  },
  //mode: 'production',
  mode: 'development',
  devtool:"source-map",
  resolve: {
    fallback: {
      fs: false,
    },
  },
  plugins: [new NodePolyfillPlugin()],
  performance: {
    hints: false,
  },
};