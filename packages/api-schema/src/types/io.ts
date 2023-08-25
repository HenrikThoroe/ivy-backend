import { z } from 'zod'

/**
 * Schema for extpected input of
 * two-way communication.
 */
export interface InSchema {
  [key: string]: z.ZodType
}

/**
 * Schema for extpected output of
 * two-way communication.
 */
export interface OutSchema {
  [key: string]: z.ZodType
}

/**
 * Schema for two-way communication.
 */
export interface IOSchema<I extends InSchema, O extends OutSchema> {
  input: I
  output: O
}

/**
 * Creates a schema for two-way communication.
 *
 * @param input The schema for input messages.
 * @param output The schema for output messages.
 * @returns A new {@link IOSchema}.
 */
export function io<I extends InSchema, O extends OutSchema>(input: I, output: O): IOSchema<I, O> {
  return { input, output }
}
