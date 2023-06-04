import { EngineInstance } from '../configs/EngineConfig'

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
