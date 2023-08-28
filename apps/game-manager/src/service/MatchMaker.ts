import { ChessGame } from './ChessGame'
import { Client } from './Client'

interface Player {
  client: Client
  id: string
}

interface Game {
  game: string
  players: [Player | undefined, Player | undefined]
}

/**
 * The match maker provides an API to connect games with clients
 * that participate in the game.
 */
export class MatchMaker {
  private readonly clients: Map<string, Client> = new Map()

  private readonly games: Map<string, Game> = new Map()

  //* API

  /**
   * Finds the player id for the given client.
   *
   * @param client The client to find the id for.
   * @returns The id of the player or undefined if the client is not registered.
   */
  public id(client: Client): string | undefined {
    for (const [id, c] of this.clients.entries()) {
      if (c === client) {
        return id
      }
    }

    return undefined
  }

  /**
   * Adds a client with a player id in a game.
   *
   * @param game The id of the game the client takes part in.
   * @param id The id of the player.
   * @param client The client to add.
   * @throws If the client is already added, the game does not exist or the game is full.
   */
  public add(game: string, id: string, client: Client) {
    if (this.clients.has(id)) {
      throw new Error('Client already added.')
    }

    const match = this.games.get(game)

    if (!match) {
      throw new Error('Game not found.')
    }

    if (match.players[0] === undefined) {
      match.players[0] = { client, id }
    } else if (match.players[1] === undefined) {
      match.players[1] = { client, id }
    } else {
      throw new Error('Game is full.')
    }

    this.clients.set(id, client)
  }

  /**
   * Removes a client from the match maker.
   * If the client is part of a game, the game will be removed as well
   * if the other player has also disconnected.
   *
   * @param id The id of the client to remove.
   */
  public remove(id: string) {
    if (!this.clients.has(id)) {
      throw new Error('Client not found.')
    }

    this.clients.delete(id)

    for (const match of this.games.values()) {
      if (match.players[0]?.id === id) {
        match.players[0] = undefined
      } else if (match.players[1]?.id === id) {
        match.players[1] = undefined
      }

      if (match.players[0] === undefined && match.players[1] === undefined) {
        this.games.delete(match.game)
      }
    }
  }

  /**
   * Finds the game with the given id.
   *
   * @param game The id of the game.
   * @returns The game.
   */
  public async game(game: string): Promise<ChessGame> {
    const match = this.games.get(game)

    if (!match) {
      this.games.set(game, {
        game,
        players: [undefined, undefined],
      })
    }

    return await ChessGame.load(game)
  }

  /**
   * Finds the client of the opponent of the given player.
   *
   * @param game The id of the game.
   * @param id The id of the player.
   * @returns The client of the opponent.
   * @throws If the game does not exist or the player is not part of the game.
   */
  public opponent(game: string, id: string): Client | undefined {
    const match = this.games.get(game)

    if (!match) {
      throw new Error('Game not found.')
    }

    if (match.players[0]?.id !== id && match.players[1]?.id !== id) {
      throw new Error('Player not found.')
    }

    return match.players.find((player) => player?.id !== id)?.client
  }

  /**
   * Finds the client of the white player.
   *
   * @param id The id of the game.
   * @returns The client of the white player.
   * @throws If the game does not exist.
   */
  public async white(id: string): Promise<Client | undefined> {
    const match = this.games.get(id)

    if (!match) {
      throw new Error('Game not found.')
    }

    const game = await ChessGame.load(id)
    const white = game.white

    if (!white) {
      return undefined
    }

    return match.players.find((player) => player?.id === white)?.client
  }
}
