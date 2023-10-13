interface UserData {
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
}