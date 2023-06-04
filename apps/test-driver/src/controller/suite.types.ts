import { Record, String, Number, Union, Literal, Tuple } from 'runtypes'

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

export const CreateBody = Record({
  name: String,
  iterations: Number,
  engines: Tuple(EngineConfigBody, EngineConfigBody),
})
