import { RedisScope, RedisSet } from 'kv-store'
import { Counter } from './Counter'
import {
  Color,
  EngineTestConfig,
  NodeResult,
  NodeState,
  Performance,
  TerminationReason,
  hashEngineTestConfig,
} from '@ivy-chess/model'

export interface ReplayNodeData {
  result: 'win' | 'draw' | 'defeat'
  reason: TerminationReason
  node: EngineTestConfig
  color: Color
  replayId: string
}

export class Node {
  private readonly counter: Record<Color, Counter>
  private readonly games: RedisSet
  private readonly config: EngineTestConfig
  public readonly hash: string

  private constructor(
    counter: Record<Color, Counter>,
    games: RedisSet,
    hash: string,
    config: EngineTestConfig
  ) {
    this.counter = counter
    this.games = games
    this.hash = hash
    this.config = config
  }

  public static async create(groupScope: RedisScope, config: EngineTestConfig): Promise<Node> {
    const key = hashEngineTestConfig(config)
    const scope = groupScope.sub(key)

    const whiteCounter = await scope.asBitfield('counter-white')
    const blackCounter = await scope.asBitfield('counter-black')
    const games = await scope.asSet('games')

    return new Node(
      { white: new Counter(whiteCounter), black: new Counter(blackCounter) },
      games,
      key,
      config
    )
  }

  public async accepts(data: ReplayNodeData): Promise<boolean> {
    const exists = await this.games.has(data.replayId)
    const isFromNode = hashEngineTestConfig(data.node) === this.hash

    return !exists && isFromNode
  }

  public async add(data: ReplayNodeData): Promise<void> {
    if (!(await this.accepts(data))) {
      return
    }

    await this.counter[data.color].increment(data.result, 1)
    await this.games.add(data.replayId)
  }

  public async state(threshold: number): Promise<NodeState> {
    const games: Record<Color, number> = {
      white: 0,
      black: 0,
    }

    for (const color of ['white', 'black'] as const) {
      games[color] = await this.counter[color].get('win')
      games[color] += await this.counter[color].get('draw')
      games[color] += await this.counter[color].get('defeat')
    }

    const progress =
      (Math.min(1, games.white / threshold) + Math.min(1, games.black / threshold)) / 2

    return {
      node: this.config,
      progress,
    }
  }

  public async result(): Promise<NodeResult> {
    const empty: Performance = {
      wins: 0,
      draws: 0,
      defeats: 0,
      total: 0,
      winRatio: 0,
      win2DefeatRatio: 0,
    }

    const performance: Record<Color, Performance> = {
      white: { ...empty },
      black: { ...empty },
    }

    const wr = (wins: number, draws: number, defeats: number): number => {
      const total = wins + draws + defeats
      return total > 0 ? wins / total : 0
    }

    const w2dr = (wins: number, defeats: number): number => {
      if (wins === 0 && defeats === 0) {
        return 1
      }

      if (wins === 0) {
        return 1 / defeats
      }

      if (defeats === 0) {
        return wins
      }

      return wins / defeats
    }

    for (const color of ['white', 'black'] as const) {
      const wins = await this.counter[color].get('win')
      const draws = await this.counter[color].get('draw')
      const defeats = await this.counter[color].get('defeat')
      const total = wins + draws + defeats

      performance[color] = {
        wins,
        draws,
        defeats,
        total,
        winRatio: wr(wins, draws, defeats),
        win2DefeatRatio: w2dr(wins, defeats),
      }
    }

    const sum = (a: Performance, b: Performance): Performance => {
      const total = a.total + b.total
      const defeats = a.defeats + b.defeats
      const draws = a.draws + b.draws
      const wins = a.wins + b.wins

      return {
        wins,
        draws,
        defeats,
        total,
        winRatio: wr(wins, draws, defeats),
        win2DefeatRatio: w2dr(wins, defeats),
      }
    }

    return {
      node: this.config,
      performance: {
        white: performance.white,
        black: performance.black,
        accumulated: sum(performance.white, performance.black),
      },
    }
  }
}
