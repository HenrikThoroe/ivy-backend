import { StaticStore } from '../stores'
import { replayStore } from './replays'

/**
 * Store utilizing Redis for persistence.
 * Type safe representation of the Redis db schema.
 */
export const store = StaticStore.redis('store', {
  replays: replayStore,
})
