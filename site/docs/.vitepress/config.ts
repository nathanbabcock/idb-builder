import { defineConfig } from 'vitepress'
import { transformerTwoslash } from '@shikijs/vitepress-twoslash'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Typedex',
  description: 'Extreme typesafety for Indexed DB',
  cleanUrls: true,
  lastUpdated: true,

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      // { text: 'Examples', link: '/markdown-examples' },
    ],

    sidebar: [
      {
        text: 'Guides',
        collapsed: false,
        items: [{ text: 'Getting started', link: '/getting-started' }],
      },
      {
        text: 'Typesafety',
        collapsed: true,
        items: [
          { text: 'Database versions', link: '/typesafety/database-versions' },
          { text: 'Composite keys', link: '/typesafety/composite-keys' },
          { text: 'Auto increment', link: '/typesafety/auto-increment' },
        ],
      },
      {
        text: 'Philosophy',
        collapsed: true,
        items: [{ text: 'Error messages', link: '/philosophy/error-messages' }],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/nathanbabcock/typedex' },
    ],

    editLink: {
      pattern: 'https://github.com/nathanbabcock/typedex/edit/main/:path',
      text: 'Edit this page on GitHub',
    },
  },

  markdown: {
    codeTransformers: [transformerTwoslash({})],
    // Explicitly load these languages for types highlighting
    languages: ['ts'],
  },
})
