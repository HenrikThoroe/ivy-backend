import { EngineInstance } from '../../configs/EngineConfig'
import { GameResult } from '../../game/analysis/end'
import { Color, Move } from '../../game/model/Game'
import { TestDriver } from '../../test/TestDriver'
import { v4 as uuidv4 } from 'uuid'

export interface UCIMessage {
  type: 'recv' | 'send'
  value: string
}

export interface UCILog {
  messages: UCIMessage[]
}

export interface MoveInfo {
  move: Move
  fen: string
  details: Partial<{
    depth: number
    selDepth: number
    time: number
    nodes: number
    pv: string[]
    multiPv: number
    score: {
      type: 'cp' | 'mate'
      value: number
      lowerbound: boolean
      upperbound: boolean
    }
    currentMove: string
    currentMoveNumber: number
    hashFull: number
    nps: number
    tbHits: number
    sbhits: number
    cpuLoad: number
    string: string
    refutation: string[]
    currline: string[]
  }>
}

export interface ReplayLog {
  replay: string
  white: UCILog
  black: UCILog
}

export interface Replay {
  id: string
  date: Date
  driver: TestDriver
  engines: {
    white: EngineInstance
    black: EngineInstance
  }
  result: {
    winner: Color | 'draw'
    reason: GameResult | 'rule-violation'
  }
  history: MoveInfo[]
}

export function createReplay(data: Omit<Replay, 'id' | 'date' | 'version'>): Replay {
  return {
    id: uuidv4(),
    date: new Date(),
    ...data,
  }
}
