import { visit } from 'unist-util-visit'
import type { Root, Link } from 'mdast'

/**
 * Remark plugin that makes external links (https://) open in a new tab.
 */
export function remarkExternalLinks() {
  return (tree: Root) => {
    visit(tree, 'link', (node: Link) => {
      if (!node.url.startsWith('https://')) return

      node.data = node.data || {}
      node.data.hProperties = node.data.hProperties || {}
      ;(node.data.hProperties as Record<string, string>).target = '_blank'
      ;(node.data.hProperties as Record<string, string>).rel =
        'noopener noreferrer'
    })
  }
}
