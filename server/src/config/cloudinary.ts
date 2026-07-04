import { v2 as cloudinary } from 'cloudinary'
import { env } from './env.js'

let configured = false

export function getCloudinary() {
  if (!configured) {
    if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
      throw new Error('Cloudinary is not configured. Set CLOUDINARY_* vars in server/.env.')
    }
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure: true,
    })
    configured = true
  }
  return cloudinary
}
