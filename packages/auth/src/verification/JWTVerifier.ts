import * as jose from 'jose'

/**
 * Parsed JWT Payload
 */
export interface JWTPayload {
  user: string
  session: string
  expiration: Date
}

/**
 * The result of a JWT verification.
 * In case of success, the payload is returned.
 * Otherwise, an error message is returned.
 */
export type JWTVerificationResult<T extends boolean> = T extends true
  ? { success: T } & JWTPayload
  : { success: T } & { error: string }

/**
 * Utility class to verify JWTs.
 */
export class JWTVerifier {
  private readonly key: Uint8Array

  private readonly issuer?: string

  constructor(secret: string, issuer?: string) {
    this.key = Buffer.from(secret, 'ascii')
    this.issuer = issuer
  }

  /**
   * Verifies the JWS and ensures that all required claims are present and met.
   *
   * @param jwt The JWT to verify.
   * @returns The result of the verification.
   */
  public async verify(jwt: string): Promise<JWTVerificationResult<boolean>> {
    try {
      const res = await jose.jwtVerify(jwt, this.key, {
        issuer: this.issuer,
      })

      const session = res.payload.session_id
      const user = res.payload.sub
      const expiration = res.payload.exp

      if (typeof expiration !== 'number') {
        return { success: false, error: 'Missing expiration' }
      }

      if (typeof session !== 'string') {
        return { success: false, error: 'Missing session ID' }
      }

      if (typeof user !== 'string') {
        return { success: false, error: 'Missing user ID' }
      }

      return { success: true, expiration: new Date(expiration), session, user }
    } catch (e) {
      if (e instanceof Error) {
        return { success: false, error: e.message }
      }

      return { success: false, error: 'Unknown JWT verification error' }
    }
  }
}
