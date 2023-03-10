import { EngineRuntimeConfig } from './EngineRuntimeConfig'

export type SlotOccupancy = EngineRuntimeConfig | 'human'

export type GameType = 'standard'

export interface GameConfig {
  slots: [SlotOccupancy, SlotOccupancy]
  timeout: number
  type: GameType
}
