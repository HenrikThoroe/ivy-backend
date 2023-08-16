import { shared } from '@ivy-chess/api-schema'
import { loadenv } from 'env-util'
import { Factory } from './Factory'
import { z } from 'zod'

loadenv()

export * from './Factory'
export * from './Receiver'
export * from './Sender'

/**
 * Payload is a collection of additional schemas used to validate
 * the data sent through the channels.
 * Most payload schemas are either primitive or imported from the api-schema package.
 */
export const payload = {
  replays: {
    fetch: z.object({
      target: z.enum(['stats']),
      engines: z.tuple([
        shared.engine.engineTestConfigSchema,
        shared.engine.engineTestConfigSchema,
      ]),
    }),
  },
}

/**
 * Channels is a collection of {@link Factory} instances.
 * Each factory is bound to a specific channel name and schema.
 * The channel name is used to identify the channel in the bullmq/redis queue.
 * The schema is used to validate the data sent through the channel.
 *
 * @example
 * ```ts
 * // Sender
 *
 * // Replay object is validated against the schema
 * channels.replays.sender().send('add', { ... })
 *
 * // Receiver
 *
 * // Data is validated against the schema and guranteed to be of type Replay
 * channels.replays.receiver().on('add', (data) => { ... })
 * ```
 */
export const channels = {
  replays: new Factory('replays', {
    add: shared.replay.replaySchema,
    addLog: shared.replay.replayLogSchema,
    fetch: payload.replays.fetch,
  }),
  stats: new Factory('stats', {
    addReplay: shared.replay.replaySchema,
  }),
}
