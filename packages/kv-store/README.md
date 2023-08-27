# KV Store

The `kv-store` package allows for type safe usage of a key-value storage solutions.
Values can have different types like string, bitset, JSON, etc.
Types are checked at compile time as well as on runtime. The package is using zod
for JSON validation.

The store can follow different persistence strategies. For now, the package supports Redis
and in-memory storage.

## Usage

```ts
import { z } from 'zod'

// Type: StaticStore<{ bar: ..., baz: ... }>
const store = StaticStore('foo', {
  // Type: DynamicStore<Array<{ message: string }>>
  bar: new DynamicStore('bar', z.array(z.object({ message: z.string() }))),

  // Type: Set<string>
  baz: 'set',
})

// Array<{ message: string }> | undefined
const val = await store.take('foo').take('bar').read()

// Works!
await store
  .take('foo')
  .take('bar')
  .take('any')
  .write([{ message: 'Hello, World!' }])

// Error, types do not match!
await store
  .take('foo')
  .take('bar')
  .take('any')
  .write([{ message: 0 }])

// Error, key not defined!
await store
  .take('notfoo')
  .take('bar')
  .take('any')
  .write([{ message: 'Hello, World!' }])

// Works!
await store
  .take('foo')
  .take('bar')
  .take('some other key that does not exist yet')
  .write([{ message: 'Hello, World!' }])
```

`StaticStore` allows to create a store that accepts a pre-defined set of keys, each with a fixed and unique type.

`DynamicStore` acts like a fixed-type array. Where any string key is accepted but all keys resolve to the
same type.

Static and dynamic stores can be nested as required. There are no limitations.
The set of types will probably be expanded to support the full range of native Redis
types and probably even more (JSON is a non native implementation).

Please see [fields](https://github.com/HenrikThoroe/ivy-backend/tree/main/packages/kv-store/src/fields),
[stores](https://github.com/HenrikThoroe/ivy-backend/tree/main/packages/kv-store/src/stores) and
[schemas](https://github.com/HenrikThoroe/ivy-backend/tree/main/packages/kv-store/src/schemas) for an in-detail documentation.
The source code is well documented and the API is intuitive.
