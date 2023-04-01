const withNextra = require('nextra')('nextra-theme-blog', './theme.config.js')

module.exports = withNextra({
  i18n: {
    locales: ['zh', 'en', 'ja'],
    defaultLocale: 'zh'
  }
})
