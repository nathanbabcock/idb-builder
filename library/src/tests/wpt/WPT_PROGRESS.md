# WPT IndexedDB Test Suite - Migration Progress

**WPT Commit:** [`9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f`](https://github.com/web-platform-tests/wpt/tree/9fb0c34afd20d2cd5ea73cd50e2400a0c5b3159f/IndexedDB)

**Status:** 61 of 163 files ported

## Legend

| Status | Meaning                                     |
| :----: | ------------------------------------------- |
|   ✅   | Ported                                      |
|   ⏳   | TODO - applicable to wrapper, can be ported |
|   ➖   | Skipped - not applicable to wrapper library |

## All WPT Test Files

| Status | WPT File                                                      | Notes                                                              |
| :----: | ------------------------------------------------------------- | ------------------------------------------------------------------ |
|   ✅   | `cursor-overloads.any.js`                                     |                                                                    |
|   ✅   | `delete-range.any.js`                                         |                                                                    |
|   ✅   | `get-databases.any.js`                                        |                                                                    |
|   ✅   | `idb-binary-key-roundtrip.any.js`                             |                                                                    |
|   ✅   | `idb-explicit-commit.any.js`                                  |                                                                    |
|   ✅   | `idbcursor-advance.any.js`                                    |                                                                    |
|   ✅   | `idbcursor-continue.any.js`                                   |                                                                    |
|   ✅   | `idbcursor-continuePrimaryKey.any.js`                         | 2 tests skipped - wrapper doesn't expose continuePrimaryKey        |
|   ✅   | `idbcursor-direction.any.js`                                  |                                                                    |
|   ✅   | `idbcursor-key.any.js`                                        |                                                                    |
|   ✅   | `idbcursor-primarykey.any.js`                                 |                                                                    |
|   ✅   | `idbcursor-reused.any.js`                                     |                                                                    |
|   ✅   | `idbcursor-source.any.js`                                     |                                                                    |
|   ✅   | `idbcursor_advance_index.any.js`                              |                                                                    |
|   ✅   | `idbcursor_advance_objectstore.any.js`                        |                                                                    |
|   ✅   | `idbcursor_continue_index.any.js`                             |                                                                    |
|   ✅   | `idbcursor_continue_objectstore.any.js`                       |                                                                    |
|   ✅   | `idbcursor_delete_index.any.js`                               |                                                                    |
|   ✅   | `idbcursor_delete_objectstore.any.js`                         |                                                                    |
|   ✅   | `idbcursor_iterating.any.js`                                  |                                                                    |
|   ✅   | `idbcursor_update_index.any.js`                               |                                                                    |
|   ✅   | `idbcursor_update_objectstore.any.js`                         |                                                                    |
|   ✅   | `idbdatabase_createObjectStore.any.js`                        | 2 tests skipped - wrapper only allows store creation in migrations |
|   ✅   | `idbdatabase_deleteObjectStore.any.js`                        |                                                                    |
|   ✅   | `idbdatabase_transaction.any.js`                              |                                                                    |
|   ➖   | `idbfactory_cmp.any.js`                                       | Tests IDBFactory.cmp() - not part of wrapper                       |
|   ✅   | `idbfactory_open.any.js`                                      |                                                                    |
|   ✅   | `idbindex-multientry.any.js`                                  |                                                                    |
|   ✅   | `idbindex_count.any.js`                                       |                                                                    |
|   ✅   | `idbindex_get.any.js`                                         |                                                                    |
|   ✅   | `idbindex_getAll.any.js`                                      |                                                                    |
|   ✅   | `idbindex_getAllKeys.any.js`                                  |                                                                    |
|   ✅   | `idbindex_getKey.any.js`                                      |                                                                    |
|   ✅   | `idbindex_openCursor.any.js`                                  |                                                                    |
|   ✅   | `idbindex_openKeyCursor.any.js`                               |                                                                    |
|   ➖   | `idbkeyrange-includes.any.js`                                 | Tests IDBKeyRange - not part of wrapper                            |
|   ➖   | `idbkeyrange.any.js`                                          | Tests IDBKeyRange - not part of wrapper                            |
|   ✅   | `idbobjectstore_add.any.js`                                   | 1 test skipped - wrapper doesn't expose deleted stores             |
|   ✅   | `idbobjectstore_clear.any.js`                                 | 1 test skipped - wrapper doesn't expose deleted stores             |
|   ✅   | `idbobjectstore_count.any.js`                                 | 1 test skipped - wrapper doesn't expose deleted stores             |
|   ✅   | `idbobjectstore_createIndex.any.js`                           | 6 tests skipped - event ordering tests                             |
|   ✅   | `idbobjectstore_delete.any.js`                                | 1 test skipped - wrapper doesn't expose deleted stores             |
|   ✅   | `idbobjectstore_deleteIndex.any.js`                           |                                                                    |
|   ✅   | `idbobjectstore_get.any.js`                                   |                                                                    |
|   ✅   | `idbobjectstore_getAll.any.js`                                |                                                                    |
|   ✅   | `idbobjectstore_getAllKeys.any.js`                            |                                                                    |
|   ✅   | `idbobjectstore_getKey.any.js`                                |                                                                    |
|   ✅   | `idbobjectstore_openCursor.any.js`                            |                                                                    |
|   ✅   | `idbobjectstore_openKeyCursor.any.js`                         |                                                                    |
|   ✅   | `idbobjectstore_put.any.js`                                   | 1 test skipped - wrapper doesn't expose deleted stores             |
|   ✅   | `idbtransaction-oncomplete.any.js`                            |                                                                    |
|   ✅   | `idbtransaction_abort.any.js`                                 |                                                                    |
|   ✅   | `idbtransaction_objectStoreNames.any.js`                      |                                                                    |
|   ✅   | `index_sort_order.any.js`                                     |                                                                    |
|   ✅   | `key_invalid.any.js`                                          | 1 test skipped - fake-indexeddb doesn't detect proxy arrays        |
|   ✅   | `key_valid.any.js`                                            |                                                                    |
|   ✅   | `keygenerator.any.js`                                         |                                                                    |
|   ✅   | `keyorder.any.js`                                             |                                                                    |
|   ✅   | `keypath.any.js`                                              |                                                                    |
|   ➖   | `list_ordering.any.js`                                        | Tests DOMStringList ordering - not part of wrapper                 |
|   ✅   | `objectstore_keyorder.any.js`                                 |                                                                    |
|   ✅   | `reading-autoincrement-indexes.any.js`                        |                                                                    |
|   ✅   | `structured-clone.any.js`                                     | 1 test skipped - fake-indexeddb bug with NaN                       |
|   ✅   | `value.any.js`                                                |                                                                    |
|   ✅   | `value_recursive.any.js`                                      |                                                                    |
|   ⏳   | `idbcursor-advance-invalid.any.js`                            | Tests invalid advance arguments                                    |
|   ⏳   | `idbcursor-direction-index-keyrange.any.js`                   | Cursor direction with keyrange on index                            |
|   ⏳   | `idbcursor-direction-index.any.js`                            | Cursor direction on index                                          |
|   ⏳   | `idbcursor-direction-objectstore-keyrange.any.js`             | Cursor direction with keyrange                                     |
|   ⏳   | `idbcursor-direction-objectstore.any.js`                      | Cursor direction on objectstore                                    |
|   ⏳   | `idbcursor-iterating-update.any.js`                           | Update while iterating                                             |
|   ⏳   | `idbcursor_continue_delete_objectstore.any.js`                | Continue after delete                                              |
|   ⏳   | `idbcursor_continue_invalid.any.js`                           | Invalid continue handling                                          |
|   ⏳   | `idbfactory_deleteDatabase.any.js`                            | Database deletion                                                  |
|   ⏳   | `idbindex-getAll-enforcerange.any.js`                         | getAll range enforcement                                           |
|   ⏳   | `idbindex-getAllKeys-enforcerange.any.js`                     | getAllKeys range enforcement                                       |
|   ⏳   | `idbindex_getAll-options.any.js`                              | getAll with options                                                |
|   ⏳   | `idbindex_getAllKeys-options.any.js`                          | getAllKeys with options                                            |
|   ⏳   | `idbindex_indexNames.any.js`                                  | indexNames property                                                |
|   ⏳   | `idbindex_keyPath.any.js`                                     | keyPath property                                                   |
|   ⏳   | `idbindex_reverse_cursor.any.js`                              | Reverse cursor tests                                               |
|   ⏳   | `idbkeyrange_incorrect.any.js`                                | Incorrect keyrange handling                                        |
|   ⏳   | `idbobjectstore-getAll-enforcerange.any.js`                   | getAll range enforcement                                           |
|   ⏳   | `idbobjectstore-getAllKeys-enforcerange.any.js`               | getAllKeys range enforcement                                       |
|   ⏳   | `idbobjectstore_getAll-options.any.js`                        | getAll with options                                                |
|   ⏳   | `idbobjectstore_getAllKeys-options.any.js`                    | getAllKeys with options                                            |
|   ⏳   | `idbobjectstore_index.any.js`                                 | Index access tests                                                 |
|   ⏳   | `idbobjectstore_keyPath.any.js`                               | keyPath property                                                   |
|   ⏳   | `idbobjectstore_openCursor_invalid.any.js`                    | Invalid openCursor handling                                        |
|   ⏳   | `idbtransaction.any.js`                                       | Transaction properties                                             |
|   ⏳   | `key-conversion-exceptions.any.js`                            | Key conversion exceptions                                          |
|   ⏳   | `keypath-exceptions.any.js`                                   | Keypath exceptions                                                 |
|   ⏳   | `keypath-special-identifiers.any.js`                          | Special keypath identifiers                                        |
|   ⏳   | `keypath_invalid.any.js`                                      | Invalid keypath handling                                           |
|   ⏳   | `name-scopes.any.js`                                          | Name scoping tests                                                 |
|   ⏳   | `reading-autoincrement-indexes-cursors.any.js`                | Autoincrement with cursors                                         |
|   ⏳   | `reading-autoincrement-store-cursors.any.js`                  | Autoincrement store cursors                                        |
|   ⏳   | `reading-autoincrement-store.any.js`                          | Autoincrement stores                                               |
|   ⏳   | `string-list-ordering.any.js`                                 | String list ordering                                               |
|   ⏳   | `transaction-relaxed-durability.any.js`                       | Durability option                                                  |
|   ➖   | `abort-in-initial-upgradeneeded.any.js`                       | Raw IDB API - upgrade abort handling                               |
|   ➖   | `bindings-inject-keys-bypass.any.js`                          | Internal binding tests                                             |
|   ➖   | `bindings-inject-values-bypass.any.js`                        | Internal binding tests                                             |
|   ➖   | `blob-composite-blob-reads.any.js`                            | Requires browser Blob API                                          |
|   ➖   | `blob-contenttype.any.js`                                     | Requires browser Blob API                                          |
|   ➖   | `blob-delete-objectstore-db.any.js`                           | Requires browser Blob API                                          |
|   ➖   | `blob-valid-after-abort.any.js`                               | Requires browser Blob API                                          |
|   ➖   | `blob-valid-after-deletion.any.js`                            | Requires browser Blob API                                          |
|   ➖   | `blob-valid-before-commit.any.js`                             | Requires browser Blob API                                          |
|   ➖   | `clone-before-keypath-eval.any.js`                            | Clone ordering internals                                           |
|   ➖   | `close-in-upgradeneeded.any.js`                               | Raw IDB API - upgrade handling                                     |
|   ➖   | `delete-request-queue.any.js`                                 | Request queue internals                                            |
|   ➖   | `error-attributes.any.js`                                     | Error object internals                                             |
|   ➖   | `event-dispatch-active-flag.any.js`                           | Event dispatch internals                                           |
|   ➖   | `fire-error-event-exception.any.js`                           | Exception in event handlers                                        |
|   ➖   | `fire-success-event-exception.any.js`                         | Exception in event handlers                                        |
|   ➖   | `fire-upgradeneeded-event-exception.any.js`                   | Exception in event handlers                                        |
|   ➖   | `globalscope-indexedDB-SameObject.any.js`                     | SameObject identity                                                |
|   ➖   | `historical.any.js`                                           | Deprecated API tests                                               |
|   ➖   | `idb-binary-key-detached.any.js`                              | Detached ArrayBuffer internals                                     |
|   ➖   | `idb-explicit-commit-throw.any.js`                            | Throw in commit handler                                            |
|   ➖   | `idb_binary_key_conversion.any.js`                            | Binary key conversion internals                                    |
|   ➖   | `idbcursor-advance-continue-async.any.js`                     | Async cursor timing                                                |
|   ➖   | `idbcursor-advance-exception-order.any.js`                    | Exception ordering                                                 |
|   ➖   | `idbcursor-continue-exception-order.any.js`                   | Exception ordering                                                 |
|   ➖   | `idbcursor-continuePrimaryKey-exception-order.any.js`         | Exception ordering                                                 |
|   ➖   | `idbcursor-continuePrimaryKey-exceptions.any.js`              | continuePrimaryKey not exposed                                     |
|   ➖   | `idbcursor-delete-exception-order.any.js`                     | Exception ordering                                                 |
|   ➖   | `idbcursor-request-source.any.js`                             | Request source internals                                           |
|   ➖   | `idbcursor-request.any.js`                                    | Request property internals                                         |
|   ➖   | `idbcursor-update-exception-order.any.js`                     | Exception ordering                                                 |
|   ➖   | `idbdatabase-createObjectStore-exception-order.any.js`        | Exception ordering                                                 |
|   ➖   | `idbdatabase-deleteObjectStore-exception-order.any.js`        | Exception ordering                                                 |
|   ➖   | `idbdatabase-transaction-exception-order.any.js`              | Exception ordering                                                 |
|   ➖   | `idbdatabase_close.any.js`                                    | Close with versionchange handling                                  |
|   ➖   | `idbfactory-deleteDatabase-request-success.any.js`            | Delete request internals                                           |
|   ➖   | `idbfactory-open-error-properties.any.js`                     | Open error internals                                               |
|   ➖   | `idbfactory-open-request-error.any.js`                        | Open request internals                                             |
|   ➖   | `idbfactory-open-request-success.any.js`                      | Open request internals                                             |
|   ➖   | `idbindex-objectStore-SameObject.any.js`                      | SameObject identity                                                |
|   ➖   | `idbindex-query-exception-order.any.js`                       | Exception ordering                                                 |
|   ➖   | `idbindex-rename-abort.any.js`                                | Rename not in wrapper API                                          |
|   ➖   | `idbindex-rename-errors.any.js`                               | Rename not in wrapper API                                          |
|   ➖   | `idbindex-rename.any.js`                                      | Rename not in wrapper API                                          |
|   ➖   | `idbindex-request-source.any.js`                              | Request source internals                                           |
|   ➖   | `idbindex_getAllRecords.any.js`                               | getAllRecords API not in wrapper                                   |
|   ➖   | `idbindex_tombstones.any.js`                                  | Tombstone handling internals                                       |
|   ➖   | `idbobjectstore-add-put-exception-order.any.js`               | Exception ordering                                                 |
|   ➖   | `idbobjectstore-clear-exception-order.any.js`                 | Exception ordering                                                 |
|   ➖   | `idbobjectstore-delete-exception-order.any.js`                | Exception ordering                                                 |
|   ➖   | `idbobjectstore-deleteIndex-exception-order.any.js`           | Exception ordering                                                 |
|   ➖   | `idbobjectstore-index-finished.any.js`                        | Finished transaction internals                                     |
|   ➖   | `idbobjectstore-query-exception-order.any.js`                 | Exception ordering                                                 |
|   ➖   | `idbobjectstore-rename-abort.any.js`                          | Rename not in wrapper API                                          |
|   ➖   | `idbobjectstore-rename-errors.any.js`                         | Rename not in wrapper API                                          |
|   ➖   | `idbobjectstore-rename-store.any.js`                          | Rename not in wrapper API                                          |
|   ➖   | `idbobjectstore-request-source.any.js`                        | Request source internals                                           |
|   ➖   | `idbobjectstore-transaction-SameObject.any.js`                | SameObject identity                                                |
|   ➖   | `idbobjectstore_getAllRecords.any.js`                         | getAllRecords API not in wrapper                                   |
|   ➖   | `idbrequest-onupgradeneeded.any.js`                           | Upgrade request internals                                          |
|   ➖   | `idbrequest_error.any.js`                                     | Request error internals                                            |
|   ➖   | `idbrequest_result.any.js`                                    | Request result internals                                           |
|   ➖   | `idbtransaction-db-SameObject.any.js`                         | SameObject identity                                                |
|   ➖   | `idbtransaction-objectStore-exception-order.any.js`           | Exception ordering                                                 |
|   ➖   | `idbtransaction-objectStore-finished.any.js`                  | Finished transaction internals                                     |
|   ➖   | `keypath_maxsize.any.js`                                      | Keypath max size internals                                         |
|   ➖   | `large-requests-abort.any.js`                                 | Large request abort internals                                      |
|   ➖   | `nested-cloning-basic.any.js`                                 | Requires browser Blob API                                          |
|   ➖   | `nested-cloning-large-multiple.any.js`                        | Requires browser Blob API                                          |
|   ➖   | `nested-cloning-large.any.js`                                 | Requires browser Blob API                                          |
|   ➖   | `nested-cloning-small.any.js`                                 | Requires browser Blob API                                          |
|   ➖   | `open-request-queue.any.js`                                   | Request queue internals                                            |
|   ➖   | `parallel-cursors-upgrade.any.js`                             | Parallel cursor upgrade internals                                  |
|   ➖   | `request-abort-ordering.any.js`                               | Abort ordering internals                                           |
|   ➖   | `request-event-ordering-large-mixed-with-small-values.any.js` | Event ordering internals                                           |
|   ➖   | `request-event-ordering-large-then-small-values.any.js`       | Event ordering internals                                           |
|   ➖   | `request-event-ordering-large-values.any.js`                  | Event ordering internals                                           |
|   ➖   | `request-event-ordering-small-values.any.js`                  | Event ordering internals                                           |
|   ➖   | `request_bubble-and-capture.any.js`                           | Event bubbling internals                                           |
|   ➖   | `storage-buckets.https.any.js`                                | Storage buckets API not supported                                  |
|   ➖   | `structured-clone-transaction-state.any.js`                   | Clone transaction state internals                                  |
|   ➖   | `transaction-abort-generator-revert.any.js`                   | Abort revert internals                                             |
|   ➖   | `transaction-abort-index-metadata-revert.any.js`              | Abort revert internals                                             |
|   ➖   | `transaction-abort-multiple-metadata-revert.any.js`           | Abort revert internals                                             |
|   ➖   | `transaction-abort-object-store-metadata-revert.any.js`       | Abort revert internals                                             |
|   ➖   | `transaction-abort-request-error.any.js`                      | Abort error internals                                              |
|   ➖   | `transaction-create_in_versionchange.any.js`                  | Raw IDB API required                                               |
|   ➖   | `transaction-deactivation-timing.any.js`                      | Timing internals                                                   |
|   ➖   | `transaction-lifetime-empty.any.js`                           | Lifetime internals                                                 |
|   ➖   | `transaction-lifetime.any.js`                                 | Lifetime internals                                                 |
|   ➖   | `transaction-requestqueue.any.js`                             | Request queue internals                                            |
|   ➖   | `transaction-scheduling-across-connections.any.js`            | Scheduling internals                                               |
|   ➖   | `transaction-scheduling-across-databases.any.js`              | Scheduling internals                                               |
|   ➖   | `transaction-scheduling-mixed-scopes.any.js`                  | Scheduling internals                                               |
|   ➖   | `transaction-scheduling-ordering.any.js`                      | Scheduling internals                                               |
|   ➖   | `transaction-scheduling-ro-waits-for-rw.any.js`               | Scheduling internals                                               |
|   ➖   | `transaction-scheduling-rw-scopes.any.js`                     | Scheduling internals                                               |
|   ➖   | `transaction-scheduling-within-database.any.js`               | Scheduling internals                                               |
|   ➖   | `transaction_bubble-and-capture.any.js`                       | Event bubbling internals                                           |
|   ➖   | `upgrade-transaction-deactivation-timing.any.js`              | Timing internals                                                   |
|   ➖   | `upgrade-transaction-lifecycle-backend-aborted.any.js`        | Upgrade lifecycle internals                                        |
|   ➖   | `upgrade-transaction-lifecycle-committed.any.js`              | Upgrade lifecycle internals                                        |
|   ➖   | `upgrade-transaction-lifecycle-user-aborted.any.js`           | Upgrade lifecycle internals                                        |
|   ➖   | `writer-starvation.any.js`                                    | Starvation internals                                               |

## Summary

| Category   |   Count |
| ---------- | ------: |
| ✅ Ported  |      61 |
| ⏳ TODO    |      36 |
| ➖ Skipped |      66 |
| **Total**  | **163** |

## Why Tests Are Skipped

| Category                | Reason                                                   |
| ----------------------- | -------------------------------------------------------- |
| **Blob tests**          | Require browser Blob API not available in fake-indexeddb |
| **Exception ordering**  | Test specific exception throw order, internal to IDB     |
| **SameObject identity** | Test object identity which wrapper abstracts             |
| **Rename tests**        | Wrapper doesn't expose rename APIs                       |
| **Request internals**   | Test IDBRequest properties abstracted by wrapper         |
| **Timing/scheduling**   | Test implementation-specific timing behavior             |
| **Event bubbling**      | Test DOM event propagation internals                     |
| **Upgrade lifecycle**   | Require raw IDB API for upgrade transaction control      |

## Running Tests

```bash
# Run all tests
pnpm --filter @typedex/indexed-db test

# Run only WPT tests
pnpm --filter @typedex/indexed-db test -- --run src/tests/wpt/

# Run specific test file
pnpm --filter @typedex/indexed-db test -- --run src/tests/wpt/idbdatabase_createObjectStore.test.ts
```
