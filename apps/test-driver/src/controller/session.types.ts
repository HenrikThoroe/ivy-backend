import { Array, Union, String, Number, Record } from 'runtypes'

export const CreateBody = Record({
  driver: Number.withConstraint((value) => value > 0),
  suite: String,
})
