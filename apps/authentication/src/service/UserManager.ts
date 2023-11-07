import { api, shared } from '@ivy-chess/api-schema'
import { SupabaseAuthProvider } from 'auth'
import { store } from 'kv-store'
import { StandardLogger } from 'metrics'
import { z } from 'zod'

type Credentials = z.infer<typeof api.auth.credentialsSchema>

type RemoveResult<T extends boolean = boolean> = T extends true
  ? { success: T }
  : { success: T; message: string; code: number }

type AddResult<T extends boolean = boolean> = T extends true
  ? { success: T; user: User; credentials?: Credentials }
  : { success: T; reason: 'user-exists' | 'invalid-credentials' }

type User = z.infer<typeof shared.user.userSchema>

type FilterOptions = z.infer<typeof api.auth.userFilterOptionsSchema>

interface Query {
  filter: FilterOptions
  prune: boolean
  actor: string
}

const userWeights: Record<User['role'], number> = {
  manager: 0,
  visitor: 1,
  contributor: 2,
}

/**
 * Manages all users in the system.
 *
 * Fetches data from both the local database and the external authentication provider.
 */
export class UserManager {
  private readonly userDb = store.take('auth').take('users')

  private readonly managerDb = store.take('auth').take('managers')

  private readonly authProvider: SupabaseAuthProvider

  constructor(authProvider: SupabaseAuthProvider) {
    this.authProvider = authProvider
  }

  //* API

  /**
   * Gets a user by their ID.
   * If the user does not exist, `undefined` is returned.
   *
   * @param id The ID of the user.
   * @returns The user, if it exists.
   */
  public async get(id: string): Promise<User | undefined> {
    return await this.userDb.take(id).read()
  }

  /**
   * Adds a new user to the system.
   * Will add the user to the local database and
   * request the external authentication provider to create a new user.
   *
   * If the user can already be logged in, the credentials will be returned.
   *
   * If the user provides the preconfigured manager credentials, the user will be added as a manager.
   * All other users will be added as visitors.
   *
   * @param email The email of the user.
   * @param name The name of the user.
   * @param password The password of the user.
   * @returns The user and credentials, if the user can already be logged in.
   */
  public async add(email: string, name: string, password: string): Promise<AddResult> {
    if (await this.authProvider.has({ email })) {
      return { success: false, reason: 'user-exists' }
    }

    let role: User['role'] = 'visitor'

    if (email === process.env.ADMIN_EMAIL) {
      if (password !== process.env.ADMIN_PASSWORD) {
        return { success: false, reason: 'invalid-credentials' }
      }

      role = 'manager'
    }

    const result = await this.authProvider.signUp(email, password)

    if (result.confirmed) {
      const entry = this.userDb.take(result.session.user.id)
      const user = await entry.write({
        id: result.session.user.id,
        email: email,
        name: name,
        role,
      })

      return {
        user,
        success: true,
        credentials: {
          jwt: result.session.access_token,
          refreshToken: result.session.refresh_token,
        },
      }
    }

    const entry = this.userDb.take(result.user.id)
    const user = await entry.write({
      id: result.user.id,
      email: email,
      name: name,
      role,
    })

    return { user, success: true }
  }

  /**
   * Removes a user from the system.
   * Will remove the user from the local database and
   * request the external authentication provider to remove the user.
   *
   * If the user is the last manager, the request will be rejected.
   *
   * @param id The ID of the user to remove.
   * @param token The current token of the user, if they are logged in.
   * @returns The result of the operation.
   */
  public async remove(id: string, token?: string): Promise<RemoveResult> {
    const user = await this.userDb.take(id).read()

    if (!user) {
      return {
        success: false,
        message: 'User does not exist in database',
        code: 404,
      }
    }

    const isManager = user.role === 'manager'
    const isLast = (await this.managerDb.size()) <= 1

    if (isManager && isLast) {
      return {
        success: false,
        message: 'Cannot delete users with manager role, when they are the last manager',
        code: 403,
      }
    }

    if (token) {
      await this.authProvider.signOut(token)
    }

    await this.authProvider.remove(user.id)
    await this.userDb.take(user.id).erase()
    await this.managerDb.remove(user.id)

    return {
      success: true,
    }
  }

  /**
   * Queries all users in the system.
   * Will fetch data from both the local database and the external authentication provider.
   * The result will be sorted by role and name and filtered by the given filter options.
   *
   * If `prune` is set to `true`, all users that are not in the remote list will be removed from the local database.
   *
   * @param query The query options.
   * @returns A list of users.
   */
  public async query(query: Query): Promise<User[]> {
    const local = await this.userDb.keys()
    const remote = await this.authProvider.list()
    const valid = new Set(remote.map((x) => x.id))

    //? Prune local users that are not in the remote list.
    if (query.prune) {
      await this.prune(local, valid)
    }

    const data = await Promise.all(Array.from(valid).map((key) => this.userDb.take(key).read()))
    const users = data
      .filter((x) => x !== undefined)
      .map((x) => x!)
      .filter((x) => x.id !== query.actor)
      .filter((x) => (query.filter.role ? x.role === query.filter.role : true))
      .filter((x) =>
        query.filter.name ? x.name.toLowerCase().includes(query.filter.name.toLowerCase()) : true,
      )
      .filter((x) =>
        query.filter.email
          ? x.email.toLowerCase().includes(query.filter.email.toLowerCase())
          : true,
      )
      .slice(0, query.filter.limit ?? 100)
      .sort((a, b) => a.name.localeCompare(b.name))
      .sort((a, b) => userWeights[a.role] - userWeights[b.role])

    return users
  }

  //* Private Methods

  private async prune(local: string[], remote: Set<string>): Promise<void> {
    for (const key of local) {
      if (!remote.has(key)) {
        StandardLogger.default.info(`Removing user with id '${key}' from local database.`)
        await this.userDb.take(key).erase()
      }
    }
  }
}
