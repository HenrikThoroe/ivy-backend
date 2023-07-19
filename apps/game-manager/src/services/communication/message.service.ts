import { Color, ColorMap, encodeMove, Game, GameState } from '@ivy-chess/model'
import { getPlayerColor } from '../game.service'

export interface PongMessage {
  key: 'pong'
}

export interface GameStateMessage {
  key: 'game-state'
  playerColor: Color
  moves: string[]
  time: ColorMap<number>
  state: GameState
  winner?: Color | 'draw'
  reason?: string
}

export interface PlayerInfoMessage {
  key: 'player-info'
  game: string
  player: string
  color: Color
}

export interface MoveRequestMessage {
  key: 'move-request'
  playerColor: Color
  moves: string[]
  time: ColorMap<number>
}

export interface ErrorMessage {
  key: 'error'
  message: string
}

export function buildPongMessage() {
  const message: PongMessage = {
    key: 'pong',
  }

  return message
}

export function buildGameStateMessage(game: Game, player: string) {
  const message: GameStateMessage = {
    key: 'game-state',
    playerColor: getPlayerColor(game, player),
    moves: game.history.map(encodeMove),
    time: game.time,
    state: game.state,
    winner: game.winner,
    reason: game.reason,
  }

  return message
}

export function buildPlayerInfoMessage(game: Game, player: string) {
  const message: PlayerInfoMessage = {
    key: 'player-info',
    game: game.id,
    player,
    color: getPlayerColor(game, player),
  }

  return message
}

export function buildMoveRequestMessage(game: Game, player: string) {
  const message: MoveRequestMessage = {
    playerColor: getPlayerColor(game, player),
    moves: game.history.map(encodeMove),
    time: game.time,
    key: 'move-request',
  }

  return message
}
