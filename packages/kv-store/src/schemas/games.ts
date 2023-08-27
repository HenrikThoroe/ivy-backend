import { shared } from '@ivy-chess/api-schema'
import { DynamicStore, StaticStore } from '../stores'

/**
 * Store for all game related data.
 */
export const gamesStore = StaticStore.redis('games', {
  matches: new DynamicStore('matches', shared.game.gameSchema),
})
