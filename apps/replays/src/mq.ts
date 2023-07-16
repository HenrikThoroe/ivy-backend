import { Job, Worker } from 'bullmq'
import { queueName } from 'com'
import { analysisScope, dataScope, logScope } from './db'
import { Replay, ReplayLog, analyseReplay } from '@ivy-chess/model'
import { loadenv } from 'env-util'

loadenv()

export const replayWorker = new Worker(
  queueName('replay', 'save'),
  async (job: Job<Replay>) => {
    const exists = await dataScope.has(job.data.id)
    if (!exists) {
      await dataScope.save(job.data.id, job.data)
      await analysisScope.save(job.data.id, analyseReplay(job.data))
    }
  },
  {
    autorun: false,
    connection: {
      host: process.env.REDIS_HOST!,
      port: +process.env.REDIS_PORT!,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  }
)

export const logWorker = new Worker(
  queueName('replay-log', 'save'),
  async (job: Job<ReplayLog>) => {
    const exists = await logScope.has(job.data.replay)

    if (!exists) {
      await logScope.save(job.data.replay, job.data, { expiration: 60 * 60 })
    }
  },
  {
    autorun: false,
    connection: {
      host: process.env.REDIS_HOST!,
      port: +process.env.REDIS_PORT!,
    },
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 100 },
  }
)
