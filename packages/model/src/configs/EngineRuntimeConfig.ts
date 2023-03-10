import { EngineVersion } from './EngineConfig'

export interface EngineRuntimeConfig {
  moveTimeout: number
  engine: string
  threads: number
  version: EngineVersion
}
