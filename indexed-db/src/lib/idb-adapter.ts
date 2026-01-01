import { openDB as openIDB } from 'idb'
import type { ExtractSchema, ToDBSchema } from './idb-adapter.types'
import { applyAction } from './migration-actions'
import type { MigrationBuilder } from './migration-builder'

export async function openDB<M extends MigrationBuilder<any, any>>(
  dbName: string,
  migrations: M
) {
  const { migrations: migrationList, finalVersion } = migrations

  return openIDB<ToDBSchema<ExtractSchema<M>>>(dbName, finalVersion, {
    async upgrade(db, oldVersion, _newVersion, tx) {
      // Apply migrations where version > oldVersion
      for (const migration of migrationList) {
        if (migration.version > oldVersion) {
          for (const action of migration.actions) {
            await applyAction(db, tx, action)
          }
        }
      }
    },
  })
}
