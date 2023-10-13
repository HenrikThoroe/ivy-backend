import { AuthHandler } from '../handler/AuthHandler'
import { AuthProvider } from '../provider/AuthProvider'
import { SupabaseAuthProvider } from '../provider/SupabaseAuthProvider'
import { JWTVerifier } from '../verification/JWTVerifier'

interface AuthSuite<P extends AuthProvider> {
  provider: P
  verifier: JWTVerifier
  handler: AuthHandler
}

interface SupabaseOptions {
  url: string
  key: string
  secret: string
  issuer: string
}

/**
 * Static utility class to create {@link AuthSuite}s.
 * An {@link AuthSuite} contains an {@link AuthProvider}, a {@link JWTVerifier} and an {@link AuthHandler}.
 */
export class AuthFactory {
  /**
   * Creates an {@link AuthSuite} for Supabase.
   *
   * @param options The connection details and required secrets for Supabase.
   * @returns An {@link AuthSuite} for Supabase.
   */
  public static supabase(options: SupabaseOptions): AuthSuite<SupabaseAuthProvider> {
    const verifier = new JWTVerifier(options.secret, options.issuer)

    return {
      verifier,
      provider: new SupabaseAuthProvider(options.url, options.key),
      handler: new AuthHandler(verifier),
    }
  }
}
