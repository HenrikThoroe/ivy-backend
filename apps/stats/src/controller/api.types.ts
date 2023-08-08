import { Record, String, Number, Literal, Union, Array } from 'runtypes'

const EngineConfigBody = Record({
  name: String,
  version: Record({
    major: Number,
    minor: Number,
    patch: Number,
  }),
  timeControl: Record({
    type: Union(Literal('depth'), Literal('movetime')),
    value: Number.withConstraint((value) => value > 0),
  }),
  options: Record({
    hash: Number.withConstraint((n) => n > 0),
    threads: Number.withConstraint((n) => n >= 1),
  }),
})

export const GroupCreateBody = Record({
  name: String,
  base: EngineConfigBody,
  nodes: Array(EngineConfigBody).withConstraint((arr) => arr.length > 0),
  threshold: Number.withConstraint((n) => n > 0),
})

export const AddNodeBody = Record({
  node: EngineConfigBody,
})

export const DeleteNodeBody = Record({
  node: EngineConfigBody,
})
