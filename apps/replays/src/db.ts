import { redis } from 'kv-store'

export const dataScope = redis.sub('replays').sub('data')
export const analysisScope = redis.sub('replays').sub('analysis')
export const logScope = redis.sub('replays').sub('logs')
