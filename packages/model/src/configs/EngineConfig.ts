/**
 * Semantic versioning of an engine.
 */
export interface EngineVersion {
  major: number
  minor: number
  patch: number
}

/**
 * A flavour requirements of an engine
 * for the system it's running on.
 *
 * For example a specific engine version
 * requires Linux as OS running on x86_64
 * with support for AVX2.
 */
export interface EngineFlavour {
  /**
   * List of capabilities required by the engine.
   */
  capabilities: string[]

  /**
   * The OS required by the engine.
   */
  os: string

  /**
   * The architecture required by the engine.
   */
  arch: string

  /**
   * A unique ID of the flavour.
   * It should be bound to the engine, version and flavour.
   */
  id: string
}

/**
 * An engine variation is a specific version of an engine
 * with a set of flavours. A flavour defines which
 * systems can run the engine.
 */
export interface EngineVariation {
  /**
   * The version of the engine.
   */
  version: EngineVersion

  /**
   * Available flavours of the engine.
   */
  flavours: EngineFlavour[]
}

/**
 * Configuration for an engine.
 * An engine is identified by a unique name.
 * Each engine can have multiple variations.
 *
 * @see {@link EngineVariation}
 */
export interface EngineConfig {
  /**
   * The unique id of the engine.
   */
  name: string

  /**
   * A list of available variations.
   */
  variations: EngineVariation[]
}

/**
 * An engine instance is a specific version of an engine
 */
export interface EngineInstance {
  /**
   * The engine name
   */
  name: string

  /**
   * The engine version
   */
  version: EngineVersion
}

/**
 * Checks if the given object is a valid engine config.
 *
 * @param json The object to check.
 * @returns `true` if the object is a valid engine config.
 */
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

/**
 * Checks if the given object is a valid engine version.
 *
 * @param version The object to check.
 * @returns `true` if the object is a valid engine version.
 */
export function isEngineVersion(version: any): version is EngineVersion {
  const keys = ['major', 'minor', 'patch'] as const

  for (const key in keys) {
    if (!(key in version) || typeof version[key] !== 'number') {
      return false
    }
  }

  return true
}

/**
 * Encodes the given version to a string.
 *
 * @param version The version to encode.
 * @param isURL If true, the version is encoded for a URL using dashes.
 * @returns v<major>.<minor>.<patch> or v<major>-<minor>-<patch>
 */
export function encodeVersion(version: EngineVersion, isURL: boolean = true) {
  if (isURL) {
    return `v${version.major}-${version.minor}-${version.patch}`
  }

  return `v${version.major}.${version.minor}.${version.patch}`
}

/**
 * Decodes a version string to an object.
 *
 * @param str The version string to decode. Could start with 'v' but not required.
 * @returns The decoded version.
 */
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

/**
 * Compares to {@link EngineVersion} objects.
 *
 * @param a The first version.
 * @param b The second version.
 * @returns `true` if the versions are value-equal.
 */
export function compareVersions(a: EngineVersion, b: EngineVersion): boolean {
  return a.major === b.major && a.minor === b.minor && a.patch === b.patch
}
