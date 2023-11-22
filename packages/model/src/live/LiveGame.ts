import { ColorMap, Game } from '../game/model/Game'
import { LiveGameEvent } from './LiveGameEvent'
import { Player } from './Player'

/**
 * A live game is a game that is played between two players.
 * The players can be either engines or humans.
 */
export interface LiveGame {
  /**
   * The state of the chess game, which is played
   */
  game: Game

  /**
   * The unique ID of the game
   */
  id: string

  /**
   * The players that are registered.
   * A player can either be an engine or a human.
   */
  players: ColorMap<Player>

  /**
   * Whether the game is still active.
   * Active games will continue to accept state
   * updates.
   */
  isActive: boolean

  /**
   * A list of all events that occured during the game.
   * Events include connection or disconnection of clients,
   * any sent or recieved messages, game state changes...
   */
  events: LiveGameEvent[]
}
