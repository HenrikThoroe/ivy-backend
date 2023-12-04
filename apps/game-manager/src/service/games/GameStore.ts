import { api } from '@ivy-chess/api-schema'
import { Color, LiveGame, create, register } from '@ivy-chess/model'
import { store } from 'kv-store'
import { v4 as uuid } from 'uuid'
import { z } from 'zod'
import { GameTransaction } from './GameTransaction'

type CreateOptions = z.infer<typeof api.games.http.createSchema>

interface Subscription {
  id: string
  action: (game: LiveGame) => void
}

/**
 * A store for live games.
 *
 * Provides methods to create games and access
 * transactions for existing games.
 */
export class GameStore {
  private readonly db = store.take('games').take('live')

  private readonly subscriptions = new Map<string, Subscription[]>()

  /**
   * The shared instance of the game store.
   */
  public static readonly shared = new GameStore()

  //* API

  /**
   * Resets the connection status of all players.
   */
  public async resetConnections() {
    for (const id of await this.db.keys()) {
      const game = await this.db.take(id).read()

      if (game) {
        game.players.white.connected = false
        game.players.black.connected = false

        await this.db.take(id).write(game)
      }
    }
  }

  /**
   * Subscribes to updates of the game with the given id.
   * The given action will be called whenever the game is updated.
   *
   * @param game The id of the game.
   * @param action The action to be called when the game is updated.
   * @returns The id of the subscription.
   */
  public subscribe(game: string, action: (game: LiveGame) => void) {
    const subscriptions = this.subscriptions.get(game) ?? []
    const id = uuid()

    subscriptions.push({ id, action })
    this.subscriptions.set(game, subscriptions)

    return id
  }

  /**
   * Unsubscribes from updates of the game with the given id.
   *
   * @param game The id of the game.
   * @param id The id of the subscription.
   */
  public unsubscribe(game: string, id: string) {
    const subscriptions = this.subscriptions.get(game) ?? []
    const index = subscriptions.findIndex((subscription) => subscription.id === id)

    if (index !== -1) {
      subscriptions.splice(index, 1)
    }

    this.subscriptions.set(game, subscriptions)
  }

  /**
   * Fetches the ids of all games.
   *
   * @returns The ids of all games.
   */
  public async gameIds(): Promise<string[]> {
    return await this.db.keys()
  }

  /**
   * Fetches a game by its id.
   * Modifications on the returned value will not be persisted.
   * Use `transaction` to get a transaction for the game.
   *
   * @param id The id of the game.
   * @returns The game of the given id.
   */
  public async fetch(id: string): Promise<LiveGame> {
    const game = await this.db.take(id).read()

    if (!game) {
      throw new Error(`No game found for id '${id}'.`)
    }

    return game
  }

  /**
   * Fetches the id of the game the given player is in.
   * If the player is not in any game, this will throw an error.
   *
   * @param player The id of the player.
   * @returns The id of the game the player is in.
   * @throws If the player is not in any game.
   */
  public async gameId(player: string): Promise<string> {
    // TODO: Utilize index in database to speed up this query.

    for (const id of await this.db.keys()) {
      const game = await this.db.take(id).read()

      if (game && (game.players.white.id === player || game.players.black.id === player)) {
        return id
      }
    }

    throw new Error(`No game found for player '${player}'.`)
  }

  /**
   * Creates a transaction for the game with the given id.
   * The transaction can be used to modify the game state.
   * Changes will not be persisted until `commit` is called.
   *
   * @param id The id of the game.
   * @returns A transaction for the game.
   * @throws If no game is found for the given id.
   */
  public async transaction(id: string): Promise<GameTransaction> {
    return await GameTransaction.acquire(
      id,
      () => this.fetch(id),
      async (game) => {
        await this.db.take(game.id).write(game)

        const subscriptions = this.subscriptions.get(game.id) ?? []
        subscriptions.forEach((subscription) => subscription.action(game))
      },
    )
  }

  /**
   * Creates a new game with the given options.
   * The game will be persisted in the database.
   * Changes to the returned value will not be persisted.
   * Use `transaction` to get a transaction for the game.
   *
   * @param options The options for the game.
   * @returns The created game.
   */
  public async create(options: CreateOptions): Promise<LiveGame> {
    const game = create({ timeout: Number.MAX_SAFE_INTEGER, timeback: 0 })
    const playerIds = {
      white: register(game, 'white'),
      black: register(game, 'black'),
    }

    const player = (color: Color) => ({
      color: color,
      connected: false,
      id: playerIds[color],
      time: options.players[color].time,
      type: options.players[color].type,
    })

    const live: LiveGame = {
      game: game,
      isActive: true,
      events: [
        {
          type: 'create',
          message: 'Game created.',
          timestamp: Date.now(),
        },
      ],
      id: game.id,
      players: {
        white: player('white'),
        black: player('black'),
      },
    }

    await this.db.take(game.id).write(live)

    return live
  }
}
