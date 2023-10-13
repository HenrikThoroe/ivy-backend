import { Request } from 'express'
import { JWTPayload, JWTVerifier } from '../verification/JWTVerifier'

interface Token {
  type: string
  value: string
}

type AuthErrorReason = 'no-auth-header' | 'invalid-token-type' | 'invalid-token'

type ValidationResult<T extends boolean> = T extends true
  ? { success: T } & JWTPayload
  : { success: T; reason: AuthErrorReason; message: string; code: number }

/**
 * Utility class to verify to handle authentication
 * on incoming express requests.
 */
export class AuthHandler {
  private readonly verifier: JWTVerifier

  constructor(verifier: JWTVerifier) {
    this.verifier = verifier
  }

  //* API

  /**
   * Verifies that the request is authenticated.
   * Expects a bearer token in the authorization header.
   * If the request is authenticated, the payload is returned.
   * Otherwise, the reason for the failure, a message and a recommended
   * HTTP status code are returned.
   *
   * @param req The request to verify.
   * @returns The result of the verification.
   */
  public async isAuthenticated(req: Request): Promise<ValidationResult<boolean>> {
    const token = this.extractToken(req)

    if (!token) {
      return {
        success: false,
        reason: 'no-auth-header',
        message: 'No authorization header found',
        code: 401,
      }
    }

    if (token.type.toLowerCase() !== 'bearer') {
      return {
        success: false,
        reason: 'invalid-token-type',
        message: 'Invalid token type. Expected bearer token.',
        code: 401,
      }
    }

    const verification = await this.verifier.verify(token.value)

    if (!verification.success) {
      return {
        success: false,
        reason: 'invalid-token',
        message: verification.error,
        code: 403,
      }
    }

    return { ...verification, success: true }
  }

  //* Private Methods

  private extractToken(req: Request): Token | undefined {
    const authHeader = req.headers.authorization

    if (typeof authHeader !== 'string') {
      return undefined
    }

    const [type, value] = authHeader.split(' ')

    if (typeof type !== 'string' || typeof value !== 'string') {
      return undefined
    }

    return { type, value }
  }
}
