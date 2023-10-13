import { shared } from '@ivy-chess/api-schema'
import { DynamicStore, StaticStore } from '../stores'

/**
 * Store for all authentication related data.
 */
export const authenticationStore = StaticStore.redis('authentication', {
  users: new DynamicStore('users', shared.user.userSchema),
})
