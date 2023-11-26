import { z } from 'zod'
import { liveGameSchema } from '../../shared/live'
import { io } from '../../types/io'

/**
 * Schema for a move request message.
 */
export const moveRequestMessage = z.object({
  key: z.literal('move-req-msg'),
  history: z.array(z.string().nonempty()),
  time: z.number().int().positive().optional(),
})

/**
 * Schema for an update request message.
 */
export const updateRequestMessage = z.object({
  key: z.literal('update-req-msg'),
})

/**
 * Schema for an update message.
 */
export const updateMessage = z.object({
  key: z.literal('update-msg'),
  history: z.array(z.string().nonempty()),
})

/**
 * Schema for a move message.
 */
export const moveMessage = z.object({
  key: z.literal('move-msg'),
  move: z.string().nonempty(),
  logs: z.array(z.string().nonempty()).optional(),
})

/**
 * Schema for a resign message.
 */
export const resignMessage = z.object({
  key: z.literal('resign-msg'),
})

/**
 * Schema for a state request message.
 */
export const stateRequestMessage = z.object({
  key: z.literal('state-req-msg'),
})

/**
 * Schema for a check-in message.
 */
export const checkInMessage = z.object({
  key: z.literal('check-in-msg'),
  player: z.string().nonempty(),
})

/**
 * Schema for a state message.
 */
export const stateMessage = z.object({
  key: z.literal('state-msg'),
  game: liveGameSchema,
})

/**
 * Schema for the interface between a player and the game manager.
 */
export const playerInterface = io(
  {
    move: moveMessage,
    resign: resignMessage,
    checkIn: checkInMessage,
    update: updateRequestMessage,
  },
  {
    update: updateMessage,
    move: moveRequestMessage,
  },
)

/**
 * Schema for the interface between a spectator and the game manager.
 */
export const spectatorInterface = io(
  {
    state: stateRequestMessage,
  },
  {
    state: stateMessage,
  },
)
