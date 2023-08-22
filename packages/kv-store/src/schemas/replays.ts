import { shared } from '@ivy-chess/api-schema'
import { DynamicStore, StaticStore } from '../stores'

/**
 * The store for all replay related data.
 */
export const replayStore = StaticStore.redis('replays', {
  analysis: new DynamicStore('analysis', shared.replay.replayStatsSchema),
  data: new DynamicStore('data', shared.replay.replaySchema),
  logs: new DynamicStore('logs', shared.replay.replayLogSchema),
  index: new StaticStore('index', {
    date: new DynamicStore('date', 'set'),
    config: new DynamicStore('config', 'set'),
  }),
})
