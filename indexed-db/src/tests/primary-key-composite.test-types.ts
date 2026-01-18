import z from 'zod'
import { createMigrations } from '../lib/migration-builder'

void function testCreateObjectStoreSupportsCompositePrimaryKeysFlat() {
  createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'orders',
      schema: z.object({
        customerId: z.string(),
        orderId: z.string(),
        amount: z.number(),
      }),
      primaryKey: ['customerId', 'orderId'],
    })
  )
}

void function testCreateObjectStoreCompositePrimaryKeysAreTypeSafeFlat() {
  createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'orders',
      schema: z.object({
        customerId: z.string(),
        orderId: z.string(),
        amount: z.number(),
      }),
      // @ts-expect-error 'nonexistent' is not a key of the value type
      primaryKey: ['customerId', 'nonexistent'],
    })
  )
}

void function testCreateObjectStoreSupportsCompositePrimaryKeysNested() {
  createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'events',
      schema: z.object({
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
      primaryKey: ['user.id', 'event.id'],
    })
  )
}

void function testCreateObjectStoreCompositePrimaryKeysAreTypeSafeNested() {
  createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'events',
      schema: z.object({
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
      // @ts-expect-error 'user.nonexistent' is not a valid nested key path
      primaryKey: ['user.id', 'user.nonexistent'],
    })
  )
}

void function testCreateObjectStoreSupportsCompositePrimaryKeysMixed() {
  createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'transactions',
      schema: z.object({
        accountId: z.string(),
        transaction: z.object({
          id: z.string(),
          date: z.string(),
        }),
        amount: z.number(),
      }),
      primaryKey: ['accountId', 'transaction.id'],
    })
  )
}

void function testCreateObjectStoreCompositePrimaryKeysAreTypeSafeMixed() {
  createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'transactions',
      schema: z.object({
        accountId: z.string(),
        transaction: z.object({
          id: z.string(),
          date: z.string(),
        }),
        amount: z.number(),
      }),
      // @ts-expect-error 'transaction.nonexistent' is not a valid nested key path
      primaryKey: ['accountId', 'transaction.nonexistent'],
    })
  )
}

void function testCreateObjectStoreSupportsCompositePrimaryKeysDeeplyNested() {
  createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'logs',
      schema: z.object({
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
      primaryKey: ['system.server.id', 'system.timestamp'],
    })
  )
}

void function testCreateObjectStoreCompositePrimaryKeysAreTypeSafeDeeplyNested() {
  createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'logs',
      schema: z.object({
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
      // @ts-expect-error 'system.server.nonexistent' is not a valid nested key path
      primaryKey: ['system.server.id', 'system.server.nonexistent'],
    })
  )
}
