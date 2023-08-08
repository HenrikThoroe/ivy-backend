import { EngineTestConfig } from '@ivy-chess/model'

interface FetchPayload {
  target: string
}

export interface ReplayByConfigFetchPayload extends FetchPayload {
  engines: [EngineTestConfig, EngineTestConfig]
}
