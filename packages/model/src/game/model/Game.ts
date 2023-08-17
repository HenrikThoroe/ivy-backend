import { GameResult } from '../analysis/end'
import { Board, Piece } from './Board'

/**
 * The state of the game based on time.
 * A game can be initialized but not yet started, which is the `waiting` state.
 * A game can be started, which is the `active` state.
 * A game can be expired, which is the `expired` state.
 * A game expires when moves are no longer accepted, which
 * could be because the game has been won, a player has resigned or run out of time.
 */
export type GameState = 'waiting' | 'active' | 'expired'

/**
 * The color of a player.
 */
export type Color = 'white' | 'black'

/**
 * A move from one position to another.
 * The source and target are the indices of the squares on the board.
 * The promotion is the piece to promote to, if any.
 * Indices are 0-based, with the top-left square being 0 and the bottom-right square being 63.
 */
export interface Move {
  /**
   * The index of the source square.
   */
  source: number

  /**
   * The index of the target square.
   */
  target: number

  /**
   * The piece to promote to, if any.
   */
  promotion?: Piece
}

/**
 * A map of colors to values.
 */
export type ColorMap<T> = {
  [key in Color]: T
}

/**
 * The reason a game has ended.
 * A game can end because of a rule violation, time, resignation or a win.
 * A win is determined from the board position after the last move and the game context.
 *
 * @see {@link GameResult}
 */
export type TerminationReason = 'rule-violation' | 'time' | 'resignation' | GameResult

/**
 * Properties defining a chess game.
 * Each game has a unique id, a board, a state, a history of moves, a start time and a winner.
 */
export interface Game {
  /**
   * The unique id of the game.
   */
  readonly id: string

  /**
   * The player ids.
   * Ids can be undefined if the player has not yet joined the game.
   * If any id is not set, the game cannot be started and moves will be rejected.
   */
  readonly players: ColorMap<string | undefined>

  /**
   * Remaining time for each player.
   */
  readonly time: ColorMap<number>

  /**
   * Timeback for each player.
   */
  readonly timeback: ColorMap<number>

  /**
   * The history of committed and valid moves.
   * If a move is invalid, it will not be added to the history and the
   * other player will win.
   */
  readonly history: Move[]

  /**
   * The start time of the game.
   * The start time is set on creation not the first move.
   * The value is a timestamp in milliseconds.
   */
  readonly start: number

  /**
   * The history of board positions.
   * The positions are FEN encoded.
   */
  readonly positionHistory: string[]

  /**
   * The winner of the game, if any.
   */
  winner?: Color | 'draw'

  /**
   * The board of the game.
   *
   * @see {@link Board}
   */
  board: Board

  /**
   * The current game state.
   *
   * @see {@link GameState}
   */
  state: GameState

  /**
   * The timestamp of the last request.
   */
  lastRequest: number

  /**
   * The reason the game has ended, if any.
   */
  reason?: TerminationReason
}
