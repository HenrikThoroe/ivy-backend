import { z } from 'zod'

/**
 * Schema for objects that haven an ID property formatted as UUID.
 */
export const withIdSchema = z.object({
  id: z.string().uuid(),
})

/**
 * General schema for names.
 * Names must start with a letter and can contain letters, numbers, spaces, dashes and dots.
 * They must be between 1 and 100 characters long.
 */
export const nameSchema = z
  .string()
  .regex(/^[a-zA-Z]+[a-zA-Z0-9\- \.]+$/)
  .min(1)
  .max(100)
