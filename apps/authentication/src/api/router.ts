import { api } from '@ivy-chess/api-schema'
import { AuthFactory } from 'auth'
import { loadenv } from 'env-util'
import { router } from 'rest'
import { UserManager } from '../service/UserManager'

loadenv()

const { provider } = AuthFactory.supabase({
  url: process.env.SUPABASE_URL!,
  key: process.env.SUPABASE_KEY!,
  secret: process.env.JWT_SECRET!,
  issuer: process.env.JWT_ISSUER!,
})

const manager = new UserManager(provider)

/**
 * Router for the authentication service.
 */
export const authRouter = router(api.auth.authenticationRoute, {
  signIn: async ({ body }, success, _) => {
    const session = await provider.signIn(body.email, body.password)

    return success({
      jwt: session.access_token,
      refreshToken: session.refresh_token,
    })
  },

  signUp: async ({ body }, success, failure) => {
    const result = await manager.add(body.email, body.username, body.password)

    if (result.success) {
      return success({ user: result.user, credentials: result.credentials })
    }

    if (result.reason === 'user-exists') {
      return failure({ message: 'User already exists' }, 409)
    }

    if (result.reason === 'invalid-credentials') {
      return failure({ message: 'Invalid credentials' }, 403)
    }

    return failure({ message: 'Unknown error' }, 500)
  },

  signOut: async ({ auth }, success, failure) => {
    await provider.signOut(auth.token)
    return success({ success: true })
  },

  profile: async ({ auth }, success, failure) => {
    const { user } = auth
    const data = await manager.get(user)

    if (data) {
      return success(data)
    } else {
      return failure({ message: 'User not found' }, 404)
    }
  },

  refresh: async ({ body }, success, _) => {
    const session = await provider.refresh(body.refreshToken)

    return success({
      jwt: session.access_token,
      refreshToken: session.refresh_token,
    })
  },

  delete: async ({ auth }, success, failure) => {
    const { user, token } = auth
    const res = await manager.remove(user, token)

    if (res.success) {
      return success({ success: true })
    }

    return failure({ message: res.message }, res.code)
  },

  remove: async ({ params }, success, failure) => {
    const { id } = params
    const res = await manager.remove(id)

    if (res.success) {
      return success({ success: true })
    }

    return failure({ message: res.message }, res.code)
  },

  update: async ({}, _, failure) => failure({ message: 'Not implemented' }, 501),

  list: async ({ query, auth }, success, _) => {
    const users = await manager.query({ filter: query, prune: true, actor: auth.user })
    return success(users)
  },
})
