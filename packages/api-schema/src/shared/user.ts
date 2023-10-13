import { z } from 'zod'

/**
 * Schema for data associated with a user.
 */
export const userSchema = z.object({
  id: z.string().nonempty(),
  role: z.enum(['manager', 'contributor', 'visitor']),
  name: z.string().nonempty(),
  email: z.string().email(),
})
