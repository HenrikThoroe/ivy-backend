import { loadenv } from 'env-util'
import { createClient } from 'redis'

loadenv()

const client = createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
})

/**
 * Returns a redis client that is ready to use.
 * If the client is not ready, it will be connected.
 * The client instance being returned is cached and
 * will be reused.
 *
 * @returns A redis client.
 */
export async function safeClient() {
  if (!client.isReady) {
    await client.connect()
  }

  return client
}
