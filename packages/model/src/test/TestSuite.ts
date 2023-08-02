import { EngineInstance } from '../configs/EngineConfig'
import crypto from 'crypto'

export interface EngineTestConfig extends EngineInstance {
  timeControl: {
    type: 'depth' | 'movetime'
    value: number
  }
  options: {
    threads: number
    hash: number
  }
}

export interface TestSuite {
  name: string
  id: string
  iterations: number
  engines: [EngineTestConfig, EngineTestConfig]
}

export function hashEngineTestConfig(config: EngineTestConfig): string {
  const hash = crypto.createHash('sha256')

  hash.update(config.name)
  hash.update(config.version.major.toString())
  hash.update(config.version.minor.toString())
  hash.update(config.version.patch.toString())
  hash.update(config.timeControl.type)
  hash.update(config.timeControl.value.toString())
  hash.update(config.options.threads.toString())
  hash.update(config.options.hash.toString())

  return hash.digest('hex')
}
