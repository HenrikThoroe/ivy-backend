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

export type VersionIncrement = keyof EngineVersion

export interface EngineVersion {
  major: number
  minor: number
  patch: number
}

export default interface EngineConfig {
  name: string
  versions: EngineVersion[]
}
