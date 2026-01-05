import { IDBFactory } from 'fake-indexeddb'
import { beforeEach, expect, test } from 'vitest'
import { z } from 'zod'
import { openDB } from '../lib/idb-adapter'
import { createMigrations } from '../lib/migration-builder'

import 'fake-indexeddb/auto'

beforeEach(() => {
  indexedDB = new IDBFactory()
})

test('creates object store with composite primary key (flat) and verifies lookup', async () => {
  const orderSchema = z.object({
    customerId: z.string(),
    orderId: z.string(),
    amount: z.number(),
    status: z.string(),
  })

  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'orders',
      schema: orderSchema,
      primaryKey: ['customerId', 'orderId'],
    })
  )

  const db = await openDB('test-db', migrations)

  await db.put('orders', {
    customerId: 'customer-1',
    orderId: 'order-1',
    amount: 100,
    status: 'pending',
  })
  await db.put('orders', {
    customerId: 'customer-1',
    orderId: 'order-2',
    amount: 200,
    status: 'completed',
  })
  await db.put('orders', {
    customerId: 'customer-2',
    orderId: 'order-1',
    amount: 150,
    status: 'pending',
  })

  const order1 = await db.get('orders', ['customer-1', 'order-1'])
  const order2 = await db.get('orders', ['customer-1', 'order-2'])
  const order3 = await db.get('orders', ['customer-2', 'order-1'])

  expect(order1).toEqual({
    customerId: 'customer-1',
    orderId: 'order-1',
    amount: 100,
    status: 'pending',
  })
  expect(order2).toEqual({
    customerId: 'customer-1',
    orderId: 'order-2',
    amount: 200,
    status: 'completed',
  })
  expect(order3).toEqual({
    customerId: 'customer-2',
    orderId: 'order-1',
    amount: 150,
    status: 'pending',
  })

  db.close()
})

test('creates object store with composite primary key (nested) and verifies lookup', async () => {
  const eventSchema = z.object({
    user: z.object({
      id: z.string(),
      name: z.string(),
    }),
    event: z.object({
      id: z.string(),
      type: z.string(),
    }),
    timestamp: z.number(),
  })

  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'events',
      schema: eventSchema,
      primaryKey: ['user.id', 'event.id'],
    })
  )

  const db = await openDB('test-db', migrations)

  await db.put('events', {
    user: { id: 'user-1', name: 'Alice' },
    event: { id: 'event-1', type: 'click' },
    timestamp: 1000,
  })
  await db.put('events', {
    user: { id: 'user-1', name: 'Alice' },
    event: { id: 'event-2', type: 'scroll' },
    timestamp: 2000,
  })
  await db.put('events', {
    user: { id: 'user-2', name: 'Bob' },
    event: { id: 'event-1', type: 'click' },
    timestamp: 3000,
  })

  const event1 = await db.get('events', ['user-1', 'event-1'])
  const event2 = await db.get('events', ['user-1', 'event-2'])
  const event3 = await db.get('events', ['user-2', 'event-1'])

  expect(event1).toEqual({
    user: { id: 'user-1', name: 'Alice' },
    event: { id: 'event-1', type: 'click' },
    timestamp: 1000,
  })
  expect(event2).toEqual({
    user: { id: 'user-1', name: 'Alice' },
    event: { id: 'event-2', type: 'scroll' },
    timestamp: 2000,
  })
  expect(event3).toEqual({
    user: { id: 'user-2', name: 'Bob' },
    event: { id: 'event-1', type: 'click' },
    timestamp: 3000,
  })

  db.close()
})

test('creates object store with composite primary key (mixed flat and nested) and verifies lookup', async () => {
  const transactionSchema = z.object({
    accountId: z.string(),
    transaction: z.object({
      id: z.string(),
      date: z.string(),
    }),
    amount: z.number(),
    description: z.string(),
  })

  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'transactions',
      schema: transactionSchema,
      primaryKey: ['accountId', 'transaction.id'],
    })
  )

  const db = await openDB('test-db', migrations)

  await db.put('transactions', {
    accountId: 'account-1',
    transaction: { id: 'tx-1', date: '2024-01-01' },
    amount: 500,
    description: 'Payment received',
  })
  await db.put('transactions', {
    accountId: 'account-1',
    transaction: { id: 'tx-2', date: '2024-01-02' },
    amount: -100,
    description: 'Purchase',
  })
  await db.put('transactions', {
    accountId: 'account-2',
    transaction: { id: 'tx-1', date: '2024-01-01' },
    amount: 1000,
    description: 'Deposit',
  })

  const tx1 = await db.get('transactions', ['account-1', 'tx-1'])
  const tx2 = await db.get('transactions', ['account-1', 'tx-2'])
  const tx3 = await db.get('transactions', ['account-2', 'tx-1'])

  expect(tx1).toEqual({
    accountId: 'account-1',
    transaction: { id: 'tx-1', date: '2024-01-01' },
    amount: 500,
    description: 'Payment received',
  })
  expect(tx2).toEqual({
    accountId: 'account-1',
    transaction: { id: 'tx-2', date: '2024-01-02' },
    amount: -100,
    description: 'Purchase',
  })
  expect(tx3).toEqual({
    accountId: 'account-2',
    transaction: { id: 'tx-1', date: '2024-01-01' },
    amount: 1000,
    description: 'Deposit',
  })

  db.close()
})

test('creates object store with composite primary key (deeply nested) and verifies lookup', async () => {
  const logSchema = z.object({
    system: z.object({
      server: z.object({
        id: z.string(),
        region: z.string(),
      }),
      timestamp: z.number(),
    }),
    log: z.object({
      level: z.string(),
      message: z.string(),
    }),
  })

  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'logs',
      schema: logSchema,
      primaryKey: ['system.server.id', 'system.timestamp'],
    })
  )

  const db = await openDB('test-db', migrations)

  await db.put('logs', {
    system: {
      server: { id: 'server-1', region: 'us-east' },
      timestamp: 1000,
    },
    log: { level: 'info', message: 'Server started' },
  })
  await db.put('logs', {
    system: {
      server: { id: 'server-1', region: 'us-east' },
      timestamp: 2000,
    },
    log: { level: 'error', message: 'Connection failed' },
  })
  await db.put('logs', {
    system: {
      server: { id: 'server-2', region: 'us-west' },
      timestamp: 1000,
    },
    log: { level: 'info', message: 'Server started' },
  })

  const log1 = await db.get('logs', ['server-1', 1000])
  const log2 = await db.get('logs', ['server-1', 2000])
  const log3 = await db.get('logs', ['server-2', 1000])

  expect(log1).toEqual({
    system: {
      server: { id: 'server-1', region: 'us-east' },
      timestamp: 1000,
    },
    log: { level: 'info', message: 'Server started' },
  })
  expect(log2).toEqual({
    system: {
      server: { id: 'server-1', region: 'us-east' },
      timestamp: 2000,
    },
    log: { level: 'error', message: 'Connection failed' },
  })
  expect(log3).toEqual({
    system: {
      server: { id: 'server-2', region: 'us-west' },
      timestamp: 1000,
    },
    log: { level: 'info', message: 'Server started' },
  })

  db.close()
})

test('composite primary key enforces uniqueness', async () => {
  const orderSchema = z.object({
    customerId: z.string(),
    orderId: z.string(),
    amount: z.number(),
  })

  const migrations = createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'orders',
      schema: orderSchema,
      primaryKey: ['customerId', 'orderId'],
    })
  )

  const db = await openDB('test-db', migrations)

  await db.put('orders', {
    customerId: 'customer-1',
    orderId: 'order-1',
    amount: 100,
  })

  // Overwrite with same composite key
  await db.put('orders', {
    customerId: 'customer-1',
    orderId: 'order-1',
    amount: 200,
  })

  const order = await db.get('orders', ['customer-1', 'order-1'])

  expect(order).toEqual({
    customerId: 'customer-1',
    orderId: 'order-1',
    amount: 200,
  })

  db.close()
})
