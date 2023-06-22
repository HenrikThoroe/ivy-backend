import { Literal, Optional, Record, String, Union, Array } from 'runtypes'

const Name = String.withConstraint(
  (s) => s.length > 0 && s.length < 100 && /^[a-zA-Z0-9\-]+$/.test(s)
)

const Version = String.withConstraint((s) => /^v[0-9]+\-[0-9]+\-[0-9]+$/.test(s))

export const CreateBody = Record({
  name: Name,
  version: Version,
  capabilities: Optional(String),
  os: String,
  arch: String,
})

export const VersionFetchBody = Record({
  name: Name,
  version: Version,
})
