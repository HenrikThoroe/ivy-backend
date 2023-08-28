import { StaticStore } from '../stores'
import { gamesStore } from './games'
import { replayStore } from './replays'
import { statsStore } from './stats'
import { testStore } from './testing'

/**
 * Store utilizing Redis for persistence.
 * Type safe representation of the Redis db schema.
 */
export const store = StaticStore.redis('store', {
  replays: replayStore,
  stats: statsStore,
  testing: testStore,
  games: gamesStore,
})
