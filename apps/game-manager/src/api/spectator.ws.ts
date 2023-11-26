import { api } from '@ivy-chess/api-schema'
import { StandardLogger } from 'metrics'
import { wss } from 'wss'
import { GameStore } from '../service/games/GameStore'

interface ClientState {
  game: string
  subscription: string
}

/**
 * WebSocket server for spectator clients.
 */
export const spectatorSocket = wss(api.games.ws.spectatorInterface, GameStore.shared, {
  state: async (): Promise<ClientState | undefined> => undefined,

  onClose: async (state) => {
    if (state.client) {
      state.server.unsubscribe(state.client.game, state.client.subscription)
    }
  },

  handlers: {
    subscribe: async (sink, state, message) => {
      if (state.client) {
        state.server.unsubscribe(state.client.game, state.client.subscription)
      }

      const subscription = state.server.subscribe(message.id, (game) => {
        sink.send('state', {
          key: 'state-msg',
          game,
        })
      })

      state.client = { game: message.id, subscription }

      StandardLogger.default.info(`Added subscription to game ${message.id}`)

      const game = await state.server.fetch(message.id)
      await sink.send('state', {
        key: 'state-msg',
        game,
      })
    },
  },
})
