// @vitest-environment node
//
// TDD: AI返回字段完整保存(stage/summary/keyInfo)
// 测试AI分类结果的关键字段保存到数据库
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

let tmpRoot: string

vi.mock('electron', () => ({
  app: {
    getPath: () => tmpRoot,
    isPackaged: false,
  },
}))

let dbModule: typeof import('../database/index')
let projectDb: typeof import('../database/projects')
let fileDb: typeof import('../database/files')

beforeEach(async () => {
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pmaer-ai-'))
  vi.resetModules()
  dbModule = await import('../database/index')
  projectDb = await import('../database/projects')
  fileDb = await import('../database/files')
  await dbModule.initDatabase()
})

afterEach(async () => {
  await dbModule.flushDatabase()
  dbModule.closeDatabase?.()
  await fs.rm(tmpRoot, { recursive: true, force: true })
})

describe('AI返回字段保存', () => {
  let projectId: number

  beforeEach(async () => {
    projectId = projectDb.createProject('测试项目', 'stage')
  })

  it('创建文件时ai_summary和ai_key_info默认为null', () => {
    const fileId = fileDb.createFile(projectId, {
      filename: '合同.pdf',
      original_path: '/test/合同.pdf',
      stored_path: '/stored/合同.pdf',
      category: null,
      subcategory: null,
      stage: null,
      file_type: 'pdf',
      file_size: 1024,
      content_extracted: null,
      is_analyzed: false,
      has_signature: false,
      signature_status: 'unsigned',
      ai_summary: null,
      ai_key_info: null,
    })

    const file = fileDb.getFileById(fileId)
    expect(file).not.toBeNull()
    expect(file!.ai_summary).toBeNull()
    expect(file!.ai_key_info).toBeNull()
  })

  it('可以保存AI摘要到ai_summary字段', () => {
    const fileId = fileDb.createFile(projectId, {
      filename: '合同.pdf',
      original_path: '/test/合同.pdf',
      stored_path: '/stored/合同.pdf',
      category: null,
      subcategory: null,
      stage: null,
      file_type: 'pdf',
      file_size: 1024,
      content_extracted: null,
      is_analyzed: false,
      has_signature: false,
      signature_status: 'unsigned',
      ai_summary: null,
      ai_key_info: null,
    })

    const summary = '这是一份项目合同，金额50万元，工期3个月'
    fileDb.updateFile(fileId, { ai_summary: summary })

    const file = fileDb.getFileById(fileId)
    expect(file!.ai_summary).toBe(summary)
  })

  it('可以保存AI关键信息到ai_key_info字段（JSON格式）', () => {
    const fileId = fileDb.createFile(projectId, {
      filename: '合同.pdf',
      original_path: '/test/合同.pdf',
      stored_path: '/stored/合同.pdf',
      category: null,
      subcategory: null,
      stage: null,
      file_type: 'pdf',
      file_size: 1024,
      content_extracted: null,
      is_analyzed: false,
      has_signature: false,
      signature_status: 'unsigned',
      ai_summary: null,
      ai_key_info: null,
    })

    const keyInfo = JSON.stringify({
      project_code: 'PRJ-2024-001',
      contract_no: 'CON-2024-001',
      amount: '500000',
    })
    fileDb.updateFile(fileId, { ai_key_info: keyInfo })

    const file = fileDb.getFileById(fileId)
    expect(file!.ai_key_info).toBe(keyInfo)

    // 验证可以解析
    const parsed = JSON.parse(file!.ai_key_info!)
    expect(parsed.project_code).toBe('PRJ-2024-001')
    expect(parsed.contract_no).toBe('CON-2024-001')
  })

  it('stage字段可以保存AI分类的阶段', () => {
    const fileId = fileDb.createFile(projectId, {
      filename: '合同.pdf',
      original_path: '/test/合同.pdf',
      stored_path: '/stored/合同.pdf',
      category: null,
      subcategory: null,
      stage: null,
      file_type: 'pdf',
      file_size: 1024,
      content_extracted: null,
      is_analyzed: false,
      has_signature: false,
      signature_status: 'unsigned',
      ai_summary: null,
      ai_key_info: null,
    })

    fileDb.updateFile(fileId, { stage: '需求' })

    const file = fileDb.getFileById(fileId)
    expect(file!.stage).toBe('需求')
  })
})
