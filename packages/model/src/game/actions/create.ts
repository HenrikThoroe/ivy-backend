import { v4 } from 'uuid'
import { GameConfig } from '../../configs/GameConfig'
import { decode, hash } from '../model/Board'
import { Game } from '../model/Game'

const standardPreset = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

export function create(config: GameConfig): Game {
  const id = v4()
  const now = Date.now()
  const board = decode(standardPreset)

  return {
    id,
    players: { white: undefined, black: undefined },
    time: { white: config.timeout, black: config.timeout },
    start: now,
    lastRequest: now,
    history: [],
    state: 'waiting',
    board: board,
    positionHistory: [hash(board)],
  }
}
