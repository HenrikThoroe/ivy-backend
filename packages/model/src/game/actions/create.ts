import { v4 } from 'uuid'
import { GameConfig } from '../../configs/GameConfig'
import { decode, hash } from '../model/Board'
import { Game } from '../model/Game'

const standardPreset = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

/**
 * Creates a new standard chess game.
 *
 * @param config The configuration of the game.
 * @returns The created game.
 */
export function create(config: GameConfig): Game {
  const id = v4()
  const now = Date.now()
  const fen = config.startFen ?? standardPreset
  const board = decode(fen)

  return {
    id,
    startFen: fen,
    players: { white: undefined, black: undefined },
    time: { white: config.timeout, black: config.timeout },
    start: now,
    lastRequest: -1,
    history: [],
    state: 'waiting',
    board,
    positionHistory: [hash(board)],
    timeback: { white: config.timeback, black: config.timeback },
  }
}
