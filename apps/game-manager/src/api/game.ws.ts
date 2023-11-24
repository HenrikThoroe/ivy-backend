import { api } from '@ivy-chess/api-schema'
import { StandardLogger } from 'metrics'
import { wss } from 'wss'
import { PlayerClient } from '../service/state/PlayerClient'
import { PlayerServerState } from '../service/state/PlayerServerState'

/**
 * WebSocket server for player clients.
 */
export const playerSocket = wss(api.games.ws.playerInterface, new PlayerServerState(), {
  state: async (sink) => new PlayerClient(sink),

  onClose: async (state) => {
    if (state.client.isInitialized) {
      StandardLogger.default.info(`Client ${state.client.id} disconnected`)
      state.server.unregister(state.client.id)
    }
  },

  onError: async (_, state) => {
    state.client.kill()
  },

  handlers: {
    checkIn: async (_, state, message) => {
      const id = message.player

      state.client.init(id)
      state.server.register(id, state.client)

      StandardLogger.default.info(`Client ${id} connected`)

      const game = await state.server.games.gameId(id)
      const transaction = await state.server.games.transaction(game)
      const next = transaction.next
      const client = state.server.fetch(next)

      if (client && !transaction.isFinished && state.server.has(...transaction.participants)) {
        await client.requestMove(transaction.history)
      }

      if (transaction.isFinished) {
        transaction.participants.map(state.server.fetch).forEach((c) => {
          c?.kill()
        })
      }
    },

    move: async (_, state, message) => {
      const id = state.client.id
      const game = await state.server.games.gameId(id)
      const transaction = await state.server.games.transaction(game)

      if (transaction.next !== id) {
        throw new Error(`Received move from ${id} but expecetd from ${transaction.next}`)
      }

      transaction.move(message.move)
      await transaction.commit()

      if (!transaction.isFinished) {
        const next = transaction.next
        const client = state.server.fetch(next)

        if (client) {
          await client.requestMove(transaction.history)
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
    },
  },
})
