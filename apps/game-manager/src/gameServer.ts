import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import { handleSocketMessage } from './controller/game.controller'
import { send } from './services/communication/io.service'

export const gameServer = createServer()
const wss = new WebSocketServer({ server: gameServer })

wss.on('connection', (socket) => {
  socket.on('message', async (msg) => {
    try {
      await handleSocketMessage(socket, msg)
    } catch (e) {
      if (e instanceof Error) await send(socket, { key: 'error', message: e.message })
      else await send(socket, { key: 'error', message: 'Unknown server exception' })
    }
  })
})
