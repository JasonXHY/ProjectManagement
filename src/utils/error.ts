export interface ApiError {
  message: string
  code?: string
}

export function isApiError(error: unknown): error is ApiError {
  if (typeof error !== 'object' || error === null) return false
  const obj = error as Record<string, unknown>
  return typeof obj.message === 'string'
}
