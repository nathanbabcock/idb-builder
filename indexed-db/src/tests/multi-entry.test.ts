import { IDBFactory } from 'fake-indexeddb'
import { beforeEach, expect, test } from 'vitest'
import { z } from 'zod'
import { openDB } from '../lib/idb-adapter'
import { createMigrations } from '../lib/migration-builder'

import 'fake-indexeddb/auto'

beforeEach(() => {
  indexedDB = new IDBFactory()
})

test('multi-entry index retrieves records by array element', async () => {
  const migrations = createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'posts',
        schema: z.object({
          id: z.string(),
          title: z.string(),
          tags: z.array(z.string()),
        }),
        primaryKey: 'id',
      })
    )
    .version(2, v =>
      v.createIndex('byTag', {
        storeName: 'posts',
        keyPath: 'tags',
        multiEntry: true,
      })
    )

  const db = await openDB('test-db', migrations)

  await db.put('posts', {
    id: '1',
    title: 'Learning TypeScript',
    tags: ['typescript', 'javascript', 'tutorial'],
  })
  await db.put('posts', {
    id: '2',
    title: 'React Basics',
    tags: ['react', 'javascript', 'tutorial'],
  })
  await db.put('posts', {
    id: '3',
    title: 'Node.js Guide',
    tags: ['nodejs', 'javascript'],
  })

  // Query by single tag - should find all posts with 'javascript' tag
  const jsPosts = await db.getAllFromIndex('posts', 'byTag', 'javascript')

  expect(jsPosts).toHaveLength(3)
  expect(jsPosts.map(p => p.id).sort()).toEqual(['1', '2', '3'])

  // Query by 'tutorial' tag - should find 2 posts
  const tutorialPosts = await db.getAllFromIndex('posts', 'byTag', 'tutorial')

  expect(tutorialPosts).toHaveLength(2)
  expect(tutorialPosts.map(p => p.id).sort()).toEqual(['1', '2'])

  db.close()
})
