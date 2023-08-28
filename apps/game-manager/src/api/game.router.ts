import { api } from '@ivy-chess/api-schema'
import { router } from 'rest'
import { ChessGame } from '../service/ChessGame'

/**
 * Router for game management.
 */
export const gameRouter = router(api.games.http.gamesRoute, {
  create: async ({ body }, success, failure) => {
    const game = await ChessGame.create(body)
    return success({ id: game.data.id })
  },
})
