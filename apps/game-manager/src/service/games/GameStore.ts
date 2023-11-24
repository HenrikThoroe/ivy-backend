import { api } from '@ivy-chess/api-schema'
import { Color, LiveGame, create, register } from '@ivy-chess/model'
import { store } from 'kv-store'
import { GameTransaction } from './GameTransaction'

type CreateOptions = Zod.infer<typeof api.games.http.createSchema>

/**
 * A store for live games.
 *
 * Provides methods to create games and access
 * transactions for existing games.
 */
export class GameStore {
  private readonly db = store.take('games').take('live')

  //* API

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
    const game = await this.fetch(id)

    return new GameTransaction(game, async (game) => {
      await this.db.take(game.id).write(game)
    })
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
    const game = create({ timeout: options.time ?? Infinity, timeback: options.timeback ?? 0 })
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
