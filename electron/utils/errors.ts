export interface AppError {
  code: string
  message: string
  details?: unknown
}

export function createAppError(code: string, message: string, details?: unknown): AppError {
  return { code, message, details }
}

export function handleIpcError(error: unknown): { success: false; error: AppError } {
  if (error instanceof Error) {
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
        details: process.env.NODE_ENV === 'production' ? undefined : error.stack,
      },
    }
  }
  return {
    success: false,
    error: {
      code: 'UNKNOWN_ERROR',
      message: String(error),
    },
  }
}

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  FILE_SYSTEM_ERROR: 'FILE_SYSTEM_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  AI_SERVICE_ERROR: 'AI_SERVICE_ERROR',
} as const

type LogLevel = 'INFO' | 'WARN' | 'ERROR'

function formatLogMessage(level: LogLevel, module: string, message: string): string {
  const time = new Date().toISOString()
  return `[${time}] [${level}] [${module}] ${message}`
}

export const logger = {
  info(module: string, message: string) {
    console.log(formatLogMessage('INFO', module, message))
  },
  warn(module: string, message: string) {
    console.warn(formatLogMessage('WARN', module, message))
  },
  error(module: string, message: string, details?: unknown) {
    const suffix = details ? ` ${String(details)}` : ''
    console.error(formatLogMessage('ERROR', module, message) + suffix)
  },
}