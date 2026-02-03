import { defineConfig } from 'vitepress'
import { transformerTwoslash } from '@shikijs/vitepress-twoslash'
import llmstxt, { copyOrDownloadAsMarkdownButtons } from 'vitepress-plugin-llms'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'idb-builder',
  description: 'Type-safe IndexedDB migrations',
  base: '/idb-builder/',
  cleanUrls: true,
  lastUpdated: true,
  sitemap: {
    hostname: 'https://nathanbabcock.github.io/idb-builder/',
  },

  head: [
    [
      'link',
      {
        rel: 'icon',
        type: 'image/x-icon',
        href: '/idb-builder/assets/favicon.ico',
      },
    ],
    [
      'link',
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: '/idb-builder/assets/favicon-32x32.png',
      },
    ],
    [
      'link',
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: '/idb-builder/assets/favicon-16x16.png',
      },
    ],
    [
      'link',
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/idb-builder/assets/apple-touch-icon.png',
      },
    ],
  ],

  themeConfig: {
    logo: '/assets/logo.png',
    search: {
      provider: 'local',
    },

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
        collapsed: true,
        items: [{ text: 'Getting started', link: '/getting-started' }],
      },
      {
        text: 'Features',
        collapsed: false,
        items: [
          {
            text: 'Create object store',
            link: '/features/create-object-store',
          },
          { text: 'Database versions', link: '/features/database-versions' },
          { text: 'Update schema', link: '/features/update-schema' },
          { text: 'Transform records', link: '/features/transform-records' },
          { text: 'Nested keys', link: '/features/nested-keys' },
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
        items: [
          { text: 'Error messages', link: '/philosophy/error-messages' },
          { text: 'LLM use', link: '/philosophy/llm-use' },
          {
            text: 'Documentation as tests',
            link: '/philosophy/documentation-as-tests',
          },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/nathanbabcock/idb-builder' },
    ],

    editLink: {
      pattern: 'https://github.com/nathanbabcock/idb-builder/edit/main/:path',
      text: 'Edit this page on GitHub',
    },
  },

  markdown: {
    codeTransformers: [transformerTwoslash()],
    // Explicitly load these languages for types highlighting
    languages: ['ts'],
    config(md) {
      md.use(copyOrDownloadAsMarkdownButtons)
    },
  },

  vite: {
    plugins: [llmstxt()],
  },
})
