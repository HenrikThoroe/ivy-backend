import { WebSocket } from 'ws'
import {
  ErrorMessage,
  GameStateMessage,
  MoveRequestMessage,
  PlayerInfoMessage,
  PongMessage,
} from './message.service'

type Message =
  | GameStateMessage
  | PlayerInfoMessage
  | MoveRequestMessage
  | ErrorMessage
  | PongMessage

export async function send(socket: WebSocket, message: Message) {
  return new Promise<void>((res, rej) => {
    socket.send(JSON.stringify(message), (e) => {
      if (e) rej(e)
      else res()
    })
  })
}
