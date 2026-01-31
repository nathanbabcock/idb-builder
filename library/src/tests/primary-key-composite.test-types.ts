import { createMigrations } from '../lib/migration-builder'
import { schema } from '../lib/schema'

void function testCreateObjectStoreSupportsCompositePrimaryKeysFlat() {
  createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'orders',
      schema: schema<{ customerId: string; orderId: string; amount: number }>(),
      primaryKey: ['customerId', 'orderId'],
    })
  )
}

void function testCreateObjectStoreCompositePrimaryKeysAreTypeSafeFlat() {
  createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'orders',
      schema: schema<{ customerId: string; orderId: string; amount: number }>(),
      // @ts-expect-error 'nonexistent' is not a key of the value type
      primaryKey: ['customerId', 'nonexistent'],
    })
  )
}

void function testCreateObjectStoreSupportsCompositePrimaryKeysNested() {
  createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'events',
      schema: schema<{
        user: { id: string; name: string }
        event: { id: string; type: string }
        timestamp: number
      }>(),
      primaryKey: ['user.id', 'event.id'],
    })
  )
}

void function testCreateObjectStoreCompositePrimaryKeysAreTypeSafeNested() {
  createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'events',
      schema: schema<{
        user: { id: string; name: string }
        event: { id: string; type: string }
        timestamp: number
      }>(),
      // @ts-expect-error 'user.nonexistent' is not a valid nested key path
      primaryKey: ['user.id', 'user.nonexistent'],
    })
  )
}

void function testCreateObjectStoreSupportsCompositePrimaryKeysMixed() {
  createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'transactions',
      schema: schema<{
        accountId: string
        transaction: { id: string; date: string }
        amount: number
      }>(),
      primaryKey: ['accountId', 'transaction.id'],
    })
  )
}

void function testCreateObjectStoreCompositePrimaryKeysAreTypeSafeMixed() {
  createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'transactions',
      schema: schema<{
        accountId: string
        transaction: { id: string; date: string }
        amount: number
      }>(),
      // @ts-expect-error 'transaction.nonexistent' is not a valid nested key path
      primaryKey: ['accountId', 'transaction.nonexistent'],
    })
  )
}

void function testCreateObjectStoreSupportsCompositePrimaryKeysDeeplyNested() {
  createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'logs',
      schema: schema<{
        system: {
          server: { id: string; region: string }
          timestamp: number
        }
        log: { level: string; message: string }
      }>(),
      primaryKey: ['system.server.id', 'system.timestamp'],
    })
  )
}

void function testCreateObjectStoreCompositePrimaryKeysAreTypeSafeDeeplyNested() {
  createMigrations().version(1, v =>
    v.createObjectStore({
      name: 'logs',
      schema: schema<{
        system: {
          server: { id: string; region: string }
          timestamp: number
        }
        log: { level: string; message: string }
      }>(),
      // @ts-expect-error 'system.server.nonexistent' is not a valid nested key path
      primaryKey: ['system.server.id', 'system.server.nonexistent'],
    })
  )
}
