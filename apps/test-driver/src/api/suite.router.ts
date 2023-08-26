import { api } from '@ivy-chess/api-schema'
import { TestSuite } from '@ivy-chess/model'
import { store } from 'kv-store'
import { router } from 'rest'
import { v4 as uuidv4 } from 'uuid'

/**
 * Router for test suite related requests.
 */
export const suiteRouter = router(api.testing.http.testSuitesRoute, {
  all: async ({}, success, _) => {
    const ids = await store.take('testing').take('suites').keys()
    return success(ids)
  },

  get: async ({ params: { id } }, success, failure) => {
    const suite = await store.take('testing').take('suites').take(id).read()

    if (!suite) {
      return failure({ message: `Test suite '${id}' does not exist.` }, 404)
    }

    return success(suite)
  },

  create: async ({ body }, success, _) => {
    const id = uuidv4()
    const suite: TestSuite = { ...body, id }

    await store.take('testing').take('suites').take(id).write(suite)

    return success(suite)
  },

  delete: async ({ params: { id } }, success, failure) => {
    const exists = await store.take('testing').take('suites').take(id).exists()

    if (!exists) {
      return failure({ message: `Test suite '${id}' does not exist.` }, 404)
    }

    await store.take('testing').take('suites').take(id).erase()

    return success({ id })
  },
})
