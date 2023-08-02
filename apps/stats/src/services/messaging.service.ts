import { Replay } from '@ivy-chess/model'
import { Job, Worker } from 'bullmq'
import { queueName } from 'com'
import { Verifier } from './verification/Verifier'

export const replayWorker = new Worker(
  queueName('stats', 'replay'),
  async (job: Job<Replay>) => {
    for (const verifier of await Verifier.all()) {
      await verifier.addReplay(job.data)
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
