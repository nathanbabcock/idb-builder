// @ts-check
import { defineEcConfig } from '@astrojs/starlight/expressive-code'
import ecTwoSlash from 'expressive-code-twoslash'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import ts from 'typescript'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineEcConfig({
  plugins: [
    ecTwoSlash({
      twoslashOptions: {
        tsModule: ts,
        compilerOptions: {
          ...ts.convertCompilerOptionsFromJson(
            {
              target: 'ES2024',
              useDefineForClassFields: true,
              lib: ['ES2024', 'DOM', 'DOM.Iterable'],
              module: 'ESNext',
              skipLibCheck: true,
              moduleResolution: 'bundler',
              allowImportingTsExtensions: true,
              verbatimModuleSyntax: true,
              moduleDetection: 'force',
              noEmit: true,
              jsx: 'react-jsx',
              strict: true,
              noUnusedLocals: true,
              noUnusedParameters: true,
              noFallthroughCasesInSwitch: true,
              noUncheckedSideEffectImports: true,
              strictNullChecks: true,
            },
            __dirname
          ).options,
        },
      },
    }),
  ],
})
