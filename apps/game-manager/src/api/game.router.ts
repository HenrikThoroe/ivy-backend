import { api } from '@ivy-chess/api-schema'
import { router } from 'rest'
import { GameStore } from '../service/games/GameStore'

/**
 * Router for game management.
 */
export const gameRouter = router(api.games.http.gamesRoute, {
  create: async ({ body }, success) => {
    return success(await GameStore.shared.create(body))
  },

  list: async (_, success) => {
    return success(await GameStore.shared.gameIds())
  },

  get: async ({ params }, success) => {
    return success(await GameStore.shared.fetch(params.id))
  },

  delete: async ({ params }, success) => {
    await GameStore.shared.delete(params.id)
    return success({ success: true })
  },
})
