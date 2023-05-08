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
  buildPongMessage,
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
  put(resp.id, socket)
  await send(socket, buildPlayerInfoMessage(resp.game, resp.id))

  if (resp.game.players.black && resp.game.players.white) {
    const whiteSocket = get(resp.game.players.white)

    if (whiteSocket) {
      await send(whiteSocket, buildMoveRequestMessage(resp.game, resp.game.players.white))
    }
  }
}

async function handleMoveCommand(socket: WebSocket, cmd: MoveCommand) {
  const game = await performMove(cmd.game, cmd.player, cmd.move)
  const enemy = getOpponent(game, cmd.player)

  await send(socket, buildGameStateMessage(game, cmd.player))

  if (enemy) {
    const socket = get(enemy)

    if (socket) {
      await send(socket, buildGameStateMessage(game, enemy))

      if (game.state === 'active') {
        await send(socket, buildMoveRequestMessage(game, enemy))
      }
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
  const str = message.toString('utf-8')
  const cmd = JSON.parse(str)

  if (isCommand('register', cmd)) await handleRegisterCommand(socket, cmd)
  else if (isCommand('move', cmd)) await handleMoveCommand(socket, cmd)
  else if (isCommand('check-in', cmd)) await handleCheckInCommand(socket, cmd)
  else if (isCommand('game-state', cmd)) await handleGameStateCommand(socket, cmd)
  else if (isCommand('resign', cmd)) await handleResignCommand(socket, cmd)
  else if (isCommand('ping', cmd)) await send(socket, buildPongMessage())
  else await send(socket, { key: 'error', message: 'Unknown Command' })
}
