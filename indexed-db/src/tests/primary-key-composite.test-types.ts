import z from 'zod'
import { createMigrations } from '../lib/migration-builder'

void function testCreateObjectStoreSupportsCompositePrimaryKeysFlat() {
  createMigrations().version(1, v =>
    v.createObjectStore(
      'orders',
      z.object({
        customerId: z.string(),
        orderId: z.string(),
        amount: z.number(),
      }),
      { primaryKey: ['customerId', 'orderId'] }
    )
  )
}

void function testCreateObjectStoreCompositePrimaryKeysAreTypeSafeFlat() {
  createMigrations().version(1, v =>
    // @ts-expect-error 'nonexistent' is not a key of the value type
    v.createObjectStore(
      'orders',
      z.object({
        customerId: z.string(),
        orderId: z.string(),
        amount: z.number(),
      }),
      {
        primaryKey: ['customerId', 'nonexistent'],
      }
    )
  )
}

void function testCreateObjectStoreSupportsCompositePrimaryKeysNested() {
  createMigrations().version(1, v =>
    v.createObjectStore(
      'events',
      z.object({
        user: z.object({
          id: z.string(),
          name: z.string(),
        }),
        event: z.object({
          id: z.string(),
          type: z.string(),
        }),
        timestamp: z.number(),
      }),
      { primaryKey: ['user.id', 'event.id'] }
    )
  )
}

void function testCreateObjectStoreCompositePrimaryKeysAreTypeSafeNested() {
  createMigrations().version(1, v =>
    // @ts-expect-error 'user.nonexistent' is not a valid nested key path
    v.createObjectStore(
      'events',
      z.object({
        user: z.object({
          id: z.string(),
          name: z.string(),
        }),
        event: z.object({
          id: z.string(),
          type: z.string(),
        }),
        timestamp: z.number(),
      }),
      {
        primaryKey: ['user.id', 'user.nonexistent'],
      }
    )
  )
}

void function testCreateObjectStoreSupportsCompositePrimaryKeysMixed() {
  createMigrations().version(1, v =>
    v.createObjectStore(
      'transactions',
      z.object({
        accountId: z.string(),
        transaction: z.object({
          id: z.string(),
          date: z.string(),
        }),
        amount: z.number(),
      }),
      { primaryKey: ['accountId', 'transaction.id'] }
    )
  )
}

void function testCreateObjectStoreCompositePrimaryKeysAreTypeSafeMixed() {
  createMigrations().version(1, v =>
    // @ts-expect-error 'transaction.nonexistent' is not a valid nested key path
    v.createObjectStore(
      'transactions',
      z.object({
        accountId: z.string(),
        transaction: z.object({
          id: z.string(),
          date: z.string(),
        }),
        amount: z.number(),
      }),
      {
        primaryKey: ['accountId', 'transaction.nonexistent'],
      }
    )
  )
}

void function testCreateObjectStoreSupportsCompositePrimaryKeysDeeplyNested() {
  createMigrations().version(1, v =>
    v.createObjectStore(
      'logs',
      z.object({
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
      }),
      { primaryKey: ['system.server.id', 'system.timestamp'] }
    )
  )
}

void function testCreateObjectStoreCompositePrimaryKeysAreTypeSafeDeeplyNested() {
  createMigrations().version(1, v =>
    // @ts-expect-error 'system.server.nonexistent' is not a valid nested key path
    v.createObjectStore(
      'logs',
      z.object({
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
      }),
      {
        primaryKey: ['system.server.id', 'system.server.nonexistent'],
      }
    )
  )
}
