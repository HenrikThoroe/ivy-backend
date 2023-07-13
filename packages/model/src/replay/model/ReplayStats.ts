import { ColorMap } from '../../game/model/Game'
import { plotPerformance } from '../analysis/plotPerformance'
import { Replay } from './Replay'

export interface PerformanceStats {
  normalized: Partial<ColorMap<number[]>>
  centipawn: Partial<ColorMap<number[]>>
}

export interface ReplayStats {
  replay: string
  version: number
  moves: number
  performance: PerformanceStats
}

export function createReplayStats(data: Omit<ReplayStats, 'version'>): ReplayStats {
  return {
    version: 1,
    ...data,
  }
}

export function analyseReplay(replay: Replay): ReplayStats {
  const performance = plotPerformance(replay)
  const moves = replay.history.length

  return createReplayStats({
    replay: replay.id,
    moves,
    performance,
  })
}
