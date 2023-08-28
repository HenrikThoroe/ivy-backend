import { api } from '@ivy-chess/api-schema'
import { wss } from 'wss'
import { Client } from '../service/Client'
import { MatchMaker } from '../service/MatchMaker'

/**
 * WebSocket server for game clients.
 */
export const gameSocket = wss(api.games.ws.gameInterface, new MatchMaker(), {
  state: async (sink) => new Client(sink),

  onClose: async (state) => {
    const id = state.server.id(state.client)

    if (id) {
      state.server.remove(id)
    }
  },

  onError: async (sink, _, error) => {
    if ('message' in error) {
      await sink.send('error', { key: 'error', message: error.message })
    }
  },

  handlers: {
    checkIn: async (_, state, message) => {
      const game = await state.server.game(message.game)

      if (game.white !== message.player && game.black !== message.player) {
        throw new Error('Player is not registered for this game.')
      }

      state.server.add(message.game, message.player, state.client)
    },

    move: async (_, state, message) => {
      const game = await state.server.game(message.game)
      const opponent = state.server.opponent(message.game, message.player)

      await game.move(message.player, message.move)
      await state.client.publishState(game)

      if (opponent) {
        await opponent.publishState(game)

        if (game.next) {
          await opponent.requestMove(game)
        }
      }
    },

    resign: async (_, state, message) => {
      const game = await state.server.game(message.game)
      const opponent = state.server.opponent(message.game, message.player)

      await game.resign(message.player)
      await state.client.publishState(game)
      await opponent?.publishState(game)
    },

    register: async (_, state, message) => {
      const game = await state.server.game(message.game)
      const id = await game.register(message.color)

      state.server.add(message.game, id, state.client)

      const white = await state.server.white(message.game)
      const opponent = state.server.opponent(message.game, id)

      await state.client.confirmRegistration(id, game)

      if (white && opponent) {
        await white.requestMove(game)
      }
    },

    ping: async (sink) => sink.send('pong', { key: 'pong' }),

    state: async (_, state, message) => {
      const game = await state.server.game(message.game)
      await state.client.publishState(game)
    },
  },
})
