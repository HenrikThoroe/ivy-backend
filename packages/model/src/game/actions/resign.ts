import { Color, Game } from '../model/Game'

export function resign(game: Game, color: Color) {
  if (game.state !== 'active') {
    throw new Error(`Cannot resign an inactive game.`)
  }

  game.state = 'expired'
  game.reason = 'resignation'
  game.winner = color === 'black' ? 'white' : 'black'
}
