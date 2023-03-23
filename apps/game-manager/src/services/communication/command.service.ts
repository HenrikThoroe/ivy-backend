import { Record, Literal, Static, String, Union, Optional } from 'runtypes'

type CommandKey = 'game-state' | 'register' | 'check-in' | 'move' | 'resign'

const GameStateCommandBody = Record({
  game: String,
  player: String,
  command: Literal('game-state'),
})

const RegisterCommandBody = Record({
  game: String,
  color: Optional(Union(Literal('black'), Literal('white'))),
  command: Literal('register'),
})

const CheckInCommandBody = Record({
  game: String,
  player: String,
  command: Literal('check-in'),
})

const MoveCommandBody = Record({
  game: String,
  player: String,
  move: String,
  command: Literal('move'),
})

const ResignCommandBody = Record({
  game: String,
  player: String,
  command: Literal('resign'),
})

type Command<T extends CommandKey> = T extends 'game-state'
  ? GameStateCommand
  : T extends 'register'
  ? RegisterCommand
  : T extends 'check-in'
  ? CheckInCommand
  : T extends 'move'
  ? MoveCommand
  : T extends 'resign'
  ? ResignCommand
  : never

export type ResignCommand = Static<typeof ResignCommandBody>

export type GameStateCommand = Static<typeof GameStateCommandBody>

export type RegisterCommand = Static<typeof RegisterCommandBody>

export type CheckInCommand = Static<typeof CheckInCommandBody>

export type MoveCommand = Static<typeof MoveCommandBody>

export function isCommand<T extends CommandKey>(type: T, command: any): command is Command<T> {
  switch (type) {
    case 'check-in':
      return CheckInCommandBody.validate(command).success
    case 'move':
      return MoveCommandBody.validate(command).success
    case 'register':
      return RegisterCommandBody.validate(command).success
    case 'game-state':
      return GameStateCommandBody.validate(command).success
    case 'resign':
      return ResignCommandBody.validate(command).success
  }

  return false
}
