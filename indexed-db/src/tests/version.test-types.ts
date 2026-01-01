import { z } from 'zod'
import { createMigrations } from '../lib/migration-builder'

void function testFirstVersionCanBeAnyNumber() {
  // First version can be 1
  createMigrations().version(1, v =>
    v.createObjectStore('users', z.object({ id: z.string() }))
  )

  // First version can be 0
  createMigrations().version(0, v =>
    v.createObjectStore('users', z.object({ id: z.string() }))
  )

  // First version can be negative
  createMigrations().version(-5, v =>
    v.createObjectStore('users', z.object({ id: z.string() }))
  )

  // First version can be a large number
  createMigrations().version(1000, v =>
    v.createObjectStore('users', z.object({ id: z.string() }))
  )
}

void function testSuccessiveVersionsMustBeGreater() {
  // Valid: 1 -> 2 -> 3
  createMigrations()
    .version(1, v => v.createObjectStore('users', z.object({ id: z.string() })))
    .version(2, v => v.createObjectStore('posts', z.object({ id: z.string() })))
    .version(3, v =>
      v.createObjectStore('comments', z.object({ id: z.string() }))
    )

  // Valid: large gaps are allowed
  createMigrations()
    .version(1, v => v.createObjectStore('users', z.object({ id: z.string() })))
    .version(100, v =>
      v.createObjectStore('posts', z.object({ id: z.string() }))
    )
    .version(1000, v =>
      v.createObjectStore('comments', z.object({ id: z.string() }))
    )

  // Valid: starting from negative and going up
  createMigrations()
    .version(-10, v =>
      v.createObjectStore('users', z.object({ id: z.string() }))
    )
    .version(-5, v =>
      v.createObjectStore('posts', z.object({ id: z.string() }))
    )
    .version(0, v =>
      v.createObjectStore('comments', z.object({ id: z.string() }))
    )
    .version(1, v => v.createObjectStore('tags', z.object({ id: z.string() })))
}

void function testInvalidVersionSameAsPrevious() {
  createMigrations()
    .version(1, v => v.createObjectStore('users', z.object({ id: z.string() })))
    // @ts-expect-error Version 1 must be greater than previous version 1
    .version(1, v => v.createObjectStore('posts', z.object({ id: z.string() })))
}

void function testInvalidVersionLessThanPrevious() {
  createMigrations()
    .version(5, v => v.createObjectStore('users', z.object({ id: z.string() })))
    // @ts-expect-error Version 3 must be greater than previous version 5
    .version(3, v => v.createObjectStore('posts', z.object({ id: z.string() })))
}

void function testInvalidVersionNegativeWhenPreviousPositive() {
  createMigrations()
    .version(1, v => v.createObjectStore('users', z.object({ id: z.string() })))
    // @ts-expect-error Version -5 must be greater than previous version 1
    .version(-5, v =>
      v.createObjectStore('posts', z.object({ id: z.string() }))
    )
}

void function testInvalidVersionZeroWhenPreviousPositive() {
  createMigrations()
    .version(1, v => v.createObjectStore('users', z.object({ id: z.string() })))
    // @ts-expect-error Version 0 must be greater than previous version 1
    .version(0, v => v.createObjectStore('posts', z.object({ id: z.string() })))
}
