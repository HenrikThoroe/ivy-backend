export function isConfig(json: any): json is EngineConfig {
  if ('id' in json && 'name' in json && 'versions' in json) {
    if (typeof json.id !== 'string') {
      return false
    }

    if (typeof json.name !== 'string') {
      return false
    }

    if (!Array.isArray(json.versions)) {
      return false
    }

    for (const version of json.versions) {
      if (!isEngineVersion(version)) {
        return false
      }
    }
  }

  return true
}

export function isEngineVersion(version: any): version is EngineVersion {
  const keys = ['major', 'minor', 'patch'] as const

  for (const key in keys) {
    if (!(key in version) || typeof version[key] !== 'number') {
      return false
    }
  }

  return true
}

export function getVersionPath(version: EngineVersion, engineId: string) {
  return `/${engineId}/${encodeVersion(version)}`
}

export function encodeVersion(version: EngineVersion, isURL: boolean = true) {
  if (isURL) {
    return `v${version.major}-${version.minor}-${version.patch}`
  }

  return `v${version.major}.${version.minor}.${version.patch}`
}

export function decodeVersion(str: string): EngineVersion {
  if (str.startsWith('v')) {
    str = str.substring(1)
  }

  const comps = str.split('-').map((comp) => parseInt(comp))

  if (comps.length !== 3) {
    throw new Error('Invalid version format')
  }

  return {
    major: comps[0],
    minor: comps[1],
    patch: comps[2],
  }
}

export interface EngineFlavour {
  capabilities: string[]
  os: string
  arch: string
  id: string
}

export function compareVersions(a: EngineVersion, b: EngineVersion): boolean {
  return a.major === b.major && a.minor === b.minor && a.patch === b.patch
}

export interface EngineVariation {
  version: EngineVersion
  flavours: EngineFlavour[]
}

export interface EngineVersion {
  major: number
  minor: number
  patch: number
}

export interface EngineConfig {
  name: string
  variations: EngineVariation[]
}

export interface EngineInstance {
  name: string
  version: EngineVersion
}
