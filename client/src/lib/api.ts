import { auth } from './firebase'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

export class ApiError extends Error {
  status: number
  code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers: Record<string, string> = {}
  const user = auth.currentUser
  if (user) {
    headers.Authorization = `Bearer ${await user.getIdToken()}`
  }
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })
  if (!res.ok) {
    let code = 'UNKNOWN'
    let message = `Request failed (${res.status})`
    try {
      const data = await res.json()
      code = data?.error?.code ?? code
      message = data?.error?.message ?? message
    } catch {
      // non-JSON error body — keep defaults
    }
    throw new ApiError(res.status, code, message)
  }
  return res.json() as Promise<T>
}
