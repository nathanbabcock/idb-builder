/**
 * WPT Test Suite Setup
 *
 * Shared setup for Web Platform Tests ported to vitest.
 * Uses fake-indexeddb to provide IndexedDB implementation.
 *
 * @see https://github.com/web-platform-tests/wpt/blob/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB/
 */

import { IDBFactory } from 'fake-indexeddb'
import { beforeEach } from 'vitest'

import 'fake-indexeddb/auto'

// Reset IndexedDB before each test to ensure isolation
beforeEach(() => {
  indexedDB = new IDBFactory()
})
