---
outline: 'deep'
---

# Auto increment

Defining an object store as [`autoIncrement`](https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/autoIncrement) imposes some additional constraints on the types of keys that can be used with that object store.

## Auto increment with keypath

<<< @/samples/keypath.sample.ts{ts twoslash}

## Auto increment with out-of-line keys

<<< @/samples/out-of-line.sample.ts{ts twoslash}

## Auto increment with composite keys

The IndexedDB spec specifically disallows using `autoIncrement` with composite
(array) primary keys.

<<< @/samples/composite.sample.ts{ts twoslash}
