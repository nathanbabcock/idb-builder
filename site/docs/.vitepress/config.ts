import { defineConfig } from 'vitepress'
import { transformerTwoslash } from '@shikijs/vitepress-twoslash'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Typedex',
  description: 'Extreme typesafety for Indexed DB',
  cleanUrls: true,
  lastUpdated: true,

  themeConfig: {
    outline: {
      level: 'deep',
    },

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
        text: 'Features',
        collapsed: true,
        items: [
          { text: 'Database versions', link: '/features/database-versions' },
          { text: 'Update schema', link: '/features/update-schema' },
          { text: 'Transform records', link: '/features/transform-records' },
          { text: 'Composite keys', link: '/features/composite-keys' },
          { text: 'Auto increment', link: '/features/auto-increment' },
          {
            text: 'Multi-entry indexes',
            link: '/features/multi-entry-indexes',
          },
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
    codeTransformers: [transformerTwoslash()],
    // Explicitly load these languages for types highlighting
    languages: ['ts'],
  },
})
