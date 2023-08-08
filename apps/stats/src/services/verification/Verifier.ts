import {
  Color,
  EngineTestConfig,
  Replay,
  VerificationGroup,
  VerificationGroupState,
  VerificationResult,
  hashEngineTestConfig,
} from '@ivy-chess/model'
import { Queue } from 'bullmq'
import { ReplayByConfigFetchPayload, queueName } from 'com'
import { redis } from 'kv-store'
import { Node, ReplayNodeData } from './Node'

const dataScope = redis.sub('stats').sub('verification')

const fetchQueue = new Queue(queueName('replay', 'fetch'), {
  connection: {
    host: process.env.REDIS_HOST!,
    port: +process.env.REDIS_PORT!,
  },
})

export class Verifier {
  private readonly nodes: Map<string, Node>

  private group: VerificationGroup

  constructor(group: VerificationGroup, nodes: Map<string, Node>) {
    this.group = group
    this.nodes = nodes
  }

  public static async for(id: string): Promise<Verifier> {
    if (!(await dataScope.sub(id).has('config'))) {
      throw new Error('No verification group for given id.')
    }

    const group = await dataScope.sub(id).fetch<VerificationGroup>('config')
    const nodes = await Promise.all(
      group.nodes.map((node) => Node.create(dataScope.sub(group.id), node))
    )

    return new Verifier(group, new Map(nodes.map((node) => [node.hash, node])))
  }

  public static async new(group: VerificationGroup): Promise<Verifier> {
    const nodes = [hashEngineTestConfig(group.base), ...group.nodes.map(hashEngineTestConfig)]

    if (new Set(nodes).size !== nodes.length) {
      throw new Error('Cannot create verification group with duplicate nodes.')
    }

    await dataScope.sub(group.id).save('config', group)
    return await Verifier.for(group.id)
  }

  public static async all(): Promise<Verifier[]> {
    const keys = await dataScope.list()
    const groups: VerificationGroup[] = []

    for (const scope of keys.map((group) => dataScope.sub(group))) {
      if (await scope.has('config')) {
        const config = await scope.fetch<VerificationGroup>('config')
        groups.push(config)
      }
    }

    return await Promise.all(groups.map((group) => Verifier.for(group.id)))
  }

  public get verificationGroup(): VerificationGroup {
    return { ...this.group }
  }

  public async delete(): Promise<void> {
    await Promise.all(Array.from(this.nodes.values()).map((n) => n.delete()))

    const scope = dataScope.sub(this.group.id)
    const keys = await scope.list()

    for (const key of keys) {
      await scope.delete(key)
    }
  }

  public async addNode(config: EngineTestConfig): Promise<void> {
    const confHash = hashEngineTestConfig(config)
    const exists = this.group.nodes.map(hashEngineTestConfig).some((hash) => hash === confHash)
    const isBase = hashEngineTestConfig(this.group.base) === confHash

    if (exists || isBase) {
      throw new Error('Cannot add duplicate node.')
    }

    const node = await Node.create(dataScope.sub(this.group.id), config)

    this.nodes.set(node.hash, node)
    await this.update({ nodes: [...this.group.nodes, config] })
  }

  public async deleteNode(config: EngineTestConfig): Promise<void> {
    const confHash = hashEngineTestConfig(config)
    const exists = this.group.nodes.map(hashEngineTestConfig).some((hash) => hash === confHash)
    const isBase = hashEngineTestConfig(this.group.base) === confHash
    const node = this.nodes.get(confHash)

    if (!exists || isBase || !node) {
      throw new Error('Cannot delete non-existent node.')
    }

    if (this.nodes.size === 1) {
      throw new Error('Cannot delete last node.')
    }

    this.nodes.delete(confHash)
    await node.delete()
    await this.update({
      nodes: this.group.nodes.filter((node) => hashEngineTestConfig(node) !== confHash),
    })
  }

  public async addReplay(replay: Replay): Promise<void> {
    const data = this.parseReplay(replay)

    if (!data) {
      return
    }

    const node = this.nodes.get(hashEngineTestConfig(data.node))

    if (!node || !(await node.accepts(data))) {
      return
    }

    await node.add(data)
  }

  public async requestReplays(): Promise<void> {
    await fetchQueue.addBulk(
      this.fetchPayload.map((payload) => ({ name: 'request', data: payload }))
    )
  }

  public async getState(): Promise<VerificationGroupState> {
    const nodeResults = await Promise.all(
      Array.from(this.nodes.values()).map((n) => n.state(this.group.threshold))
    )
    const hasResult = nodeResults.every((node) => node.progress >= 1)

    return {
      hasResult,
      nodes: nodeResults,
    }
  }

  public async getResult(): Promise<VerificationResult | undefined> {
    const state = await this.getState()

    if (!state.hasResult) {
      return undefined
    }

    const results = await Promise.all(Array.from(this.nodes.values()).map((n) => n.result()))

    return {
      group: this.group.id,
      results,
    }
  }

  private async update(group: Partial<VerificationGroup>): Promise<void> {
    this.group = { ...this.group, ...group }
    await dataScope.sub(this.group.id).save('config', this.group)
  }

  private parseReplay(replay: Replay): ReplayNodeData | undefined {
    const baseHash = hashEngineTestConfig(this.group.base)
    const whiteHash = hashEngineTestConfig(replay.engines.white)
    const blackHash = hashEngineTestConfig(replay.engines.black)
    let base: Color
    let nodeHash: string

    if (baseHash === whiteHash) {
      base = 'white'
      nodeHash = blackHash
    } else if (baseHash === blackHash) {
      base = 'black'
      nodeHash = whiteHash
    } else {
      return undefined
    }

    const node = this.group.nodes.find((node) => hashEngineTestConfig(node) === nodeHash)

    if (!node) {
      return undefined
    }

    return {
      color: base === 'white' ? 'black' : 'white',
      replayId: replay.id,
      result:
        replay.result.winner === 'draw' ? 'draw' : replay.result.winner === base ? 'defeat' : 'win',
      reason: replay.result.reason,
      node,
    }
  }

  private get fetchPayload(): ReplayByConfigFetchPayload[] {
    const pairs = this.group.nodes.map((node) => [this.group.base, node] as const)

    return pairs.map(([base, node]) => ({
      target: queueName('stats', 'replay'),
      engines: [base, node],
    }))
  }
}
