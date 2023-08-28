import { channels } from 'com'
import { store } from 'kv-store'
import { ReplayManager } from '../service/ReplayManager'

/**
 * Sets up the message queue for the replay service.
 */
export function setupMessageQueue() {
  const manager = new ReplayManager()

  channels.replays.receiver().on('add', async (replay) => {
    await manager.addReplay(replay)
  })

  channels.replays.receiver().on('addLog', async (log) => {
    await manager.addLog(log)
  })

  channels.replays.receiver().on('fetch', async (payload) => {
    const ids = await manager.fetch(payload.engines)
    const send = payload.target === 'stats' ? channels.stats.sender().send : null

    if (!send) {
      return
    }

    for (const id of ids) {
      const replay = await store.take('replays').take('data').take(id).read()

      if (replay) {
        await send('addReplay', replay)
      }
    }
  })
}
