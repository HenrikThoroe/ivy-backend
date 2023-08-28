import { shared } from '@ivy-chess/api-schema'
import {
  EngineConfig,
  EngineFlavour,
  EngineInstance,
  EngineVariation,
  EngineVersion,
  compareVersions,
  encodeVersion,
} from '@ivy-chess/model'
import { createHash } from 'crypto'
import { FileStore } from './FileStore'

const configKey = 'config.json'

/**
 * A store for engine binaries and their configurations.
 */
export class EngineStore {
  private readonly engine: string

  private readonly store: FileStore

  constructor(engine: string) {
    this.engine = engine
    this.store = new FileStore(engine)
  }

  //* API

  /**
   * Lists all engine ids in the store.
   * Ids can be used to initialize a new EngineStore.
   *
   * @returns A list of all engine ids in the store.
   */
  public static async all(): Promise<string[]> {
    const schema = shared.engine.engineConfigSchema
    const buckets = await FileStore.all()
    const stores = buckets.map((bucket) => new FileStore(bucket))
    const tasks = stores.map((store) => store.read(configKey, schema))
    const configs = await Promise.all(tasks)

    return configs.map((config) => config.name)
  }

  /**
   * Initializes the store with a default configuration and
   * writes the configuration to the store.
   *
   * If the store already has a configuration, this method does nothing.
   */
  public async init(): Promise<void> {
    if (await this.store.has(configKey)) {
      return
    }

    const config: EngineConfig = {
      name: this.engine,
      variations: [],
    }

    await this.store.write(configKey, shared.engine.engineConfigSchema, config)
  }

  /**
   * Reads the engine binary for the given flavour.
   *
   * @param flavour The id of the flavour to read.
   * @returns The engine binary.
   * @throws If the flavour does not exist.
   */
  public async binary(flavour: string): Promise<Buffer> {
    return this.store.read(flavour, 'buffer')
  }

  /**
   * Finds the variation for the given version.
   *
   * @param version The version to find the variation for.
   * @returns The variation for the given version.
   * @throws If the variation does not exist.
   */
  public async variation(version: EngineVersion): Promise<EngineVariation> {
    const config = await this.config()
    const variation = config.variations.find((v) => compareVersions(v.version, version))

    if (!variation) {
      throw new Error(`Could not find variation for version ${encodeVersion(version)}.`)
    }

    return variation
  }

  /**
   * Finds the configuration of the engine.
   *
   * @returns The configuration of the engine.
   */
  public async config(): Promise<EngineConfig> {
    const schema = shared.engine.engineConfigSchema
    const store = new FileStore(this.engine)
    const config = await store.read(configKey, schema)

    return config
  }

  /**
   * Deletes the engine including the configuration and all binaries.
   */
  public async delete(): Promise<void> {
    await this.store.delete()
  }

  /**
   * Removes a flavour from the store.
   * Will edit the configuration and remove the binary from the store.
   *
   * @param flavour The id of the flavour to remove.
   * @return The updated configuration.
   */
  public async remove(flavour: string): Promise<EngineConfig> {
    const config = await this.config()
    const variation = config.variations.find((v) => v.flavours.some((f) => f.id === flavour))

    if (!variation) {
      throw new Error(`Could not find flavour ${flavour}.`)
    }

    variation.flavours = variation.flavours.filter((f) => f.id !== flavour)

    if (variation.flavours.length === 0) {
      config.variations = config.variations.filter(
        (v) => !compareVersions(v.version, variation.version),
      )
    }

    await this.store.write(configKey, shared.engine.engineConfigSchema, config)
    await this.store.remove(flavour)

    return config
  }

  /**
   * Adds a flavour to the store.
   * Will edit the configuration and add the binary to the store.
   *
   * @param flavour The flavour to add.
   * @param version The version of the flavour.
   * @param data The binary data of the flavour.
   * @throws If the flavour already exists.
   */
  public async add(flavour: Omit<EngineFlavour, 'id'>, version: EngineVersion, data: Buffer) {
    const config = await this.config()
    const hasVersion = config.variations.some((v) => compareVersions(v.version, version))

    if (!hasVersion) {
      config.variations.push({
        version,
        flavours: [],
      })
    }

    const variation = config.variations.find((v) => compareVersions(v.version, version))

    if (!variation) {
      throw new Error(`Could not find variation for version ${encodeVersion(version)}.`)
    }

    const id = this.hash(flavour, { name: config.name, version })
    const hasFlavour = variation.flavours.some((f) => f.id === id)

    if (hasFlavour) {
      throw new Error(`Could not add flavour, because it already exists.`)
    }

    variation.flavours.push({ ...flavour, id })
    await this.store.write(configKey, shared.engine.engineConfigSchema, config)
    await this.store.write(id, 'buffer', data)
  }

  //* Private Methods

  private hash(flavour: Omit<EngineFlavour, 'id'>, instance: EngineInstance): string {
    const hash = createHash('sha256')
    const normalizedCapabilities = flavour.capabilities
      .map((c) => c.toLowerCase())
      .sort()
      .join(',')

    hash.update(instance.name)
    hash.update(encodeVersion(instance.version))
    hash.update(flavour.os)
    hash.update(flavour.arch)
    hash.update(normalizedCapabilities)

    return hash.digest('hex')
  }
}
