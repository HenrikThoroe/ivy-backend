# Com

The communication package contains type schemas and MQ abstractions
to allow type-safe IPC over Redis message queues using [bullmq](https://docs.bullmq.io).

Communication is implemented using `channels`. A channel can create a sender and a receiver.
The channel is fully types and each message is associated with a type that is statically checked
at compile time and checked using zod at runtime.

## Usage

```ts
// Process 1

// data is fully typed and before the handler is
// called the argument must pass a zod validation.
// Therefore the user of the API can be sure to
// receive the data he's expecting.
channels.foo.receiver().on('bar', async (data) => {
  await doSomething(data)
})

// ------------------------------------------------
// Process 2. Could be on another machine
// ------------------------------------------------

// The type of data is defined. Typescript be throw an error
// if a wrong type is given.
// If the type system is for some reason tricked,
// the input will be validated before being sent and
// if it does not satisfy the type constraints discarded.
channels.foo.sender().send('bar', data)
```
