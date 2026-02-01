import { openDB as openIDB } from 'idb'
import type { ExtractSchema, ToDBSchema } from './idb-adapter.types'
import { applyAction } from './migration-actions'
import type { MigrationBuilder } from './migration-builder'

export async function openDB<M extends MigrationBuilder<any, any>>(
  dbName: string,
  migrations: M
) {
  const { migrations: migrationList, finalVersion } = migrations

  let upgradeError: unknown = null

  const dbPromise = openIDB<ToDBSchema<ExtractSchema<M>>>(
    dbName,
    finalVersion,
    {
      async upgrade(db, oldVersion, _newVersion, tx) {
        // Apply migrations where version > oldVersion
        try {
          for (const migration of migrationList) {
            if (migration.version > oldVersion) {
              for (const action of migration.actions) {
                await applyAction(db, tx, action)
              }
            }
          }
        } catch (error) {
          // Store the error so we can rethrow it after abort
          upgradeError = error
          // Abort transaction so the promise rejects
          tx.abort()
          // Catch the transaction's done promise to prevent unhandled rejection
          tx.done.catch(() => {})
        }
      },
    }
  )

  // If upgrade failed, rethrow the original error instead of AbortError
  return dbPromise.catch(abortError => {
    if (upgradeError) {
      throw upgradeError
    }
    throw abortError
  })
}
