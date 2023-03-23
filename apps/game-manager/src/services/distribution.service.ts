import { WebSocket } from 'ws'

const connections = new Map<string, WebSocket>()

export function put(player: string, socket: WebSocket) {
  if (connections.has(player)) {
    throw Error(`Connection to ${player} is already established.`)
  }

  socket.addEventListener('close', () => {
    connections.delete(player)
  })

  connections.set(player, socket)
}

export function get(player: string) {
  return connections.get(player)
}
