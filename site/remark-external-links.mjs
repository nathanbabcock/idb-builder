import { visit } from 'unist-util-visit'

/**
 * Remark plugin that makes external links (https://) open in a new tab.
 */
export function remarkExternalLinks() {
  return (tree) => {
    visit(tree, 'link', (node) => {
      if (!node.url.startsWith('https://')) return

      node.data = node.data || {}
      node.data.hProperties = node.data.hProperties || {}
      node.data.hProperties.target = '_blank'
      node.data.hProperties.rel = 'noopener noreferrer'
    })
  }
}
