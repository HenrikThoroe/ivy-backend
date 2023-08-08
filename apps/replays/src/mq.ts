import { Job, Worker } from 'bullmq'
import { ReplayByConfigFetchPayload, queueName } from 'com'
import { Replay, ReplayLog } from '@ivy-chess/model'
import { loadenv } from 'env-util'
import { handleFetchRequest, saveLog, saveReplay } from './service'

loadenv()

export const replayWorker = new Worker(
  queueName('replay', 'save'),
  async (job: Job<Replay>) => await saveReplay(job.data),
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
  async (job: Job<ReplayLog>) => await saveLog(job.data),
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

export const fetchWorker = new Worker(
  queueName('replay', 'fetch'),
  async (job: Job<ReplayByConfigFetchPayload>) => await handleFetchRequest(job.data),
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
