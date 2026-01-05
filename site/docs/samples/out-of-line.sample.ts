// @errors: 2345

import { createMigrations, openDB } from '@typedex/indexed-db'
import { z } from 'zod/v4'

// ---cut---
const migrations = createMigrations().version(1, v =>
  v.createObjectStore(
    'events',
    z.object({ name: z.string(), timestamp: z.date() }),
    { autoIncrement: true }
  )
)

const db = await openDB('test-db', migrations)

// Correct: get() with number key (autoIncrement generates numbers)
await db.get('events', 42)

// Incorrect: get() with non-number key
await db.get('events', 'not-a-number')
