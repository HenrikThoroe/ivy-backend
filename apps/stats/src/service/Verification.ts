import {
  EngineTestConfig,
  Replay,
  VerificationGroup,
  VerificationGroupState,
  VerificationResult,
  hashEngineTestConfig,
} from '@ivy-chess/model'
import { store } from 'kv-store'
import { Node } from './Node'

/**
 * A verification manages the statistics for a group of engine test configurations.
 * It is responsible for creating and updating the underlying data.
 * It also provides methods to query the current state and result of the verification.
 */
export class Verification {
  /**
   * The group of engine test configurations that are verified.
   */
  public readonly group: VerificationGroup

  private readonly nodes: Map<string, Node>

  private readonly replays: Set<string> = new Set()

  constructor(group: VerificationGroup) {
    this.group = group
    this.nodes = new Map()
    this.refreshNodes()
  }

  //* API

  /**
   * Saves the current state of the verification.
   * Will be automatically called when the verification is
   * updated in any way, but not when it was first created.
   */
  public async save(): Promise<void> {
    await this.store.take('config').write(this.group)
  }

  /**
   * Deletes all underlying data created by this verification.
   */
  public async erase(): Promise<void> {
    await this.store.take('config').erase()
    await Promise.all([...this.nodes.values()].map((node) => node.erase()))
  }

  /**
   * Updates the statistics of this verification with the given replay.
   * If the replay has already been processed by this verification,
   * it will be ignored.
   *
   * @param replay The replay to update the statistics with.
   */
  public async update(replay: Replay): Promise<void> {
    if (this.replays.has(replay.id)) {
      return
    }

    for (const node of this.nodes.values()) {
      await node.update(replay)
    }

    this.replays.add(replay.id)
  }

  /**
   * Adds a new engine test configuration to the group.
   * The configuration must not be a duplicate of an existing one or the base configuration.
   *
   * @param engine The engine test configuration to add.
   * @throws If the configuration is a duplicate or the base configuration.
   */
  public async add(engine: EngineTestConfig): Promise<void> {
    const hash = hashEngineTestConfig(engine)

    if (this.nodes.has(hash)) {
      throw new Error('Cannot add duplicate node.')
    }

    if (hashEngineTestConfig(this.group.base) === hash) {
      throw new Error('Cannot add base node.')
    }

    this.group.nodes.push(engine)
    this.refreshNodes()

    await this.store.take('config').update(() => ({
      nodes: this.group.nodes,
    }))
  }

  /**
   * Removes an engine test configuration from the group.
   * The configuration must not be the base configuration or the last remaining one.
   *
   * @param engine The engine test configuration to remove.
   * @throws If the configuration is the base configuration or the last remaining one.
   */
  public async remove(engine: EngineTestConfig): Promise<void> {
    const hash = hashEngineTestConfig(engine)

    if (!this.nodes.has(hash)) {
      throw new Error('Cannot remove non-existent node.')
    }

    if (hashEngineTestConfig(this.group.base) === hash) {
      throw new Error('Cannot remove base node.')
    }

    if (this.group.nodes.length === 1) {
      throw new Error('Cannot remove last node.')
    }

    this.group.nodes = this.group.nodes.filter((node) => hashEngineTestConfig(node) !== hash)
    this.refreshNodes()

    await this.store.take('config').update(() => ({
      nodes: this.group.nodes,
    }))
  }

  /**
   * Returns the current state of this verification.
   *
   * @returns The current state of this verification.
   */
  public async state(): Promise<VerificationGroupState> {
    const states = await Promise.all([...this.nodes.values()].map((node) => node.state()))
    const hasResult = states.every((state) => state.progress >= 1)

    return {
      hasResult,
      nodes: states,
    }
  }

  /**
   * Returns the current result of this verification.
   * If the verification has not finished yet, undefined is returned.
   * Check {@link VerificationGroupState.hasResult} to see if the verification has finished.
   *
   * @returns The current result of this verification.
   */
  public async result(): Promise<VerificationResult | undefined> {
    const state = await this.state()

    if (!state.hasResult) {
      return undefined
    }

    const results = await Promise.all([...this.nodes.values()].map((node) => node.result()))

    return {
      group: this.group.id,
      results,
    }
  }

  //* Private Methods

  private get store() {
    return store.take('stats').take('verification').take(this.group.id)
  }

  private refreshNodes() {
    this.nodes.clear()
    this.replays.clear()
    for (const node of this.group.nodes) {
      this.nodes.set(hashEngineTestConfig(node), new Node(this.group, node))
    }
  }
}
