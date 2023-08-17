import { Color, Game } from '../model/Game'

/**
 * Resigns the game for the given color.
 * Changes the state of the given {@link Game} instance.
 *
 * @param game The game to resign.
 * @param color The color of the player that resigns.
 */
export function resign(game: Game, color: Color) {
  if (game.state !== 'active') {
    throw new Error(`Cannot resign an inactive game.`)
  }

  game.state = 'expired'
  game.reason = 'resignation'
  game.winner = color === 'black' ? 'white' : 'black'
}
