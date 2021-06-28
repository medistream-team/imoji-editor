/* eslint-disable no-undef */
const path = require('path');

module.exports = {
  devServer: {
    overlay: false
  },
  css: {
    extract: false
  },
  configureWebpack: {
    resolve: {
      alias: {
        icons: path.join(__dirname, 'node_modules/vue-material-design-icons')
      },
      extensions: ['.vue']
    }
  }
};
