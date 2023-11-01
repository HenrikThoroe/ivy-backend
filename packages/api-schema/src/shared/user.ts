import { z } from 'zod'

const userRoleSchema = z.enum(['manager', 'contributor', 'visitor'])

/**
 * The roles that are accepted when an endpoint is
 * accessible to all users.
 */
export const visitorRoles = ['visitor', 'contributor', 'manager'] satisfies Array<
  z.infer<typeof userRoleSchema>
>

/**
 * The roles that are accepted when an endpoint is
 * accessible to contributors and managers.
 */
export const contributorRoles = ['manager', 'contributor'] satisfies Array<
  z.infer<typeof userRoleSchema>
>

/**
 * The roles that are accepted when an endpoint is
 * accessible to managers only.
 */
export const managerRoles = ['manager'] satisfies Array<z.infer<typeof userRoleSchema>>

/**
 * Schema for data associated with a user.
 */
export const userSchema = z.object({
  id: z.string().nonempty(),
  role: userRoleSchema,
  name: z.string().nonempty(),
  email: z.string().email(),
})
