import {
  EngineTestConfig,
  Replay,
  ReplayLog,
  analyseReplay,
  hashEngineTestConfig,
} from '@ivy-chess/model'
import {
  analysisScope,
  configIndexScope,
  createReplayDateIndex,
  dataScope,
  dateIndexScope,
  logScope,
} from './db'
import { Record, String, Union, Literal, Optional, Static } from 'runtypes'
import moment from 'moment'
import { createDayTimestamp } from './util'
import { ReplayByConfigFetchPayload } from 'com'
import { Queue } from 'bullmq'

export const FilterOptionsBody = Record({
  limit: Optional(String.withConstraint((n) => !Number.isNaN(parseInt(n)) && parseInt(n) >= 0)),
  age: Optional(String.withConstraint((n) => !Number.isNaN(parseInt(n)) && parseInt(n) >= 0)),
  date: Optional(String.withConstraint((str) => moment(str, moment.ISO_8601, true).isValid())),
  since: Optional(String.withConstraint((str) => moment(str, moment.ISO_8601, true).isValid())),
  winner: Optional(Union(Literal('white'), Literal('black'), Literal('draw'))),
  engine: Optional(String),
})

export type FilterOptions = Static<typeof FilterOptionsBody>

const retrieveIdx = async (idx: number) => {
  const key = idx.toString()

  if (await dateIndexScope.has(key)) {
    const indexSet = await dateIndexScope.asSet(key)
    return await indexSet.values()
  }

  return []
}

const getByDate = async (dateStr: string) => {
  const date = moment(dateStr, moment.ISO_8601, true).toDate()
  const idx = createDayTimestamp(date)

  return await retrieveIdx(idx)
}

const getFromDate = async (dateStr: string) => {
  const since = moment(dateStr, moment.ISO_8601, true).toDate()
  const today = new Date()
  const start = createDayTimestamp(since)
  const end = createDayTimestamp(today)

  if (start > end) {
    return []
  }

  const available = await dateIndexScope.list()
  const intersect = available.map((a) => parseInt(a)).filter((a) => start <= a && end >= a)
  const result: string[] = []

  for (const i of intersect) {
    const ids = await retrieveIdx(i)
    result.push(...ids)
  }

  return result
}

async function loadIds(options: FilterOptions, limit: number): Promise<Set<string>> {
  const result = new Set<string>()

  if (options.date) {
    const ids = await getByDate(options.date)
    ids.forEach((id) => result.add(id))
  } else if (options.since) {
    const ids = await getFromDate(options.since)
    ids.forEach((id) => result.add(id))
  } else if (options.age) {
    const since = moment().subtract(parseInt(options.age), 'seconds').toISOString()
    const ids = await getFromDate(since)
    ids.forEach((id) => result.add(id))
  } else {
    let keys = await dateIndexScope.list()
    keys = keys.sort().reverse()

    while (result.size < limit && keys.length > 0) {
      const key = keys.shift()!
      const ids = await retrieveIdx(+key)

      ids.forEach((id) => result.add(id))
    }
  }

  return result
}

async function filterIds(options: FilterOptions, ids: Set<string>) {
  if (options.engine || options.winner) {
    for (const id of ids) {
      const replay = await dataScope.fetch<Replay>(id)
      const engines = [replay.engines.white.name, replay.engines.black.name]

      if (options.engine && !engines.includes(options.engine)) {
        ids.delete(id)
      }

      if (options.winner) {
        if (replay.result.winner !== options.winner) {
          ids.delete(id)
        }
      }
    }
  }

  return ids
}

export async function fetch(options: FilterOptions): Promise<string[]> {
  const limit = Math.min(1_000, (options.limit && parseInt(options.limit)) || 100)
  let ids = await loadIds(options, limit)
  ids = await filterIds(options, ids)
  const result = Array.from(ids).slice(0, limit > ids.size ? undefined : limit)

  return result
}

export async function fetchByEngines(engines: [EngineTestConfig, EngineTestConfig]) {
  const hash = engines.map((e) => hashEngineTestConfig(e))

  if ((await configIndexScope.has(hash[0])) && (await configIndexScope.has(hash[1]))) {
    const engineSet0 = await configIndexScope.asSet(hash[0])
    const engineSet1 = await configIndexScope.asSet(hash[1])

    return await engineSet0.intersect(engineSet1)
  }

  return []
}

export async function saveLog(log: ReplayLog) {
  const exists = await logScope.has(log.replay)

  if (!exists) {
    await logScope.save(log.replay, log, { expiration: 60 * 60 })
  }
}

export async function saveReplay(replay: Replay) {
  const exists = await dataScope.has(replay.id)

  if (!exists) {
    await dataScope.save(replay.id, replay)
    await analysisScope.save(replay.id, analyseReplay(replay))

    const idx = createReplayDateIndex(replay)
    const key = idx.toString()
    const whiteHash = hashEngineTestConfig(replay.engines.white)
    const blackHash = hashEngineTestConfig(replay.engines.black)
    const indexSet = await dateIndexScope.asSet(key)
    const whiteSet = await configIndexScope.asSet(whiteHash)
    const blackSet = await configIndexScope.asSet(blackHash)

    await indexSet.add(replay.id)
    await whiteSet.add(replay.id)
    await blackSet.add(replay.id)
  }
}

export async function handleFetchRequest(payload: ReplayByConfigFetchPayload) {
  const ids = await fetchByEngines(payload.engines)
  const queue = new Queue(payload.target, {
    connection: {
      host: process.env.REDIS_HOST!,
      port: +process.env.REDIS_PORT!,
    },
  })

  for (const id of ids) {
    const replay = await dataScope.fetch<Replay>(id)
    await queue.add('response', replay)
  }

  await queue.close()
}
