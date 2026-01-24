import z from 'zod'
import { createMigrations } from '../lib/migration-builder'
import type { InferSchema } from '../lib/migration-builder.types'

void function testInferSchemaPreservesDiscriminatedUnions() {
  const migrations = createMigrations()
    .version(1, v =>
      v.createObjectStore({
        name: 'files',
        schema: z.discriminatedUnion('type', [
          z.object({
            id: z.string(),
            type: z.literal('local'),
            name: z.string(),
            path: z.string(),
          }),
          z.object({
            id: z.string(),
            type: z.literal('remote'),
            name: z.string(),
            url: z.string(),
          }),
        ]),
      })
    )
    // updateSchema deep-merges into each variant of the discriminated union
    .version(2, v => v.updateSchema<'files', { timestamp?: Date }>())

  type Schema = InferSchema<typeof migrations>

  // Test that discriminated union structure is preserved
  type FileType = Schema['files']

  // Should accept local file with path
  const localFile: FileType = {
    id: 'file-1',
    type: 'local',
    name: 'test.txt',
    path: '/path/to/file',
    timestamp: new Date(),
  }

  // Should accept remote file with url
  const remoteFile: FileType = {
    id: 'file-2',
    type: 'remote',
    name: 'test.txt',
    url: 'https://example.com/file.txt',
    timestamp: new Date(),
  }

  // Both should satisfy the schema
  void ({ files: localFile } satisfies Schema)
  void ({ files: remoteFile } satisfies Schema)

  // Hybrid file with both url and path should not be allowed
  void ({
    files: {
      id: 'file-3',
      type: 'remote',
      name: 'test.txt',
      url: 'https://example.com/file.txt',
      // @ts-expect-error - 'path' should not exist on remote type
      path: '/path/to/file',
      timestamp: new Date(),
    },
  } satisfies Schema)
}
