import { EngineTestConfig } from '../test/TestSuite'

/**
 * A `VerificationGroup` is a set of engines
 * that are evaluated against a base engine.
 */
export interface VerificationGroup {
  /**
   * The id of the verification group.
   */
  id: string

  /**
   * The name of the verification group.
   */
  name: string

  /**
   * The base engine to compare against.
   */
  base: EngineTestConfig

  /**
   * The engines to compare against the base engine.
   */
  nodes: EngineTestConfig[]

  /**
   * The minimum number of games required
   * until a result is considered valid.
   * The games are counted for each node seperately.
   */
  threshold: number
}

/**
 * The state of a node.
 */
export interface NodeState {
  /**
   * The engine that is being tested.
   */
  node: EngineTestConfig

  /**
   * The progress of the node until a result will be availble.
   */
  progress: number
}

/**
 * The state of a `VerificationGroup`.
 */
export interface VerificationGroupState {
  /**
   * Whether the verification group has a result.
   */
  hasResult: boolean

  /**
   * The state of each node.
   */
  nodes: NodeState[]
}

/**
 * The performance of an engine compared to another engine.
 */
export interface Performance {
  /**
   * The number of wins.
   */
  wins: number

  /**
   * The number of draws.
   */
  draws: number

  /**
   * The number of defeats.
   */
  defeats: number

  /**
   * The total number of games.
   */
  total: number

  /**
   * The win ratio of the engine.
   * `wins / total`
   */
  winRatio: number

  /**
   * The ratio of wins against defeats.
   * Will be more expressive when two engines
   * perform rughly the same.
   * `wins / defeats`
   */
  win2DefeatRatio: number
}

/**
 * The result of a node.
 */
export interface NodeResult {
  /**
   * The engine that is being tested.
   */
  node: EngineTestConfig

  /**
   * The performance of the engine compared to the base engine.
   */
  performance: {
    /**
     * The performance of the engine as white.
     */
    white: Performance

    /**
     * The performance of the engine as black.
     */
    black: Performance

    /**
     * The accumulated performance of the engine.
     */
    accumulated: Performance
  }
}

/**
 * The result of a `VerificationGroup`.
 */
export interface VerificationResult {
  /**
   * The id of the verification group.
   */
  group: string

  /**
   * The results for each node.
   */
  results: NodeResult[]
}
