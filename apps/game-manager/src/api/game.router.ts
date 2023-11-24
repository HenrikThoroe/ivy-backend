import { api } from '@ivy-chess/api-schema'
import { router } from 'rest'
import { GameStore } from '../service/games/GameStore'

const store = new GameStore()

/**
 * Router for game management.
 */
export const gameRouter = router(api.games.http.gamesRoute, {
  create: async ({ body }, success) => {
    return success(await store.create(body))
  },

  list: async (_, success) => {
    return success(await store.gameIds())
  },

  get: async ({ params }, success) => {
    return success(await store.fetch(params.id))
  },
})
