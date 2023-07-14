import { Job, Worker } from 'bullmq'
import { queueName } from 'com'
import { analysisScope, dataScope } from './db'
import { Replay, analyseReplay } from '@ivy-chess/model'
import { loadenv } from 'env-util'

loadenv()

export const worker = new Worker(
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
