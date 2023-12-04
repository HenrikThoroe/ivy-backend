import { api } from '@ivy-chess/api-schema'
import { fenDecode, isValidMove } from '@ivy-chess/model'
import { StandardLogger } from 'metrics'
import { wss } from 'wss'
import { PlayerClient } from '../service/state/PlayerClient'
import { PlayerServerState } from '../service/state/PlayerServerState'

/**
 * WebSocket server for player clients.
 */
export const playerSocket = wss(api.games.ws.playerInterface, new PlayerServerState(), {
  state: async (sink) => {
    StandardLogger.default.info(`WebSocket player client connected`)
    return new PlayerClient(sink)
  },

  onClose: async (state) => {
    StandardLogger.default.info(`WebSocket player client disconnected`)

    if (state.client.isInitialized) {
      StandardLogger.default.info(`Client ${state.client.id} disconnected`)

      const transaction = await state.server.games.transaction(
        await state.server.games.gameId(state.client.id),
      )

      state.server.unregister(state.client.id)
      transaction.disconnect(state.client.id)
      await transaction.commit()
    }
  },

  onError: async (_, state) => {
    state.client.kill()
  },

  handlers: {
    checkIn: async (_, state, message) => {
      const id = message.player
      const gameID = await state.server.games.gameId(id)
      const game = await state.server.games.fetch(gameID)

      if (!game.isActive) {
        throw new Error(`Game ${gameID} is not active.`)
      }

      state.client.init(id)
      state.server.register(id, state.client)

      StandardLogger.default.info(`Client ${id} connected`)

      const transaction = await state.server.games.transaction(gameID)
      const next = transaction.next
      const client = state.server.fetch(next)

      transaction.connect(id)
      await transaction.commit()

      if (client && !transaction.isFinished && state.server.has(...transaction.participants)) {
        await client.requestMove(transaction.history, transaction.recommendedTime(client.id))
      }

      if (transaction.isFinished) {
        transaction.participants.map(state.server.fetch).forEach((c) => {
          c?.kill()
        })
      }
    },

    move: async (_, state, message) => {
      const id = state.client.id
      const gameID = await state.server.games.gameId(id)
      const game = await state.server.games.fetch(gameID)
      const move = fenDecode.parseFENMove(message.move)
      const transaction = await state.server.games.transaction(gameID)

      if (transaction.next !== id) {
        transaction.cancel()
        throw new Error(`Received move from ${id} but expecetd from ${transaction.next}`)
      }

      if (move === 'nullmove' || !isValidMove(game.game.board, move[0], move[1])) {
        transaction.cancel()
        throw new Error(`Invalid move '${message.move}' for game ${gameID}.`)
      }

      transaction.move(message.move)
      await transaction.commit()

      if (!transaction.isFinished) {
        const next = transaction.next
        const client = state.server.fetch(next)

        if (client) {
          await client.requestMove(transaction.history, transaction.recommendedTime(client.id))
        }
      } else {
        transaction.participants.map(state.server.fetch).forEach((c) => {
          c?.kill()
        })
      }
    },

    resign: async (_, state) => {
      const id = state.client.id
      const game = await state.server.games.gameId(id)
      const transaction = await state.server.games.transaction(game)

      transaction.resign(id)
      await transaction.commit()

      if (transaction.isFinished) {
        transaction.participants.map(state.server.fetch).forEach((c) => {
          c?.kill()
        })
      }
    },

    update: async (_, state) => {
      const id = state.client.id
      const game = await state.server.games.gameId(id)
      const transaction = await state.server.games.transaction(game)

      await state.client.update(transaction.history)
      transaction.cancel()
    },
  },
})
