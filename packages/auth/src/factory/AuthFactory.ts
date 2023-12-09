import { AuthHandler } from '../handler/AuthHandler'
import { AuthProvider } from '../provider/AuthProvider'
import { LocalAuthProvider } from '../provider/LocalAuthProvider'
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

interface LocalOptions {
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

  /**
   * Creates an {@link AuthSuite} for local authentication.
   *
   * **IMPORTANT: Should ONLY be used for develeopment or testing purposes. Does not provide ANY security!**
   *
   * @param options The connection details and required secrets for local authentication.
   * @returns An {@link AuthSuite} for local authentication.
   */
  public static local(options: LocalOptions): AuthSuite<LocalAuthProvider> {
    const verifier = new JWTVerifier(options.secret, options.issuer)

    return {
      verifier,
      provider: new LocalAuthProvider(options.secret, options.issuer),
      handler: new AuthHandler(verifier),
    }
  }
}
