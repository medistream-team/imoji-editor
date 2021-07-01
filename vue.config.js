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
  },
  chainWebpack: config => {
    const svgRule = config.module.rule('svg');
    // clear all existing loaders.
    // if you don't do this, the loader below will be appended to
    // existing loaders of the rule.
    svgRule.uses.clear();
    svgRule
      .use('url-loader')
      .loader('url-loader')
      .tap(() => {
        return {
          limit: 102400 // 100kb
        };
      });
  }
};
