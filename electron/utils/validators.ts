import { getProject } from '../database/projects'
import { getFileById } from '../database/files'

export interface ValidationResult {
  valid: boolean
  error?: string
}

export function validateRequired(value: unknown, fieldName: string): ValidationResult {
  if (value === undefined || value === null || value === '') {
    return { valid: false, error: `缺少必需参数: ${fieldName}` }
  }
  return { valid: true }
}

export function validateType(value: unknown, expectedType: string, fieldName: string): ValidationResult {
  if (expectedType === 'number') {
    if (typeof value !== 'number' || isNaN(value)) {
      return { valid: false, error: `参数类型错误: ${fieldName} 必须是数字` }
    }
  } else if (expectedType === 'string') {
    if (typeof value !== 'string') {
      return { valid: false, error: `参数类型错误: ${fieldName} 必须是字符串` }
    }
  } else if (expectedType === 'object') {
    if (typeof value !== 'object' || value === null) {
      return { valid: false, error: `参数类型错误: ${fieldName} 必须是对象` }
    }
  } else if (expectedType === 'array') {
    if (!Array.isArray(value)) {
      return { valid: false, error: `参数类型错误: ${fieldName} 必须是数组` }
    }
  }
  return { valid: true }
}

export function validateProjectExists(projectId: number): ValidationResult {
  const project = getProject(projectId)
  if (!project) {
    return { valid: false, error: `项目不存在: ID ${projectId}` }
  }
  return { valid: true }
}

export function validateFileExists(fileId: number): ValidationResult {
  const file = getFileById(fileId)
  if (!file) {
    return { valid: false, error: `文件不存在: ID ${fileId}` }
  }
  return { valid: true }
}

export function validateSettingsKey(key: string, allowedFields: string[]): ValidationResult {
  if (!allowedFields.includes(key)) {
    return { valid: false, error: `不允许的设置字段: ${key}` }
  }
  return { valid: true }
}

export function validateStringArray(value: unknown, fieldName: string): ValidationResult {
  if (!Array.isArray(value)) {
    return { valid: false, error: `参数类型错误: ${fieldName} 必须是数组` }
  }
  for (const item of value) {
    if (typeof item !== 'string') {
      return { valid: false, error: `参数类型错误: ${fieldName} 中的元素必须是字符串` }
    }
  }
  return { valid: true }
}

export function validateNumberArray(value: unknown, fieldName: string): ValidationResult {
  if (!Array.isArray(value)) {
    return { valid: false, error: `参数类型错误: ${fieldName} 必须是数组` }
  }
  for (const item of value) {
    if (typeof item !== 'number' || isNaN(item)) {
      return { valid: false, error: `参数类型错误: ${fieldName} 中的元素必须是数字` }
    }
  }
  return { valid: true }
}

export function validateProjectId(projectId: unknown): { valid: boolean; id?: number; error?: string } {
  const req = validateRequired(projectId, 'projectId')
  if (!req.valid) return req
  const type = validateType(projectId, 'number', 'projectId')
  if (!type.valid) return type
  const exists = validateProjectExists(projectId as number)
  if (!exists.valid) return exists
  return { valid: true, id: projectId as number }
}

export function validateFileId(fileId: unknown): { valid: boolean; id?: number; error?: string } {
  const req = validateRequired(fileId, 'fileId')
  if (!req.valid) return req
  const type = validateType(fileId, 'number', 'fileId')
  if (!type.valid) return type
  const exists = validateFileExists(fileId as number)
  if (!exists.valid) return exists
  return { valid: true, id: fileId as number }
}

export function validateCategoryType(value: unknown): ValidationResult {
  if (value !== 'stage' && value !== 'content') {
    return { valid: false, error: 'categoryType 必须是 "stage" 或 "content"' }
  }
  return { valid: true }
}