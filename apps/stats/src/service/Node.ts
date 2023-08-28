import {
  Color,
  EngineTestConfig,
  NodeResult,
  NodeState,
  Performance,
  Replay,
  VerificationGroup,
  hashEngineTestConfig,
} from '@ivy-chess/model'
import { store } from 'kv-store'

type ReplayResult = 'win' | 'draw' | 'defeat'

/**
 * A node manages the statistics for a single engine test configuration
 * in the scope of a verification group.
 */
export class Node {
  private readonly group: VerificationGroup

  private readonly engine: EngineTestConfig

  private readonly hash: string

  private readonly baseHash: string

  private counterOffsets: Record<ReplayResult, number> = {
    win: 0,
    draw: 1,
    defeat: 2,
  }

  constructor(group: VerificationGroup, engine: EngineTestConfig) {
    this.group = group
    this.engine = engine
    this.hash = hashEngineTestConfig(engine)
    this.baseHash = hashEngineTestConfig(group.base)
  }

  //* API

  /**
   * Deletes all underlying data created by this node.
   * Does not delete the source data from which
   * the node created it's statistics.
   */
  public async erase(): Promise<void> {
    await Promise.all([
      this.store.take('games').erase(),
      this.store.take('white').erase(),
      this.store.take('black').erase(),
    ])
  }

  /**
   * Updates the statistics of this node with the given replay.
   * If the replay has already been processed by this node,
   * it will be ignored.
   *
   * The method will skip the replay if it was not played by
   * the engine that this node represents.
   *
   * @param replay The replay to update the statistics with.
   * @returns A promise that resolves when the statistics have been updated.
   */
  public async update(replay: Replay): Promise<void> {
    if (await this.has(replay)) {
      return
    }

    const color = this.color(replay)

    if (!color) {
      return
    }

    const result = this.replayResult(replay, color)

    await this.store.take('games').add(replay.id)
    await this.store.take(color).increment(this.counterOffsets[result], 1)
  }

  /**
   * Returns the current state of this node.
   *
   * @returns The current state of this node.
   */
  public async state(): Promise<NodeState> {
    return {
      node: this.engine,
      progress: await this.progress(),
    }
  }

  /**
   * Returns the a result for this node
   * based on all read in replays.
   * Will produce a different result if
   * the node has been updated since the last call.
   *
   * @returns The result for this node.
   */
  public async result(): Promise<NodeResult> {
    const white = {
      wins: (await this.store.take('white').read(this.counterOffsets.win)) ?? 0,
      draws: (await this.store.take('white').read(this.counterOffsets.draw)) ?? 0,
      defeats: (await this.store.take('white').read(this.counterOffsets.defeat)) ?? 0,
    }

    const black = {
      wins: (await this.store.take('black').read(this.counterOffsets.win)) ?? 0,
      draws: (await this.store.take('black').read(this.counterOffsets.draw)) ?? 0,
      defeats: (await this.store.take('black').read(this.counterOffsets.defeat)) ?? 0,
    }

    return {
      node: this.engine,
      performance: {
        white: this.performance(white.wins, white.draws, white.defeats),
        black: this.performance(black.wins, black.draws, black.defeats),
        accumulated: this.performance(
          white.wins + black.wins,
          white.draws + black.draws,
          white.defeats + black.defeats,
        ),
      },
    }
  }

  //* Private Methods

  private performance(wins: number, draws: number, defeats: number): Performance {
    const total = wins + draws + defeats

    return {
      wins,
      draws,
      defeats,
      total,
      winRatio: this.winRate(wins, draws, defeats),
      win2DefeatRatio: this.win2DefeatRate(wins, defeats),
    }
  }

  private winRate(wins: number, draws: number, defeats: number): number {
    const total = wins + draws + defeats
    return total > 0 ? wins / total : 0
  }

  private win2DefeatRate(wins: number, defeats: number): number {
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

  private async progress(): Promise<number> {
    const threshold = this.group.threshold
    const games = {
      white: await this.store.take('white').sum(0, 3),
      black: await this.store.take('black').sum(0, 3),
    }

    const white = Math.min(1, games.white / threshold)
    const black = Math.min(1, games.black / threshold)

    return (white + black) / 2
  }

  private replayResult(replay: Replay, color: Color): ReplayResult {
    if (replay.result.winner === 'draw') {
      return 'draw'
    }

    if (replay.result.winner === color) {
      return 'win'
    } else {
      return 'defeat'
    }
  }

  private async has(replay: Replay): Promise<boolean> {
    return await this.store.take('games').has(replay.id)
  }

  private color(replay: Replay): Color | undefined {
    const black = hashEngineTestConfig(replay.engines.black)
    const white = hashEngineTestConfig(replay.engines.white)

    if (black === this.hash && white === this.baseHash) {
      return 'black'
    }

    if (white === this.hash && black === this.baseHash) {
      return 'white'
    }

    return undefined
  }

  private get store() {
    return store
      .take('stats')
      .take('verification')
      .take(this.group.id)
      .take('nodes')
      .take(this.hash)
  }
}
