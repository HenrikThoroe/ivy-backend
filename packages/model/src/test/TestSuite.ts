import { EngineInstance } from '../configs/EngineConfig'
import crypto from 'crypto'

/**
 * An engine test configuration is extends an {@link EngineInstance} with
 * with additional runtime atributes.
 */
export interface EngineTestConfig extends EngineInstance {
  /**
   * Definition of the time control.
   * Sets whether the engine should search for a fixed amounnt of time or
   * until a certain depth is reached.
   */
  timeControl: {
    type: 'depth' | 'movetime'
    value: number
  }

  /**
   * Additional options for the engine.
   * These options are sent to the engine
   * after startup usng the UCI protocol.
   */
  options: {
    threads: number
    hash: number
  }
}

/**
 * A test suite defines a set of games
 * between two {@link EngineTestConfig}s.
 */
export interface TestSuite {
  /**
   * The name of the test suite.
   */
  name: string

  /**
   * The id of the test suite.
   */
  id: string

  /**
   * The number of games to play.
   */
  iterations: number

  /**
   * The engines to play against each other.
   */
  engines: [EngineTestConfig, EngineTestConfig]
}

/**
 * Hashes an {@link EngineTestConfig} to a string.
 *
 * @param config The engine test configuration to hash.
 * @returns The hash of the engine test configuration.
 */
export function hashEngineTestConfig(config: EngineTestConfig): string {
  const hash = crypto.createHash('sha256')

  hash.update(config.name)
  hash.update(config.version.major.toString())
  hash.update(config.version.minor.toString())
  hash.update(config.version.patch.toString())
  hash.update(config.timeControl.type)
  hash.update(config.timeControl.value.toString())
  hash.update(config.options.threads.toString())
  hash.update(config.options.hash.toString())

  return hash.digest('hex')
}
