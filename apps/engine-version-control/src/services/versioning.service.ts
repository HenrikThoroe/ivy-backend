import {
  EngineConfig,
  encodeVersion,
  EngineVersion,
  isConfig,
  EngineFlavour,
  compareVersions,
} from 'model'
import { deleteBucket, deleteKey, listBuckets, listKeys, put, take } from './storage.service'
import crypto from 'crypto'

const configKey = 'config.json'

type FlavourData = Omit<EngineFlavour, 'id'>

function hash(flavour: FlavourData, version: EngineVersion, engine: string) {
  const capabilities = flavour.capabilities
    .map((a) => a.toLowerCase())
    .sort((a, b) => a.localeCompare(b))

  const hash = crypto
    .createHash('sha256')
    .update(engine)
    .update(encodeVersion(version))
    .update(flavour.arch)
    .update(flavour.os)

  for (const cap of capabilities) {
    hash.update(cap + '|')
  }

  return hash.digest('hex')
}

export async function addFlavour(
  engine: string,
  version: EngineVersion,
  flavour: FlavourData,
  data: Buffer
) {
  const id = hash(flavour, version, engine)
  const config = await retrieveConfig(engine, true)
  const variation = config.variations.find((v) => compareVersions(v.version, version))

  if (!variation) {
    config.variations.push({
      version,
      flavours: [{ ...flavour, id }],
    })
  } else {
    if (variation.flavours.find((f) => f.id === id)) {
      throw new Error(
        `Engine '${engine}' has already a configuration with the same version and capabilities.`
      )
    }

    variation.flavours.push({ ...flavour, id })
  }

  await put(engine, id, data)
  await put(engine, configKey, JSON.stringify(config, undefined, 4), 'text/json')
}

export async function retrieveConfig(id: string, create: boolean = false): Promise<EngineConfig> {
  try {
    const data = await take(id, configKey)
    const content = data.toString('utf-8')
    const json = JSON.parse(content)

    if (isConfig(json)) {
      return json
    }
  } catch (e) {
    if (create) {
      return {
        name: id,
        variations: [],
      }
    }

    throw e
  }

  throw new Error(`Could not resolve ${id} as valid engine id.`)
}

export async function retrieveAllConfigs(): Promise<EngineConfig[]> {
  const buckets = await listBuckets()
  const configs: EngineConfig[] = []

  for (const bucket of buckets) {
    try {
      configs.push(await retrieveConfig(bucket))
    } catch (e) {
      continue
    }
  }

  return configs
}

export async function removeInstance(engine: string, id: string) {
  const config = await retrieveConfig(engine, true)
  const variation = config.variations.find((v) => v.flavours.find((f) => f.id === id))

  if (!variation) {
    throw new Error(`Could not find flavour with id ${id} for engine ${engine}`)
  }

  variation.flavours = variation.flavours.filter((f) => f.id !== id)

  if (variation.flavours.length === 0) {
    config.variations = config.variations.filter(
      (v) => !compareVersions(v.version, variation.version)
    )
  }

  await put(engine, configKey, JSON.stringify(config, undefined, 4), 'text/json')
  await deleteKey(engine, id)
  return await removeEmptyConfig(engine)
}

export async function removeEmptyConfig(id: string) {
  const keys = await listKeys(id)

  if (keys.length > 1) {
    return false
  }

  if (keys.length === 1 && keys[0] !== configKey) {
    return false
  }

  if (keys.length === 1 && keys[0] === configKey) {
    await deleteKey(id, configKey)
  }

  await deleteBucket(id)

  return true
}
