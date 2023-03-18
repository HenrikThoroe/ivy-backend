import { v4 } from 'uuid'
import { decode } from '../model/Board'
import { Game } from '../model/Game'

const standardPreset = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

export function create(timeout: number): Game {
  const id = v4()
  const now = Date.now()

  return {
    id,
    players: { white: undefined, black: undefined },
    time: { white: timeout, black: timeout },
    start: now,
    lastRequest: now,
    history: [],
    state: 'waiting',
    board: decode(standardPreset),
  }
}
