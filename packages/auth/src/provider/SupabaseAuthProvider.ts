import { Session, SupabaseClient, User } from '@supabase/supabase-js'
import { AuthProvider, SignUpResult, UserData } from './AuthProvider'

/**
 * {@link AuthProvider} implementation for Supabase.
 */
export class SupabaseAuthProvider extends AuthProvider {
  private readonly client: SupabaseClient

  constructor(url: string, key: string) {
    super()
    this.client = new SupabaseClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })
  }

  public async signIn(email: string, password: string): Promise<Session> {
    const res = await this.client.auth.signInWithPassword({
      email,
      password,
    })

    if (res.error !== null) {
      throw res.error
    }

    return res.data.session
  }

  public async signUp(
    email: string,
    password: string,
  ): Promise<SignUpResult<boolean, Session, User>> {
    const res = await this.client.auth.signUp({
      email,
      password,
    })

    if (res.error) {
      throw res.error
    }

    if (res.data.session) {
      return {
        confirmed: true,
        session: res.data.session,
      }
    }

    if (res.data.user) {
      return {
        confirmed: false,
        user: res.data.user,
      }
    }

    throw new Error('Received neither a session nor a user response.')
  }

  public async refresh(token: string): Promise<Session> {
    const res = await this.client.auth.refreshSession({ refresh_token: token })

    if (res.error) {
      throw res.error
    }

    if (res.data.session) {
      return res.data.session
    }

    throw new Error('Failed to retrieve refreshed session.')
  }

  public async signOut(jwt: string): Promise<void> {
    const res = await this.client.auth.admin.signOut(jwt)

    if (res.error) {
      throw res.error
    }
  }

  public async remove(id: string): Promise<void> {
    const res = await this.client.auth.admin.deleteUser(id)

    if (res.error) {
      throw res.error
    }
  }

  public async list(): Promise<UserData[]> {
    const res = await this.client.auth.admin.listUsers()

    if (res.error) {
      throw res.error
    }

    return res.data.users
  }
}
