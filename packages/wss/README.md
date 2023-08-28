# Web Socket Server

The `wss` package provides an internal library for easily creating new ws servers.
Servers are created using schemas found in the `@ivy-chess/api-schema` package
and an implementation for each incoming message type.

The `wss` package allows for managing state for the server and each connection.

## Usage

```ts
import { schema } from '@ivy-chess/api-schema'

// State that will be passed to the implementation. Unique for each server instance.
const serverState = new ServerState()

const server = wss(schema, state, {
  // Client state will be recreated for each connection.
  state: async (sink) => new ClientState(sink),

  // An error handler is optional. If none is given, errors in handlers will be ignored.
  onError: async (sink, state, error) => sink.send('error', await createErrorMessage(error, state))

  // Called when a connection ends.
  onClose: async (state) => {
    await doSomething(state.client)
    await doSomethingElse(state.server)
  },

  handlers: {
    foo: async (sink, state, data) => {
      await doSomething(state.client, data) // state contains the client state for the connection and the shared server state.
      await doSomethingElse(state.server, data)
      await sink.send('bar', { ... }) // The message type is defined by the schema.
    }
  }
})
```
