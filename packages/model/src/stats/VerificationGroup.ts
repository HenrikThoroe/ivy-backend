import { EngineTestConfig } from '../test/TestSuite'

export interface VerificationGroup {
  id: string
  name: string
  base: EngineTestConfig
  nodes: EngineTestConfig[]
  threshold: number
}

export interface VerificationGroupState {
  hasResult: boolean
  nodes: NodeState[]
}

export interface VerificationResult {
  group: string
  results: NodeResult[]
}

export interface NodeState {
  node: EngineTestConfig
  progress: number
}

export interface Performance {
  wins: number
  draws: number
  defeats: number
  total: number
  winRatio: number
  win2DefeatRatio: number
}

export interface NodeResult {
  node: EngineTestConfig
  performance: {
    white: Performance
    black: Performance
    accumulated: Performance
  }
}
