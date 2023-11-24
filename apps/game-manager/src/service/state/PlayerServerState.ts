import { GameStore } from '../games/GameStore'
import { PlayerClient } from './PlayerClient'

/**
 * The server side state of the player interface.
 *
 * This is used to keep track of connected clients and
 * stored games. Allows to fetch clients by their IDs,
 * which allows access to different clients from within
 * the handlers.
 */
export class PlayerServerState {
  private readonly clients = new Map<string, PlayerClient>()

  private readonly store = new GameStore()

  constructor() {
    this.fetch = this.fetch.bind(this)
  }

  //* API

  /**
   * The store for games.
   */
  public get games(): GameStore {
    return this.store
  }

  /**
   * Registers a client with the given id.
   *
   * @param id The id of the client.
   * @param client The client.
   */
  public register(id: string, client: PlayerClient) {
    this.clients.set(id, client)
  }

  /**
   * Unregisters a client with the given id.
   * If no client with the given id is registered,
   * this will do nothing.
   *
   * @param id The id of the client.
   */
  public unregister(id: string) {
    this.clients.delete(id)
  }

  /**
   * Fetches a client by its id.
   * If no client with the given id is registered,
   * this will return `undefined`.
   *
   * @param id The id of the client.
   * @returns The client with the given id or `undefined`.
   */
  public fetch(id: string): PlayerClient | undefined {
    return this.clients.get(id)
  }

  /**
   * Whether all clients with the given ids are registered.
   *
   * @param ids The ids of the clients.
   * @returns Whether all clients with the given ids are registered.
   */
  public has(...ids: string[]): boolean {
    return ids.every((id) => this.clients.has(id))
  }
}
