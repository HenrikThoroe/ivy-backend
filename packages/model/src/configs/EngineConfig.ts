//* Type Checking

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

//* Convinience

export function getVersionPath(version: EngineVersion, engineId: string) {
  return `/${engineId}/${encodeVersion(version)}`
}

export function encodeVersion(version: EngineVersion, isURL: boolean = true) {
  if (isURL) {
    return `v${version.major}-${version.minor}-${version.patch}`
  }

  return `v${version.major}.${version.minor}.${version.patch}`
}

export function decodeVersion(value: string): EngineVersion {
  const error = Error(`Could not parse ${value} as engine version.`)

  if (!value.startsWith('v')) {
    throw error
  }

  const parts = value
    .substring(1)
    .split(/(\-|\.)/)
    .filter((part) => !['.', '-'].includes(part))

  if (parts.length !== 3) {
    throw error
  }

  return {
    major: parseInt(parts[0]),
    minor: parseInt(parts[1]),
    patch: parseInt(parts[2]),
  }
}

//* Types

export type VersionIncrement = keyof EngineVersion

export interface EngineVersion {
  major: number
  minor: number
  patch: number
}

export interface EngineConfig {
  name: string
  versions: EngineVersion[]
}
