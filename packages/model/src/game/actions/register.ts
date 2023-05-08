import { v4 } from 'uuid'
import { Color, Game } from '../model/Game'

export function register(game: Game, color?: Color): string {
  if (game.players.black !== undefined && game.players.white !== undefined) {
    throw new Error(`Could not register a new player as all slots are already occupied.`)
  }

  const id = v4()

  if (color === undefined) {
    let idx = Math.round(Math.random())
    const map: Color[] = ['white', 'black']

    if (game.players[map[idx]] !== undefined) {
      idx += 1
      idx %= 2
    }

    game.players[map[idx]] = id
  } else if (game.players[color] === undefined) {
    game.players[color] = id
  } else {
    throw new Error(`The ${color} player is no longer available.`)
  }

  if (game.players.black !== undefined && game.players.white !== undefined) {
    game.state = 'active'
  }

  return id
}
