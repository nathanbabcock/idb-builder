/**
 * Comprehensive integration test exercising every major feature of the
 * IndexedDB migration library with real data across multiple versions.
 */

import { IDBFactory } from 'fake-indexeddb'
import { beforeEach, expect, test } from 'vitest'
import { z } from 'zod'
import { openDB } from '../lib/idb-adapter'
import { KeyRange } from '../lib/key-range'
import { createMigrations } from '../lib/migration-builder'

import 'fake-indexeddb/auto'

beforeEach(() => {
  indexedDB = new IDBFactory()
})

test('complete migration lifecycle with all features', async () => {
  // =========================================================================
  // VERSION 1: Create initial stores with various key configurations
  // =========================================================================
  const v1Migrations = createMigrations().version(1, v =>
    v
      // Store with simple string primaryKey
      .createObjectStore(
        'users',
        z.object({
          id: z.string(),
          name: z.string(),
          email: z.string(),
          role: z.string(),
          createdAt: z.number(),
        }),
        { primaryKey: 'id' }
      )
      // Store with composite primaryKey
      .createObjectStore(
        'orders',
        z.object({
          customerId: z.string(),
          orderId: z.string(),
          amount: z.number(),
          status: z.string(),
        }),
        { primaryKey: ['customerId', 'orderId'] }
      )
      // Store with out-of-line autoIncrement keys
      .createObjectStore(
        'logs',
        z.object({
          level: z.string(),
          message: z.string(),
          timestamp: z.number(),
        }),
        { autoIncrement: true }
      )
      // Store with nested primaryKey
      .createObjectStore(
        'documents',
        z.object({
          metadata: z.object({
            id: z.string(),
            version: z.number(),
          }),
          title: z.string(),
          content: z.string(),
        }),
        { primaryKey: 'metadata.id' }
      )
  )

  // Open database and insert initial data
  const db1 = await openDB('integration-test', v1Migrations)

  // Insert users
  await db1.put('users', {
    id: 'user-1',
    name: 'Alice',
    email: 'alice@example.com',
    role: 'admin',
    createdAt: 1000,
  })
  await db1.put('users', {
    id: 'user-2',
    name: 'Bob',
    email: 'bob@example.com',
    role: 'user',
    createdAt: 2000,
  })
  await db1.put('users', {
    id: 'user-3',
    name: 'Charlie',
    email: 'charlie@example.com',
    role: 'user',
    createdAt: 3000,
  })

  // Insert orders with composite keys
  await db1.put('orders', {
    customerId: 'user-1',
    orderId: 'order-1',
    amount: 100,
    status: 'completed',
  })
  await db1.put('orders', {
    customerId: 'user-1',
    orderId: 'order-2',
    amount: 250,
    status: 'pending',
  })
  await db1.put('orders', {
    customerId: 'user-2',
    orderId: 'order-1',
    amount: 75,
    status: 'completed',
  })

  // Insert logs with auto-increment
  const logKey1 = await db1.put('logs', {
    level: 'info',
    message: 'System started',
    timestamp: 1000,
  })
  const logKey2 = await db1.put('logs', {
    level: 'error',
    message: 'Connection failed',
    timestamp: 2000,
  })
  const logKey3 = await db1.put('logs', {
    level: 'info',
    message: 'Reconnected',
    timestamp: 3000,
  })

  expect(logKey1).toBe(1)
  expect(logKey2).toBe(2)
  expect(logKey3).toBe(3)

  // Insert documents with nested key
  await db1.put('documents', {
    metadata: { id: 'doc-1', version: 1 },
    title: 'Getting Started',
    content: 'Welcome to the system…',
  })
  await db1.put('documents', {
    metadata: { id: 'doc-2', version: 1 },
    title: 'Advanced Topics',
    content: 'Deep dive into features…',
  })

  // Verify basic CRUD operations
  expect(await db1.get('users', 'user-1')).toMatchObject({ name: 'Alice' })
  expect(await db1.get('orders', ['user-1', 'order-2'])).toMatchObject({
    amount: 250,
  })
  expect(await db1.get('logs', 2)).toMatchObject({ level: 'error' })
  expect(await db1.get('documents', 'doc-1')).toMatchObject({
    title: 'Getting Started',
  })

  // Verify getAll
  expect(await db1.getAll('users')).toHaveLength(3)
  expect(await db1.getAll('orders')).toHaveLength(3)
  expect(await db1.getAll('logs')).toHaveLength(3)

  db1.close()

  // =========================================================================
  // VERSION 2: Add indexes (simple, unique, multiEntry)
  // =========================================================================
  const v2Migrations = v1Migrations.version(2, v =>
    v
      // Simple index on users by role
      .createIndex('byRole', { storeName: 'users', keyPath: 'role' })
      // Unique index on users by email
      .createIndex('byEmail', {
        storeName: 'users',
        keyPath: 'email',
        unique: true,
      })
      // Index on orders by status
      .createIndex('byStatus', { storeName: 'orders', keyPath: 'status' })
      // Index on logs by level
      .createIndex('byLevel', { storeName: 'logs', keyPath: 'level' })
  )

  const db2 = await openDB('integration-test', v2Migrations)

  // Verify data persisted across upgrade
  expect(await db2.getAll('users')).toHaveLength(3)
  expect(await db2.getAll('orders')).toHaveLength(3)
  expect(await db2.getAll('logs')).toHaveLength(3)

  // Test index queries
  const admins = await db2.getAllFromIndex('users', 'byRole', 'admin')
  expect(admins).toHaveLength(1)
  expect(admins[0].name).toBe('Alice')

  const regularUsers = await db2.getAllFromIndex('users', 'byRole', 'user')
  expect(regularUsers).toHaveLength(2)

  // Test getFromIndex (single result)
  const alice = await db2.getFromIndex('users', 'byEmail', 'alice@example.com')
  expect(alice).toMatchObject({ id: 'user-1', name: 'Alice' })

  // Test orders by status
  const completedOrders = await db2.getAllFromIndex(
    'orders',
    'byStatus',
    'completed'
  )
  expect(completedOrders).toHaveLength(2)

  const pendingOrders = await db2.getAllFromIndex(
    'orders',
    'byStatus',
    'pending'
  )
  expect(pendingOrders).toHaveLength(1)
  expect(pendingOrders[0]).toMatchObject({ orderId: 'order-2' })

  // Test logs by level
  const infoLogs = await db2.getAllFromIndex('logs', 'byLevel', 'info')
  expect(infoLogs).toHaveLength(2)

  const errorLogs = await db2.getAllFromIndex('logs', 'byLevel', 'error')
  expect(errorLogs).toHaveLength(1)

  // Test unique index enforcement
  await expect(
    db2.put('users', {
      id: 'user-4',
      name: 'Dave',
      email: 'alice@example.com', // duplicate email
      role: 'user',
      createdAt: 4000,
    })
  ).rejects.toThrow()

  db2.close()

  // =========================================================================
  // VERSION 3: Add multiEntry index and a new store with tags
  // =========================================================================
  const v3Migrations = v2Migrations.version(3, v =>
    v
      // New store with array field for multiEntry
      .createObjectStore(
        'posts',
        z.object({
          id: z.string(),
          title: z.string(),
          tags: z.array(z.string()),
          authorId: z.string(),
        }),
        { primaryKey: 'id' }
      )
      // multiEntry index on tags
      .createIndex('byTag', {
        storeName: 'posts',
        keyPath: 'tags',
        multiEntry: true,
      })
      // Regular index on author
      .createIndex('byAuthor', { storeName: 'posts', keyPath: 'authorId' })
  )

  const db3 = await openDB('integration-test', v3Migrations)

  // Insert posts with tags
  await db3.put('posts', {
    id: 'post-1',
    title: 'TypeScript Tips',
    tags: ['typescript', 'javascript', 'tutorial'],
    authorId: 'user-1',
  })
  await db3.put('posts', {
    id: 'post-2',
    title: 'React Patterns',
    tags: ['react', 'javascript', 'patterns'],
    authorId: 'user-2',
  })
  await db3.put('posts', {
    id: 'post-3',
    title: 'Node.js Best Practices',
    tags: ['nodejs', 'javascript', 'backend'],
    authorId: 'user-1',
  })

  // Test multiEntry index - find all posts with 'javascript' tag
  const jsPosts = await db3.getAllFromIndex('posts', 'byTag', 'javascript')
  expect(jsPosts).toHaveLength(3)

  // Find posts with 'tutorial' tag
  const tutorialPosts = await db3.getAllFromIndex('posts', 'byTag', 'tutorial')
  expect(tutorialPosts).toHaveLength(1)
  expect(tutorialPosts[0].title).toBe('TypeScript Tips')

  // Find posts by author
  const alicePosts = await db3.getAllFromIndex('posts', 'byAuthor', 'user-1')
  expect(alicePosts).toHaveLength(2)

  db3.close()

  // =========================================================================
  // VERSION 4: Transform records and delete an index
  // =========================================================================
  const v4Migrations = v3Migrations.version(4, v =>
    v
      // Transform users: add displayName combining name and role
      .transformRecords('users', user => ({
        ...user,
        displayName: `${user.name} (${user.role})`,
      }))
      // Delete the byRole index (we have displayName now)
      .deleteIndex('byRole', { storeName: 'users' })
  )

  const db4 = await openDB('integration-test', v4Migrations)

  // Verify transformation happened
  const alice4 = await db4.get('users', 'user-1')
  expect(alice4).toMatchObject({
    name: 'Alice',
    displayName: 'Alice (admin)',
  })

  const bob4 = await db4.get('users', 'user-2')
  expect(bob4).toMatchObject({
    name: 'Bob',
    displayName: 'Bob (user)',
  })

  // Verify all users were transformed
  const allUsers = await db4.getAll('users')
  expect(allUsers).toHaveLength(3)
  for (const user of allUsers) {
    expect(user).toHaveProperty('displayName')
    expect(user.displayName).toContain(user.name)
    expect(user.displayName).toContain(user.role)
  }

  // byRole index should no longer exist
  const tx = db4.transaction('users', 'readonly')
  expect(tx.store.indexNames.contains('byRole' as any)).toBe(false)
  expect(tx.store.indexNames.contains('byEmail')).toBe(true)

  db4.close()

  // =========================================================================
  // VERSION 5: Delete an object store entirely
  // =========================================================================
  const v5Migrations = v4Migrations.version(5, v =>
    v
      // Delete the logs store entirely
      .deleteObjectStore('logs')
  )

  const db5 = await openDB('integration-test', v5Migrations)

  // Verify logs store is gone
  expect(db5.objectStoreNames.contains('logs' as any)).toBe(false)

  // Other stores should still work
  expect(db5.objectStoreNames.contains('users')).toBe(true)
  expect(db5.objectStoreNames.contains('orders')).toBe(true)
  expect(db5.objectStoreNames.contains('posts')).toBe(true)
  expect(db5.objectStoreNames.contains('documents')).toBe(true)

  // Verify data in remaining stores
  expect(await db5.getAll('users')).toHaveLength(3)
  expect(await db5.getAll('orders')).toHaveLength(3)
  expect(await db5.getAll('posts')).toHaveLength(3)
  expect(await db5.getAll('documents')).toHaveLength(2)

  db5.close()

  // =========================================================================
  // VERSION 6: KeyRange queries
  // =========================================================================
  const v6Migrations = v5Migrations.version(6, v =>
    v
      // Add a store with numeric IDs for KeyRange testing
      .createObjectStore(
        'scores',
        z.object({
          id: z.number(),
          playerId: z.string(),
          score: z.number(),
          level: z.number(),
        }),
        { primaryKey: 'id' }
      )
      .createIndex('byScore', { storeName: 'scores', keyPath: 'score' })
      .createIndex('byLevel', { storeName: 'scores', keyPath: 'level' })
  )

  const db6 = await openDB('integration-test', v6Migrations)

  // Insert scores for KeyRange testing
  for (let i = 1; i <= 10; i++) {
    await db6.put('scores', {
      id: i,
      playerId: `player-${(i % 3) + 1}`,
      score: i * 100,
      level: Math.ceil(i / 2),
    })
  }

  // Test KeyRange.gte().lt() - get scores where id >= 3 and id < 8
  const range1 = KeyRange.gte(3).lt(8)
  const scores1 = await db6.getAll('scores', range1.toIDBKeyRange())
  expect(scores1).toHaveLength(5)
  expect(scores1.map(s => s.id)).toEqual([3, 4, 5, 6, 7])

  // Test KeyRange.gt().lte() - get scores where id > 5 and id <= 9
  const range2 = KeyRange.gt(5).lte(9)
  const scores2 = await db6.getAll('scores', range2.toIDBKeyRange())
  expect(scores2).toHaveLength(4)
  expect(scores2.map(s => s.id)).toEqual([6, 7, 8, 9])

  // Test KeyRange.eq() - exact match
  const range3 = KeyRange.eq(5)
  const scores3 = await db6.getAll('scores', range3.toIDBKeyRange())
  expect(scores3).toHaveLength(1)
  expect(scores3[0].id).toBe(5)

  // Test KeyRange.lowerBound()
  const range4 = KeyRange.lowerBound(8)
  const scores4 = await db6.getAll('scores', range4.toIDBKeyRange())
  expect(scores4).toHaveLength(3)
  expect(scores4.map(s => s.id)).toEqual([8, 9, 10])

  // Test KeyRange.upperBound()
  const range5 = KeyRange.upperBound(3)
  const scores5 = await db6.getAll('scores', range5.toIDBKeyRange())
  expect(scores5).toHaveLength(3)
  expect(scores5.map(s => s.id)).toEqual([1, 2, 3])

  // Test KeyRange.bound()
  const range6 = KeyRange.bound(2, 5)
  const scores6 = await db6.getAll('scores', range6.toIDBKeyRange())
  expect(scores6).toHaveLength(4)
  expect(scores6.map(s => s.id)).toEqual([2, 3, 4, 5])

  // Test KeyRange on index - get scores where score >= 500 and score < 800
  const scoreTx = db6.transaction('scores', 'readonly')
  const scoreIndex = scoreTx.store.index('byScore')
  const indexRange = KeyRange.gte(500).lt(800)
  const highScores = await scoreIndex.getAll(indexRange.toIDBKeyRange())
  expect(highScores).toHaveLength(3)
  expect(highScores.map(s => s.score)).toEqual([500, 600, 700])

  db6.close()

  // =========================================================================
  // FINAL: Test delete operations and count
  // =========================================================================
  const dbFinal = await openDB('integration-test', v6Migrations)

  // Count before delete
  expect(await dbFinal.count('users')).toBe(3)
  expect(await dbFinal.count('orders')).toBe(3)
  expect(await dbFinal.count('scores')).toBe(10)

  // Delete a single user
  await dbFinal.delete('users', 'user-2')
  expect(await dbFinal.count('users')).toBe(2)
  expect(await dbFinal.get('users', 'user-2')).toBeUndefined()

  // Delete order with composite key
  await dbFinal.delete('orders', ['user-1', 'order-1'])
  expect(await dbFinal.count('orders')).toBe(2)
  expect(await dbFinal.get('orders', ['user-1', 'order-1'])).toBeUndefined()

  // Clear entire store
  await dbFinal.clear('scores')
  expect(await dbFinal.count('scores')).toBe(0)

  // Verify other stores unaffected
  expect(await dbFinal.count('users')).toBe(2)
  expect(await dbFinal.count('orders')).toBe(2)
  expect(await dbFinal.count('posts')).toBe(3)
  expect(await dbFinal.count('documents')).toBe(2)

  dbFinal.close()
})
