import crypto from 'crypto'
import * as jose from 'jose'
import { AuthProvider, SessionData, SignUpResult, UserData, UserKey } from './AuthProvider'

interface User extends UserData {
  id: string
  email: string
  password: string
}

/**
 * A local authentication provider, that stores users in memory.
 *
 * **IMPORTANT: Should ONLY be used for develeopment or testing purposes. Does not provide ANY security!**
 */
export class LocalAuthProvider extends AuthProvider {
  private static readonly users = new Map<string, User>()

  private static readonly sessionId = 'local-session'

  private static refreshToken = 'refresh-token'

  private readonly issuer: string

  private readonly secret: Uint8Array

  constructor(secret: string, issuer: string) {
    super()

    this.issuer = issuer
    this.secret = Buffer.from(secret, 'ascii')
  }

  //* API

  public async signIn(email: string, password: string): Promise<SessionData> {
    const id = crypto.createHash('sha256').update(email).digest('hex')

    const user = LocalAuthProvider.users.get(id)

    if (user === undefined) {
      throw new Error('User not found.')
    }

    if (user.password !== password) {
      throw new Error('Invalid password.')
    }

    const token = await this.createJWT(id)

    return {
      access_token: token,
      refresh_token: LocalAuthProvider.refreshToken,
      expires_in: 2 * 60 * 60,
      token_type: 'Bearer',
      user,
    }
  }

  public async signUp(
    email: string,
    password: string,
  ): Promise<SignUpResult<boolean, SessionData, User>> {
    const id = crypto.createHash('sha256').update(email).digest('hex')
    const user = { id, email, password }

    LocalAuthProvider.users.set(id, user)

    const token = await this.createJWT(id)

    return {
      confirmed: true,
      session: {
        access_token: token,
        refresh_token: LocalAuthProvider.refreshToken,
        expires_in: 2 * 60 * 60,
        token_type: 'Bearer',
        user,
      },
    }
  }

  public async refresh(token: string): Promise<SessionData> {
    throw new Error('Local auth provider does not support refresh tokens.')
  }

  public async signOut(jwt: string): Promise<void> {}

  public async remove(id: string): Promise<void> {
    LocalAuthProvider.users.delete(id)
  }

  public async list(): Promise<User[]> {
    return [...LocalAuthProvider.users.values()]
  }

  public async has(key: UserKey): Promise<boolean> {
    if ('id' in key) {
      return LocalAuthProvider.users.has(key.id)
    }

    if ('email' in key) {
      return [...LocalAuthProvider.users.values()].some((user) => user.email === key.email)
    }

    throw new Error('Invalid key.')
  }

  //* Private Methods

  private async createJWT(user: string): Promise<string> {
    const payload = {
      session_id: LocalAuthProvider.sessionId,
    }

    return await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setIssuer(this.issuer)
      .setSubject(user)
      .setExpirationTime('2h')
      .sign(this.secret)
  }
}
