# Auto increment

Defining an object store as [`autoIncrement`](https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/autoIncrement) imposes some additional constraints on the types of keys that can be used with that object store.

## Keypath must point to a number

<<< @/samples/auto-increment/keypath.sample.ts{ts twoslash}

## Out-of-line keys must be numbers

<<< @/samples/auto-increment/out-of-line.sample.ts{ts twoslash}

## Auto increment cannot be used with composite keys

The IndexedDB spec specifically disallows using `autoIncrement` with composite
(array) primary keys.

<<< @/samples/auto-increment/composite.sample.ts{ts twoslash}
