import { ColorMap } from '../../game/model/Game'
import { plotPerformance } from '../analysis/plotPerformance'
import { Replay } from './Replay'

/**
 * The stats of a single game.
 */
export interface PerformanceStats {
  /**
   * The normalized score of each move.
   */
  normalized: Partial<ColorMap<number[]>>

  /**
   * The centipawn score of each move.
   */
  centipawn: Partial<ColorMap<number[]>>
}

/**
 * The stats of a replay.
 */
export interface ReplayStats {
  /**
   * The id of the replay.
   */
  replay: string

  /**
   * The version of the stats.
   */
  version: number

  /**
   * The number of moves in the replay.
   */
  moves: number

  /**
   * The performance of the engines.
   */
  performance: PerformanceStats
}

/**
 * Creates a new replay stats object.
 *
 * @param data The data to create the replay stats from.
 * @returns The created replay stats.
 */
export function createReplayStats(data: Omit<ReplayStats, 'version'>): ReplayStats {
  return {
    version: 1,
    ...data,
  }
}

/**
 * Analyzes the given replay and creates stats for it.
 *
 * @param replay The replay to analyze.
 * @returns The stats for the given replay.
 */
export function analyseReplay(replay: Replay): ReplayStats {
  const performance = plotPerformance(replay)
  const moves = replay.history.length

  return createReplayStats({
    replay: replay.id,
    moves,
    performance,
  })
}
