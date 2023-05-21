import { Literal, Record, Number, String, Optional } from 'runtypes'

export const RegisterBody = Record({
  command: Literal('register'),
  name: String,
  hardware: Record({
    cpu: Optional(String),
    cores: Optional(Number),
    memory: Optional(Number),
    gpu: Optional(String),
    frequency: Optional(Number),
    model: Optional(String),
  }),
})

export const ReportBody = Record({
  command: Literal('report'),
  session: String,
})
