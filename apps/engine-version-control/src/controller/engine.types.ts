import { Literal, Record, String, Union } from 'runtypes'

const Name = String.withConstraint(
  (s) => s.length > 0 && s.length < 100 && /^[a-zA-Z0-9\-]+$/.test(s)
)

const Version = String.withConstraint((s) => /^v[0-9]+\-[0-9]+\-[0-9]+$/.test(s) || s === 'latest')

export const CreateBody = Record({
  name: Name,
  increment: Union(Literal('patch'), Literal('major'), Literal('minor')),
})

export const DownloadBody = Record({
  name: Name,
  version: Version,
})
