import type { Request, Response, NextFunction } from 'express'
import multer from 'multer'
import { AppError } from '../lib/errors.js'
import logger from '../lib/logger.js'

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
    },
  })
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
      },
    })
    return
  }

  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE' ? 'Image must be 5 MB or smaller' : 'Invalid upload'
    res.status(400).json({ error: { code: 'VALIDATION', message } })
    return
  }

  logger.error(err, 'Unhandled error')
  res.status(500).json({
    error: {
      code: 'INTERNAL',
      message: 'Something went wrong',
    },
  })
}
