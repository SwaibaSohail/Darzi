import { fileTypeFromBuffer } from 'file-type'
import { getCloudinary } from '../../config/cloudinary.js'
import { AppError } from '../../lib/errors.js'

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])

export interface UploadedImage {
  url: string
  path: string // Cloudinary public_id
}

/**
 * Validates real file content by magic bytes (never trusts client MIME or
 * filename), then uploads to Cloudinary under the given folder.
 */
export async function uploadImage(buffer: Buffer, folder: string): Promise<UploadedImage> {
  const detected = await fileTypeFromBuffer(buffer)
  if (!detected || !ALLOWED_MIME.has(detected.mime)) {
    throw new AppError(400, 'VALIDATION', 'Only JPEG, PNG, or WebP images are allowed')
  }

  const result = await new Promise<{ secure_url: string; public_id: string }>(
    (resolve, reject) => {
      const stream = getCloudinary().uploader.upload_stream(
        { folder, resource_type: 'image' },
        (err, res) => {
          if (err || !res) reject(err ?? new Error('Empty upload response'))
          else resolve(res)
        },
      )
      stream.end(buffer)
    },
  )

  return { url: result.secure_url, path: result.public_id }
}
