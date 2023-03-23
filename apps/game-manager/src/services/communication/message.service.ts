import { Color, Game } from 'model'
import { getPlayerColor } from '../game.service'

export interface GameStateMessage extends Omit<Game, 'players'> {
  key: 'game-state'
  playerColor: Color
}

export interface PlayerInfoMessage {
  key: 'player-info'
  game: string
  player: string
  color: Color
}

export interface MoveRequestMessage extends Omit<GameStateMessage, 'key'> {
  key: 'move-request'
}

export interface ErrorMessage {
  key: 'error'
  message: string
}

export function buildGameStateMessage(game: Game, player: string) {
  const message: GameStateMessage = {
    ...game,
    playerColor: getPlayerColor(game, player),
    key: 'game-state',
  }

  delete (message as any).players
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
    ...buildGameStateMessage(game, player),
    key: 'move-request',
  }

  return message
}
