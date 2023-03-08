import EngineConfig, {
  encodeVersion,
  EngineVersion,
  isConfig,
  VersionIncrement,
} from '../model/EngineConfig'
import { listBuckets, put, take } from './storage.service'

const configKey = 'config.json'

export async function pushVersion(id: string, increment: VersionIncrement, data: Buffer) {
  let config: EngineConfig
  let latest: EngineVersion

  try {
    config = await retrieveConfig(id)
  } catch {
    config = {
      name: id,
      versions: [],
    }
  }

  if (config.versions.length === 0) {
    latest = {
      major: 0,
      minor: 0,
      patch: 0,
    }
  } else {
    latest = { ...config.versions[config.versions.length - 1] }
  }

  latest[increment] += 1

  if (increment === 'major') {
    latest.minor = 0
    latest.patch = 0
  }

  if (increment === 'minor') {
    latest.patch = 0
  }

  config.versions.push(latest)

  const key = encodeVersion(latest)
  await put(id, key, data)
  await put(id, configKey, JSON.stringify(config, undefined, 4))
}

export async function retrieveConfig(id: string): Promise<EngineConfig> {
  const data = await take(id, configKey)
  const content = data.toString('utf-8')
  const json = JSON.parse(content)

  if (isConfig(json)) {
    return json
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
