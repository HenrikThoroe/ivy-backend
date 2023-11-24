import { loadenv } from 'env-util'
import { safeClient } from 'kv-store'
import { WebSocket } from 'ws'
import { ApiTest } from './ApiTest'

/**
 * A static utility class for the integration tests.
 * Provides values and methods shared throughout a test environment.
 */
export class Environment {
  private static readonly sockets: WebSocket[] = []

  /**
   * The JWT token of the logged in user.
   */
  public static token: string = ''

  private constructor() {}

  //* API

  /**
   * Registers an open web socket.
   * Any added socket will be closed when the test environment is torn down.
   *
   * @param socket The socket to register.
   */
  public static addSocket(socket: WebSocket) {
    Environment.sockets.push(socket)
  }

  /**
   * Sets up the test environment by:
   *
   * - Loading the environment variables.
   * - Clearing the database.
   * - Logging in the admin user.
   * - Storing the JWT token.
   *
   * This method should be called before any tests are run.
   */
  public static async setUp() {
    loadenv()

    await Environment.clearDb()

    const login = await ApiTest.auth('signIn')
      .data({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
      })
      .fetch()

    if (login.status !== 200) {
      const res = await ApiTest.auth('signUp')
        .data({
          email: process.env.ADMIN_EMAIL,
          username: 'none',
          password: process.env.ADMIN_PASSWORD,
        })
        .success()

      Environment.token = res.credentials!.jwt
    } else {
      Environment.token = login.body.jwt
    }
  }

  /**
   * Tears down the test environment by:
   *
   * - Closing all open web sockets.
   * - Clearing the database.
   *
   * This method should be called after all tests are run.
   */
  public static async tearDown() {
    for (const socket of Environment.sockets) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close()
      }
    }

    await Environment.clearDb()
  }

  //* Private Methods

  private static async clearDb() {
    const client = await safeClient()
    const keys = await client.keys('*')

    for (const key of keys) {
      if (key.startsWith('store:auth:')) {
        continue
      }

      await client.del(key)
    }

    await client.quit()
  }
}
