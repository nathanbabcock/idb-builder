import { createMigrations } from '../lib/migration-builder'
import { schema } from '../lib/schema'

void function testFirstVersionMustBePositive() {
  // First version can be 1
  createMigrations().version(1, v =>
    v.createObjectStore({ name: 'users', schema: schema<{ id: string }>() })
  )

  // First version can be a large number
  createMigrations().version(1000, v =>
    v.createObjectStore({ name: 'users', schema: schema<{ id: string }>() })
  )

  // @ts-expect-error First version cannot be 0
  createMigrations().version(0, v =>
    v.createObjectStore({ name: 'users', schema: schema<{ id: string }>() })
  )

  // @ts-expect-error First version cannot be negative
  createMigrations().version(-5, v =>
    v.createObjectStore({ name: 'users', schema: schema<{ id: string }>() })
  )
}

void function testSuccessiveVersionsMustBeGreater() {
  // Valid: 1 -> 2 -> 3
  createMigrations()
    .version(1, v =>
      v.createObjectStore({ name: 'users', schema: schema<{ id: string }>() })
    )
    .version(2, v =>
      v.createObjectStore({ name: 'posts', schema: schema<{ id: string }>() })
    )
    .version(3, v =>
      v.createObjectStore({
        name: 'comments',
        schema: schema<{ id: string }>(),
      })
    )

  // Valid: large gaps are allowed
  createMigrations()
    .version(1, v =>
      v.createObjectStore({ name: 'users', schema: schema<{ id: string }>() })
    )
    .version(100, v =>
      v.createObjectStore({ name: 'posts', schema: schema<{ id: string }>() })
    )
    .version(1000, v =>
      v.createObjectStore({
        name: 'comments',
        schema: schema<{ id: string }>(),
      })
    )
}

void function testInvalidVersionSameAsPrevious() {
  createMigrations()
    .version(1, v =>
      v.createObjectStore({ name: 'users', schema: schema<{ id: string }>() })
    )
    // @ts-expect-error Version 1 must be greater than previous version 1
    .version(1, v =>
      v.createObjectStore({ name: 'posts', schema: schema<{ id: string }>() })
    )
}

void function testInvalidVersionLessThanPrevious() {
  createMigrations()
    .version(5, v =>
      v.createObjectStore({ name: 'users', schema: schema<{ id: string }>() })
    )
    // @ts-expect-error Version 3 must be greater than previous version 5
    .version(3, v =>
      v.createObjectStore({ name: 'posts', schema: schema<{ id: string }>() })
    )
}

void function testInvalidVersionNegativeWhenPreviousPositive() {
  createMigrations()
    .version(1, v =>
      v.createObjectStore({ name: 'users', schema: schema<{ id: string }>() })
    )
    // @ts-expect-error Version -5 must be greater than previous version 1
    .version(-5, v =>
      v.createObjectStore({ name: 'posts', schema: schema<{ id: string }>() })
    )
}

void function testInvalidVersionZeroWhenPreviousPositive() {
  createMigrations()
    .version(1, v =>
      v.createObjectStore({ name: 'users', schema: schema<{ id: string }>() })
    )
    // @ts-expect-error Version 0 must be greater than previous version 1
    .version(0, v =>
      v.createObjectStore({ name: 'posts', schema: schema<{ id: string }>() })
    )
}
