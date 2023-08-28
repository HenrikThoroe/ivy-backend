import { api } from '@ivy-chess/api-schema'
import { store } from 'kv-store'
import { router } from 'rest'
import { SessionManager } from '../service/SessionManager'

/**
 * Router for test session related requests.
 */
export const sessionRouter = router(api.testing.http.sessionsRoute, {
  all: async (_, success, __) => {
    const sessions = SessionManager.shared.all.map((s) => ({
      id: s.id,
      remaining: s.remainingGames,
      suite: s.suite,
    }))

    return success(sessions)
  },

  get: async ({ params: { id } }, success, _) => {
    const session = SessionManager.shared.find(id)

    return success({
      id: session.id,
      remaining: session.remainingGames,
      suite: session.suite,
    })
  },

  delete: async ({ params: { id } }, success, _) => {
    const session = SessionManager.shared.find(id)
    SessionManager.shared.invalidate(session)
    return success({ id: session.id })
  },

  create: async ({ body }, success, failure) => {
    const suite = await store.take('testing').take('suites').take(body.suite).read()

    if (!suite) {
      return failure({ message: `Test suite '${body.suite}' does not exist.` }, 403)
    }

    const session = SessionManager.shared.create(suite, body.driver)

    await session.start()

    return success({
      id: session.id,
      remaining: session.remainingGames,
      suite: session.suite,
    })
  },
})
