// @errors: 2345

import { createMigrations, openDB, schema } from 'idb-migrate'

// ---cut---
const migrations = createMigrations().version(1, v =>
  v.createObjectStore({
    name: 'events',
    schema: schema<{ name: string; timestamp: Date }>(),
    autoIncrement: true,
  })
)

const db = await openDB('test-db', migrations)

// Correct: get() with number key (autoIncrement generates numbers)
await db.get('events', 42)

// Incorrect: get() with non-number key
await db.get('events', 'not-a-number')
