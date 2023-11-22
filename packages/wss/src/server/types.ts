import { InSchema, OutSchema } from '@ivy-chess/api-schema'
import { z } from 'zod'

/**
 * A sink accepts messages to be sent.
 */
export interface Sink<S extends InSchema> {
  drain: () => Promise<void>
  send: <K extends Extract<keyof S, string>>(event: K, data: z.infer<S[K]>) => Promise<void>
}

/**
 * Combined server and client state.
 */
export interface State<C, S> {
  client: C
  server: S
}

/**
 * Implementattion of the I/O schema.
 * Handlers are called when a message is received and
 * have access to a {@link Sink} and the current {@link State}.
 */
export type Impl<In extends InSchema, Out extends OutSchema, Client, Server> = {
  /**
   * Function used to create initial client side state.
   * Called when a new connection is established.
   *
   * @param sink A {@link Sink} to send messages to the client.
   * @param state The server side state.
   * @returns A new client side state.
   */
  state: (sink: Sink<Out>, state: Server) => Promise<Client>

  /**
   * Called when the connection is closed.
   *
   * @param state The current {@link State}.
   */
  onClose: (state: State<Client, Server>) => Promise<void>

  /**
   * Called when a handler throws an error.
   *
   * @param sink A {@link Sink} to send messages to the client.
   * @param state The current {@link State}.
   * @param error The error that was thrown.
   */
  onError?: (sink: Sink<Out>, state: State<Client, Server>, error: any) => Promise<void>

  /**
   * Handlers for incoming messages.
   */
  handlers: {
    [K in keyof In]: (
      sink: Sink<Out>,
      state: State<Client, Server>,
      data: z.infer<In[K]>,
    ) => Promise<void>
  }
}
