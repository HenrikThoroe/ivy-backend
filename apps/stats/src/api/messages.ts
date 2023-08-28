import { VerificationGroup, hashEngineTestConfig } from '@ivy-chess/model'
import { channels } from 'com'
import { VerificationManager } from '../service/VerificationManager'

const lastRequest = new Map<string, number>()
const requestInterval = 1000 * 60

/**
 * Sets up the message queue for the stats service.
 */
export function setupMessageQueue() {
  const manager = new VerificationManager()

  channels.stats.receiver().on('addReplay', async (replay) => {
    const verifications = await manager.all()

    for (const verification of verifications) {
      await verification.update(replay)
    }
  })
}

/**
 * Requests the replays for the given group.
 *
 * @param group The group to request the replay data for.
 */
export async function requestReplays(group: VerificationGroup) {
  const base = hashEngineTestConfig(group.base)
  const now = Date.now()

  for (const node of group.nodes) {
    const hash = hashEngineTestConfig(node)
    const key = `${base}-${hash}`
    const last = lastRequest.get(key)

    if (last && now - last < requestInterval) {
      continue
    }

    lastRequest.set(key, now)
    await channels.replays.sender().send('fetch', { target: 'stats', engines: [group.base, node] })
  }
}
