import { z } from 'zod'

export const updateMeSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9]{7,15}$/, 'Invalid phone number')
      .nullable()
      .optional(),
    address: z
      .object({
        line1: z.string().trim().min(1).max(120),
        city: z.string().trim().min(1).max(60),
        postal: z.string().trim().min(1).max(15),
      })
      .strict()
      .nullable()
      .optional(),
  })
  .strict()

export type UpdateMeInput = z.infer<typeof updateMeSchema>
