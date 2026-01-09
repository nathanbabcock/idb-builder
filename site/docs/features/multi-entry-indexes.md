# Multi-entry indexes

> The `multiEntry` read-only property of the `IDBIndex` interface returns a boolean value that affects how the index behaves when the result of evaluating the index's key path yields an array.

[MDN](https://developer.mozilla.org/en-US/docs/Web/API/IDBIndex/multiEntry)

<<< @/samples/multi-entry.sample.ts{ts twoslash}

## Errors

### Keypath must point to an array

`multiEntry` requires the keyPath to point to an array property. Using it with a non-array property is an error.

<<< @/samples/multi-entry-non-array.sample.ts{ts twoslash}

### \[wip] Array elements must be valid keys

`multiEntry` requires array elements to be valid IndexedDB keys (string, number, Date, ArrayBuffer, or arrays of these). Objects are not valid keys.

<<< @/samples/multi-entry-object-array.sample.ts{ts twoslash}

### \[wip] Incompatible with composite keypath

`multiEntry` cannot be used with composite (array) keyPaths. This is an IndexedDB limitation.

<<< @/samples/multi-entry-composite-keypath.sample.ts{ts twoslash}
