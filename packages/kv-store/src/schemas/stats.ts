import { shared } from '@ivy-chess/api-schema'
import { BitSetFieldConfig } from '../fields/BitSetField'
import { DynamicStore, StaticStore } from '../stores'

/**
 * The store for all stats related data.
 */
export const statsStore = StaticStore.redis('stats', {
  verification: new DynamicStore(
    'verification',
    new StaticStore('group', {
      config: shared.stats.verificationGroupSchema,
      nodes: new DynamicStore(
        'nodes',
        new StaticStore('node', {
          games: 'set',
          white: new BitSetFieldConfig(64),
          black: new BitSetFieldConfig(64),
        }),
      ),
    }),
  ),
})
