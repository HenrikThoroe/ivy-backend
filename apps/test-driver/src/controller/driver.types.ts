import { Literal, Record, Number, String, Optional, Array, Boolean, Union, Tuple } from 'runtypes'

const MoveInfoBody = Record({
  move: Optional(String),
  depth: Optional(Number),
  selDepth: Optional(Number),
  time: Optional(Number),
  nodes: Optional(Number),
  pv: Optional(Array(String)),
  multiPv: Optional(Number),
  score: Optional(
    Record({
      type: Union(Literal('cp'), Literal('mate')),
      value: Number,
      lowerbound: Boolean,
      upperbound: Boolean,
    })
  ),
  currentMove: Optional(String),
  currentMoveNumber: Optional(String),
  hashFull: Optional(Number),
  nps: Optional(Number),
  tbhits: Optional(Number),
  sbhits: Optional(Number),
  cpuload: Optional(Number),
  string: Optional(String),
  refutation: Optional(Array(String)),
  currline: Optional(Array(String)),
})

export const RegisterBody = Record({
  command: Literal('register'),
  name: String,
  deviceId: Optional(String),
  hardware: Record({
    cpu: Optional(
      Array(
        Record({
          model: Optional(String),
          vendor: Optional(String),
          cores: Optional(Number),
          threads: Optional(Number),
          capabilities: Optional(Array(String)),
        })
      )
    ),
    memory: Optional(Number),
    gpu: Optional(
      Array(
        Record({
          model: Optional(String),
          vendor: Optional(String),
          memory: Optional(Number),
        })
      )
    ),
    model: Optional(String),
    arch: Optional(String),
    os: Optional(String),
  }),
})

export const ReportBody = Record({
  command: Literal('report'),
  session: String,
  moves: Array(Tuple(Array(MoveInfoBody), Array(MoveInfoBody))),
})
