import { api } from '@ivy-chess/api-schema'
import {
  EngineTestConfig,
  Replay,
  ReplayLog,
  analyseReplay,
  hashEngineTestConfig,
} from '@ivy-chess/model'
import { store } from 'kv-store'
import moment from 'moment'
import { z } from 'zod'

type FilterOptions = z.infer<typeof api.replay.filterOptionsSchema>

const stores = {
  data: store.take('replays').take('data'),
  analysis: store.take('replays').take('analysis'),
  logs: store.take('replays').take('logs'),
  configIndex: store.take('replays').take('index').take('config'),
  dateIndex: store.take('replays').take('index').take('date'),
}

/**
 * Stateless management class for persisted replays.
 */
export class ReplayManager {
  /**
   * Fetches all replays that have been played between the given engines.
   *
   * @param engines The engines that played the replays.
   * @returns The ids of the replays that have been played between the given engines.
   */
  public async fetch(engines: [EngineTestConfig, EngineTestConfig]) {
    const hash = engines.map((e) => hashEngineTestConfig(e))
    const exists = [
      await stores.configIndex.take(hash[0]).exists(),
      await stores.configIndex.take(hash[1]).exists(),
    ] as const

    if (exists[0] && exists[1]) {
      const sets = [stores.configIndex.take(hash[0]), stores.configIndex.take(hash[1])]
      const res = await sets[0].intersect(sets[1])

      return Array.from(res)
    }

    return []
  }

  /**
   * Filters stored replays by the given options.
   *
   * @param options The options to filter the replays by.
   * @returns The ids of the replays that match the given options.
   */
  public async filter(options: FilterOptions) {
    const ids = await this.load(options)
    console.log(`Loaded ${ids.size} replays. Limit is ${this.limit(options)}.`)
    const filtered = await this.restrict(options, ids)
    console.log(`Filtered ${filtered.size} replays.`)

    return Array.from(filtered)
  }

  /**
   * Adds a replay to the store.
   *
   * @param replay The replay to add.
   */
  public async addReplay(replay: Replay) {
    const exists = await stores.data.take(replay.id).exists()

    if (!exists) {
      await stores.data.take(replay.id).write(replay)
      await stores.analysis.take(replay.id).write(analyseReplay(replay))
      await this.indexReplay(replay)
    }
  }

  /**
   * Adds a replay log to the store.
   *
   * @param log The log to add.
   */
  public async addLog(log: ReplayLog) {
    const exists = await stores.logs.take(log.replay).exists()
    const expiration = 60 * 60

    if (!exists) {
      await stores.logs.take(log.replay).write(log, { expiration })
    }
  }

  //* Private Methods

  private async restrict(options: FilterOptions, ids: Set<string>) {
    const result = new Set<string>()
    const limit = this.limit(options)
    const { engine, winner } = options

    for (const id of ids) {
      if (result.size >= limit) {
        break
      }

      if (engine || winner) {
        const replay = await stores.data.take(id).read()

        if (replay) {
          const white = replay.engines.white.name
          const black = replay.engines.black.name

          if (engine && (white === engine || black === engine)) {
            result.add(id)
          }

          if (winner && replay.result.winner === winner) {
            result.add(id)
          }
        }
      } else {
        result.add(id)
      }
    }

    return result
  }

  private async load(options: FilterOptions) {
    const limit = this.limit(options)
    const date = this.leastRecentDate(options)
    const shouldLoadNewer = options.date === undefined

    if (date && shouldLoadNewer) {
      return this.sinceDate(date)
    } else if (date) {
      return this.fromDate(date)
    }

    return this.newest(limit)
  }

  private limit(options: FilterOptions) {
    return Math.min(1_000, options.limit ?? 100)
  }

  private leastRecentDate(options: FilterOptions) {
    const ageDate = options.age ? moment().subtract(options.age, 'seconds').toDate() : undefined
    return options.date ?? options.since ?? ageDate
  }

  private async newest(limit: number) {
    const result = new Set<string>()
    const available = await stores.dateIndex.keys()

    for (const key of available.sort().reverse()) {
      const ids = await this.fromDateIndex(parseInt(key))

      for (const id of ids) {
        result.add(id)
      }

      if (result.size >= limit) {
        break
      }
    }

    return result
  }

  private async sinceDate(date: Date) {
    const start = this.createDayTimestamp(date)
    const end = this.createDayTimestamp(new Date())
    const available = await stores.dateIndex.keys()
    const ids = new Set<string>()
    const indecies = available
      .map((a) => parseInt(a))
      .filter((a) => a >= start && a <= end)
      .sort()
      .reverse()

    for (const index of indecies) {
      const indexIds = await this.fromDateIndex(index)

      for (const id of indexIds) {
        ids.add(id)
      }
    }

    return ids
  }

  private async fromDate(date: Date) {
    return await this.fromDateIndex(this.createDayTimestamp(date))
  }

  private async fromDateIndex(index: number) {
    const key = index.toString()
    const indexSet = stores.dateIndex.take(key)
    const ids = await indexSet.read()

    return ids ?? new Set()
  }

  private async indexReplay(replay: Replay) {
    const idx = this.createDayTimestamp(replay.date)
    const key = idx.toString()
    const whiteHash = hashEngineTestConfig(replay.engines.white)
    const blackHash = hashEngineTestConfig(replay.engines.black)
    const indexSet = stores.dateIndex.take(key)
    const whiteSet = stores.configIndex.take(whiteHash)
    const blackSet = stores.configIndex.take(blackHash)

    await indexSet.add(replay.id)
    await whiteSet.add(replay.id)
    await blackSet.add(replay.id)
  }

  private createDayTimestamp(date: Date) {
    const timestamp = date.getTime()
    const day = Math.floor(timestamp / (24 * 60 * 60 * 1000))

    return day
  }
}
