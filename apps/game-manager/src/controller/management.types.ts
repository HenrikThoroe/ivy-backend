import { Number, Record } from 'runtypes'

export const CreateBody = Record({
  timeout: Number.withConstraint((val) => val > 100 && val < 24 * 60 * 60 * 1000),
  timeback: Number.withConstraint((val) => val >= 0),
})
