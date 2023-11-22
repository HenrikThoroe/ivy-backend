import { Color } from '../game/model/Game'
import { UCILog } from '../replay/model/Replay'

/**
 * A player is either a human or an engine.
 *
 * A player can be connected or disconnected.
 * If the player is an engine, it can have an UCI log.
 * Players can have a fixed time for each move.
 */
export interface Player {
  /**
   * The player id. Used to reconnect clients.
   */
  id: string

  /**
   * Whether the player has a connected client.
   */
  connected: boolean

  /**
   * The type of the player instance.
   */
  type: 'human' | 'engine'

  /**
   * The color the player is using.
   */
  color: Color

  /**
   * The UCI Logs of the player.
   * Exist only when the type is 'engine'
   */
  logs?: UCILog

  /**
   * The fixed time for each move in ms.
   * If undefined, the time controls from the underlying game state are used.
   * This value overrides all computed values from the game.
   *
   * If this value is set to 100ms, but there are only 50ms left in the game for this player,
   * this value should be used even if it would mean a loss.
   *
   * Mostly used for engines.
   */
  time?: number
}
