import { GameResult } from '../../game/analysis/end'
import { Color, Move } from '../../game/model/Game'
import { TestDriver } from '../../test/TestDriver'
import { v4 as uuidv4 } from 'uuid'
import { EngineTestConfig } from '../../test/TestSuite'

/**
 * An UCI Message.
 * Consists of either a sent value or a received value.
 */
export interface UCIMessage {
  /**
   * The type of the message.
   */
  type: 'recv' | 'send'

  /**
   * The value of the message.
   */
  value: string
}

/**
 * An UCI Log consisting of all messages sent and received.
 */
export interface UCILog {
  /**
   * The messages of the log.
   * Contains all communication between the
   * engine and the driver.
   */
  messages: UCIMessage[]
}

/**
 * Information the engine provides for each move.
 * Maps the UCI protocol.
 */
export interface MoveInfo {
  move: Move
  fen: string
  details: Partial<{
    depth: number
    selDepth: number
    time: number
    nodes: number
    pv: string[]
    multiPv: number
    score: {
      type: 'cp' | 'mate'
      value: number
      lowerbound: boolean
      upperbound: boolean
    }
    currentMove: string
    currentMoveNumber: number
    hashFull: number
    nps: number
    tbHits: number
    sbhits: number
    cpuLoad: number
    string: string
    refutation: string[]
    currline: string[]
  }>
}

/**
 * A replay log consisting of the UCI logs of both engines.
 */
export interface ReplayLog {
  /**
   * The id of the replay.
   */
  replay: string

  /**
   * The logs for the engine playing as white.
   */
  white: UCILog

  /**
   * The logs for the engine playing as black.
   */
  black: UCILog
}

/**
 * A replay contains all data collected for
 * a game between two engines.
 */
export interface Replay {
  /**
   * The id of the replay.
   */
  id: string

  /**
   * The date and time at which the replay was created.
   */
  date: Date

  /**
   * The test driver used to run the replay.
   */
  driver: TestDriver

  /**
   * The engines that played the replay.
   */
  engines: {
    white: EngineTestConfig
    black: EngineTestConfig
  }

  /**
   * The final result of the replay.
   */
  result: {
    /**
     * The color of the winning engine.
     */
    winner: Color | 'draw'

    /**
     * The reason for the result.
     */
    reason: GameResult | 'rule-violation'
  }

  /**
   * List of all played moves.
   */
  history: MoveInfo[]
}

/**
 * Creates a new replay object.
 *
 * @param data The data to create the replay from.
 * @returns The created replay.
 */
export function createReplay(data: Omit<Replay, 'id' | 'date' | 'version'>): Replay {
  return {
    id: uuidv4(),
    date: new Date(),
    ...data,
  }
}
