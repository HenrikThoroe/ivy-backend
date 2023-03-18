import { GameResult } from '../analysis/end'
import { Board, Piece } from './Board'

export type GameState = 'waiting' | 'active' | 'expired'

export type Color = 'white' | 'black'

export interface Move {
  source: number
  target: number
  promotion?: Piece
}

export type ColorMap<T> = {
  [key in Color]: T
}

export type TerminationReason = 'rule-violation' | 'time' | 'resignation' | GameResult

export interface Game {
  readonly id: string
  readonly players: ColorMap<string | undefined>
  readonly time: ColorMap<number>
  readonly history: Move[]
  readonly start: number
  winner?: Color | 'draw'
  board: Board
  state: GameState
  lastRequest: number
  reason?: TerminationReason
}
