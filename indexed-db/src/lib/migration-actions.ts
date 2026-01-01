import type { IDBPDatabase, IDBPTransaction } from 'idb'
import type { MigrationAction } from './migration-actions.types'

export async function applyAction(
  db: IDBPDatabase<any>,
  tx: IDBPTransaction<any, any, 'versionchange'>,
  action: MigrationAction
): Promise<void> {
  const { action: type } = action
  switch (type) {
    case 'create-object-store': {
      const { storeName, keyPath, autoIncrement } = action
      const options: IDBObjectStoreParameters = {}
      if (keyPath !== undefined) {
        // widen from readonly string[] to string[]
        options.keyPath = keyPath as string | string[]
      }
      if (autoIncrement !== undefined) {
        options.autoIncrement = autoIncrement
      }
      db.createObjectStore(storeName, options)
      break
    }

    case 'delete-object-store': {
      const { storeName } = action
      db.deleteObjectStore(storeName)
      break
    }

    case 'transform-object-store': {
      const { storeName, transform } = action
      const store = tx.objectStore(storeName)
      let cursor = await store.openCursor()

      while (cursor) {
        const newValue = transform(cursor.value)
        await cursor.update(newValue)
        cursor = await cursor.continue()
      }
      break
    }

    case 'create-index': {
      const { storeName, indexName, keyPath, multiEntry, unique } = action
      const store = tx.objectStore(storeName)
      // widen from readonly string[] to string[]
      store.createIndex(indexName, keyPath as string | string[], {
        multiEntry,
        unique,
      })
      break
    }

    case 'delete-index': {
      const { storeName, indexName } = action
      const store = tx.objectStore(storeName)
      store.deleteIndex(indexName)
      break
    }

    default:
      throw new Error(
        `unhandled migration action type: ${type satisfies never as string}`
      )
  }
}
