import { api } from '@ivy-chess/api-schema'
import { router } from 'rest'
import { ClientManager } from '../service/ClientManager'

/**
 * Router for test driver related requests.
 */
export const driverRouter = router(api.testing.http.driverRoute, {
  all: async (_, success, __) => {
    const clients = ClientManager.shared.all
    const drivers = clients.map((c) => c.driver)

    return success(drivers)
  },

  get: async ({ params: { id } }, success, failure) => {
    const driver = ClientManager.shared.fetch(id)?.driver

    if (driver) {
      return success(driver)
    }

    return failure({ message: `Test driver with id '${id}' does not exist.` }, 404)
  },
})
