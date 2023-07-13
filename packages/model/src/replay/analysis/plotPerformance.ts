import { Color } from '../../game/model/Game'
import { Replay } from '../model/Replay'
import { PerformanceStats } from '../model/ReplayStats'

export const mateScore = 2147483647

export function plotPerformance(replay: Replay): PerformanceStats {
  let max = -mateScore
  const stats: PerformanceStats = {
    normalized: {},
    centipawn: {
      white: [],
      black: [],
    },
  }

  for (const [index, move] of replay.history.entries()) {
    const color: Color = index % 2 === 0 ? 'white' : 'black'
    const score = move.details.score

    if (!score) {
      stats.centipawn[color] = undefined
      continue
    }

    if (stats.centipawn[color]) {
      if (score.type === 'cp') {
        max = Math.max(max, Math.abs(score.value))
        stats.centipawn[color]?.push(score.value)
      } else {
        stats.centipawn[color]?.push(mateScore * Math.sign(score.value))
      }
    }
  }

  for (const color of ['white', 'black'] as const) {
    stats.normalized[color] = stats.centipawn[color]?.map((val) =>
      Math.abs(val) === mateScore ? Math.sign(val) : (val * 0.9) / max
    )
  }

  return stats
}
