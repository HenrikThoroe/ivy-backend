import { Replay } from '@ivy-chess/model'
import { redis } from 'kv-store'
import { createDayTimestamp } from './util'

export const dataScope = redis.sub('replays').sub('data')
export const analysisScope = redis.sub('replays').sub('analysis')
export const logScope = redis.sub('replays').sub('logs')
export const dateIndexScope = redis.sub('replays').sub('index').sub('date')
export const configIndexScope = redis.sub('replays').sub('index').sub('config')

export function createReplayDateIndex(replay: Replay) {
  const date = typeof replay.date === 'string' ? new Date(replay.date) : replay.date
  return createDayTimestamp(date)
}
