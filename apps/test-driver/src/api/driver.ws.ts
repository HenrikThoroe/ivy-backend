import { api } from '@ivy-chess/api-schema'
import { wss } from 'wss'
import { Client } from '../service/Client'
import { ClientManager } from '../service/ClientManager'
import { SessionManager } from '../service/SessionManager'

const schema = api.testing.ws.driverInterface

/**
 * WebSocket server for test drivers.
 */
export const driverSocket = wss(schema, ClientManager.shared, {
  state: async (sink) => new Client(sink),
  onClose: async (state) => {
    state.server.remove(state.client)

    if (state.client.session) {
      const session = SessionManager.shared.find(state.client.session)
      await session.replace()
    }
  },
  handlers: {
    register: async (_, state, message) => {
      await state.client.register(message.name, message.hardware, message.deviceId)
      state.server.add(state.client)
    },

    report: async (_, state, message) => {
      const validations = await state.client.report(message)
      const session = SessionManager.shared.find(message.session)

      await session.add(state.client, ...validations)

      if (session.completed) {
        SessionManager.shared.invalidate(session)
      }
    },
  },
})
