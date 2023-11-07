/**
 * The minimum data of a user as stored
 * by the external authentication provider.
 */
export interface UserData {
  /**
   * The ID of the user.
   */
  id: string
}

interface SessionData {
  access_token: string
  refresh_token: string
  expires_at?: number
  expires_in: number
  token_type: string
}

/**
 * A key, which can uniquely identify a user.
 */
export type UserKey = { id: string } | { email: string }

/**
 * The result of a sign up request.
 * If the user was confirmed, the session data is returned.
 * Otherwise, the user data is returned.
 */
export type SignUpResult<T extends boolean, S, U> = T extends true
  ? { confirmed: T; session: S }
  : { confirmed: T; user: U }

/**
 * Base class for authentication providers.
 */
export abstract class AuthProvider {
  /**
   * Signs in a user with the given email and password.
   *
   * @param email The email of the user.
   * @param password The password of the user.
   */
  public abstract signIn(email: string, password: string): Promise<SessionData>

  /**
   * Signs up a user with the given email and password.
   *
   * @param email The email of the user.
   * @param password The password of the user.
   */
  public abstract signUp(
    email: string,
    password: string,
  ): Promise<SignUpResult<boolean, SessionData, UserData>>

  /**
   * Refreshes a session using the given refresh token.
   *
   * @param token The refresh token.
   */
  public abstract refresh(token: string): Promise<SessionData>

  /**
   * Signs out a user with the given JWT.
   * Will remove all refresh tokens. The JWT itself will
   * stay valid until it expires.
   *
   * @param jwt The JWT of the user.
   */
  public abstract signOut(jwt: string): Promise<void>

  /**
   * Removes a user with the given ID.
   *
   * @param id The ID of the user.
   */
  public abstract remove(id: string): Promise<void>

  /**
   * Fecthes the data of all users.
   *
   * @returns A list of users.
   */
  public abstract list(): Promise<UserData[]>

  /**
   * Checks if a user with the given key exists.
   *
   * @param ket The key of the user.
   * @returns True if the user exists, false otherwise.
   */
  public abstract has(key: UserKey): Promise<boolean>
}
