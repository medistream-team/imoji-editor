module.exports = {
  base: '/imoji-editor/',
  title: 'imoji-editor',
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Options', link: '/options/' },
      { text: 'Example', link: '/example/' },
      { text: 'Features', link: '/features/' },
      {
        text: 'Github',
        link: 'https://github.com/medistream-team/imoji-editor'
      }
    ],
    sidebar: [
      ['/', '✨ Imoji Editor'],
      ['/options/', 'Options'],
      ['/example/', 'Examples'],
      ['/features/', 'Features']
    ]
  }
};
