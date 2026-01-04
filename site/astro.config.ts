import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'
import { expressiveCodeConfig } from './expressive-code.config'
import { remarkCodeImport } from './plugins/remark-code-import'
import { remarkExternalLinks } from './plugins/remark-external-links'

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkCodeImport, remarkExternalLinks],
  },
  vite: {
    ssr: {
      // https://github.com/withastro/astro/issues/14117#issuecomment-3117797751
      noExternal: ['zod'],
    },
  },
  integrations: [
    starlight({
      expressiveCode: expressiveCodeConfig,
      title: 'Typedex',
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/nathanbabcock/typedex',
        },
      ],
      sidebar: [
        {
          label: 'Guides',
          autogenerate: { directory: 'guides' },
        },
        {
          label: 'Typesafety',
          autogenerate: { directory: 'typesafety' },
        },
        {
          label: 'Philosophy',
          autogenerate: { directory: 'philosophy' },
        },
        {
          label: 'API Reference',
          autogenerate: { directory: 'reference' },
        },
      ],
    }),
  ],
})
