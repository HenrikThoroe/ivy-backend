import { api } from '@ivy-chess/api-schema'
import { analyseReplay } from '@ivy-chess/model'
import { store } from 'kv-store'
import { router } from 'rest'
import { ReplayManager } from '../service/ReplayManager'

const dataStore = store.take('replays').take('data')
const analysisStore = store.take('replays').take('analysis')
const logStore = store.take('replays').take('logs')
const manager = new ReplayManager()

/**
 * The router for the replay service.
 */
export const replayRouter = router(api.replay.replayRoute, {
  all: async ({ query }, success, _) => {
    const replays = await manager.filter(query)
    return success(replays)
  },

  get: async ({ params }, success, failure) => {
    const replay = await dataStore.take(params.id).read()

    if (replay) {
      return success(replay)
    }

    return failure({ message: `Replay with id ${params.id} does not exist.` }, 404)
  },

  analysis: async ({ params }, success, failure) => {
    const analysis = await analysisStore.take(params.id).read()

    if (analysis) {
      return success(analysis)
    } else {
      const replay = await dataStore.take(params.id).read()

      if (replay) {
        const analysis = analyseReplay(replay)
        await analysisStore.take(params.id).write(analysis)
        return success(analysis)
      } else {
        return failure({ message: `Replay with id ${params.id} does not exist.` }, 404)
      }
    }
  },

  logs: async ({ params }, success, failure) => {
    const logs = await logStore.take(params.id).read()

    if (logs) {
      return success(logs)
    } else {
      return failure({ message: `Replay with id ${params.id} has no logs.` }, 404)
    }
  },
})
