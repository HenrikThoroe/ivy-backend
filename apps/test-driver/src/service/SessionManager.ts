import { TestSuite } from '@ivy-chess/model'
import { Session } from './Session'

const invalidationDelay = 1000 * 60 * 10

/**
 * The session manager is responsible for creating and managing sessions.
 */
export class SessionManager {
  /**
   * The shared instance of the session manager.
   */
  public static readonly shared = new SessionManager()

  private readonly active: Set<Session> = new Set()

  private readonly invalid: Map<Session, NodeJS.Timeout> = new Map()

  private constructor() {}

  /**
   * All active sessions.
   */
  public get all(): Session[] {
    return Array.from(this.active)
  }

  /**
   * Creates a new session for the given suite.
   *
   * @param suite The suite to create a session for.
   * @param concurrency The number of clients to use simultaneously.
   * @returns The created session.
   */
  public create(suite: TestSuite, concurrency: number): Session {
    const session = new Session(suite, concurrency)
    this.active.add(session)
    return session
  }

  /**
   * Shuts down a the session and will remove it from the manager.
   * It will no longer be accessible after this call.
   * The session is fully terminated after a set amount of time.
   * This will allow clients to finish their current games.
   *
   * @param session The session to shut down.
   */
  public invalidate(session: Session) {
    if (this.active.has(session)) {
      this.active.delete(session)
    }

    if (this.invalid.has(session)) {
      clearTimeout(this.invalid.get(session)!)
    }

    const timeout = setTimeout(() => this.invalid.delete(session), invalidationDelay)
    this.invalid.set(session, timeout)
    session.shutdown()
  }

  /**
   * Finds a session by its id.
   *
   * @param id The id of the session to find.
   * @returns The found session.
   * @throws If no active session with the given id exists.
   */
  public find(id: string): Session {
    for (const session of this.active) {
      if (session.id === id) {
        return session
      }
    }

    throw new Error(`Session '${id}' not found.`)
  }
}
