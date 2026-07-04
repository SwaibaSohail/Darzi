import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import { pinoHttp } from 'pino-http'
import { allowedOrigins } from './config/env.js'
import logger from './lib/logger.js'
import { generalRateLimit } from './middleware/rateLimits.js'
import { notFoundHandler, errorHandler } from './middleware/errors.js'
import usersRouter from './modules/users/routes.js'
import productsRouter from './modules/products/routes.js'
import servicesRouter from './modules/services/routes.js'

const app = express()

app.use(helmet())
app.use(cors({ origin: allowedOrigins }))
app.use(express.json({ limit: '100kb' }))
app.use(pinoHttp({ logger }))
app.use(generalRateLimit)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/me', usersRouter)
app.use('/api/products', productsRouter)
app.use('/api/services', servicesRouter)

app.use(notFoundHandler)
app.use(errorHandler)

export default app
