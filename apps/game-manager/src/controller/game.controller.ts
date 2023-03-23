import WebSocket, { RawData } from 'ws'
import {
  CheckInCommand,
  GameStateCommand,
  isCommand,
  MoveCommand,
  RegisterCommand,
  ResignCommand,
} from '../services/communication/command.service'
import { send } from '../services/communication/io.service'
import {
  buildGameStateMessage,
  buildMoveRequestMessage,
  buildPlayerInfoMessage,
} from '../services/communication/message.service'
import { get, put } from '../services/distribution.service'
import {
  getOpponent,
  performMove,
  registerPlayer,
  resignGame,
  retrieveGame,
} from '../services/game.service'

async function handleRegisterCommand(socket: WebSocket, cmd: RegisterCommand) {
  const resp = await registerPlayer(cmd.game, cmd.color)
  await send(socket, buildPlayerInfoMessage(resp.game, resp.id))
}

async function handleMoveCommand(socket: WebSocket, cmd: MoveCommand) {
  const game = await performMove(cmd.game, cmd.player, cmd.move)
  const enemy = getOpponent(game, cmd.player)

  await send(socket, buildGameStateMessage(game, cmd.player))

  if (enemy) {
    const socket = get(enemy)

    if (socket) {
      await send(socket, buildMoveRequestMessage(game, enemy))
    }
  }
}

async function handleCheckInCommand(socket: WebSocket, cmd: CheckInCommand) {
  const game = await retrieveGame(cmd.game)
  put(cmd.player, socket)
  await send(socket, buildGameStateMessage(game, cmd.player))
}

async function handleGameStateCommand(socket: WebSocket, cmd: GameStateCommand) {
  const game = await retrieveGame(cmd.game)
  await send(socket, buildGameStateMessage(game, cmd.player))
}

async function handleResignCommand(socket: WebSocket, cmd: ResignCommand) {
  const game = await resignGame(cmd.game, cmd.player)
  await send(socket, buildGameStateMessage(game, cmd.player))
}

export async function handleSocketMessage(socket: WebSocket, message: RawData) {
  const cmd = JSON.parse(message.toString('utf-8'))

  if (isCommand('register', cmd)) await handleRegisterCommand(socket, cmd)
  else if (isCommand('move', cmd)) await handleMoveCommand(socket, cmd)
  else if (isCommand('check-in', cmd)) await handleCheckInCommand(socket, cmd)
  else if (isCommand('game-state', cmd)) await handleGameStateCommand(socket, cmd)
  else if (isCommand('resign', cmd)) await handleResignCommand(socket, cmd)
  else await send(socket, { key: 'error', message: 'Unknown Command' })
}
