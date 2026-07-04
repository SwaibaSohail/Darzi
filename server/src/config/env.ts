import 'dotenv/config'
import { z } from 'zod'

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(8080),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  FIREBASE_SERVICE_ACCOUNT_B64: z.string().optional(),
  FIREBASE_STORAGE_BUCKET: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
})

const result = schema.safeParse(process.env)

if (!result.success) {
  console.error('Invalid environment variables:', result.error.flatten())
  process.exit(1)
}

export const env = result.data
export const allowedOrigins = env.CLIENT_ORIGIN.split(',').map((s) => s.trim())
