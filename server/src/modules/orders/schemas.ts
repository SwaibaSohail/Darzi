import { z } from 'zod'

// Client sends references and selections ONLY — any price-shaped field is
// rejected by .strict(). Custom stitching items arrive in a later phase.
const productLineSchema = z
  .object({
    kind: z.literal('product'),
    productId: z.string().trim().min(1).max(60),
    qty: z.number().int().min(1).max(10),
    size: z.string().trim().min(1).max(8).optional(),
  })
  .strict()

export const createOrderSchema = z
  .object({
    items: z.array(productLineSchema).min(1).max(20),
    address: z
      .object({
        line1: z.string().trim().min(1).max(120),
        city: z.string().trim().min(1).max(60),
        postal: z.string().trim().min(1).max(15),
        phone: z
          .string()
          .trim()
          .regex(/^\+?[0-9]{7,15}$/, 'Invalid phone number'),
      })
      .strict(),
    paymentMethod: z.literal('cod'),
  })
  .strict()

export type CreateOrderInput = z.infer<typeof createOrderSchema>
