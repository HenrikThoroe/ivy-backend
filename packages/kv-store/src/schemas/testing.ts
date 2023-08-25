import { shared } from '@ivy-chess/api-schema'
import { DynamicStore, StaticStore } from '../stores'

/**
 * Store for all testing-related data.
 */
export const testStore = StaticStore.redis('test', {
  suites: new DynamicStore('suites', shared.test.suiteSchema),
})
