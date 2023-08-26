import { Client } from './Client'

/**
 * Singleton class for managing {@link Client}s.
 * Allows access to connected clients to
 * distribute games across multiple independent systems.
 */
export class ClientManager {
  /**
   * Shared instance of {@link ClientManager}.
   */
  public static readonly shared = new ClientManager()

  private readonly clients: Set<Client> = new Set()

  private constructor() {}

  //* API

  /**
   * All connected clients that have been added to the manager.
   */
  public get all(): Client[] {
    return Array.from(this.clients)
  }

  /**
   * Finds a client by its id.
   *
   * @param id The id of the client to find.
   * @returns The client with the given id or `undefined` if no such client exists.
   */
  public fetch(id: string): Client | undefined {
    for (const client of this.clients) {
      if (client.driver.id === id) {
        return client
      }
    }

    return undefined
  }

  /**
   * Adds a client to the manager.
   * Ignores consecutive calls for the same client.
   *
   * @param client The client to add.
   */
  public add(client: Client) {
    this.clients.add(client)
  }

  /**
   * Removes a client from the manager.
   *
   * @param client The client to remove.
   */
  public remove(client: Client) {
    this.clients.delete(client)
  }

  /**
   * Finds a number of free clients. A client is considered free if it is not locked to a session.
   * Will return at least `min` clients and at most `max` clients.
   *
   * @param min The minimum number of clients to return.
   * @param max The maximum number of clients to return.
   * @returns An array of free clients.
   * @throws If there are not enough free clients.
   */
  public find(min: number, max: number): Client[] {
    const free: Client[] = []

    if (min > max) {
      return []
    }

    if (min > this.clients.size) {
      return []
    }

    for (const client of this.clients) {
      if (free.length === max) {
        break
      }

      if (!client.isLocked) {
        free.push(client)
      }
    }

    if (free.length < min) {
      throw new Error('Not enough free clients')
    }

    return free
  }
}
