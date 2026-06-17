// @vitest-environment node
//
// TDD: signature_status字段替代has_signature布尔值
// 测试签名状态的完整生命周期
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
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pmaer-sig-'))
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

describe('signature_status字段', () => {
  let projectId: number

  beforeEach(async () => {
    projectId = projectDb.createProject('测试项目', 'stage')
  })

  it('创建文件时signature_status默认为unsigned', () => {
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
    expect(file!.signature_status).toBe('unsigned')
  })

  it('可以更新signature_status为pending', () => {
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
    })

    fileDb.updateFile(fileId, { signature_status: 'pending' })

    const file = fileDb.getFileById(fileId)
    expect(file!.signature_status).toBe('pending')
  })

  it('signature_status支持所有有效值', () => {
    const validStatuses = ['unsigned', 'pending', 'signed', 'rejected']

    for (const status of validStatuses) {
      const fileId = fileDb.createFile(projectId, {
        filename: `文件_${status}.pdf`,
        original_path: `/test/${status}.pdf`,
        stored_path: `/stored/${status}.pdf`,
        category: null,
        subcategory: null,
        stage: null,
        file_type: 'pdf',
        file_size: 1024,
        content_extracted: null,
        is_analyzed: false,
        has_signature: false,
        signature_status: status as any,
      })

      const file = fileDb.getFileById(fileId)
      expect(file!.signature_status).toBe(status)
    }
  })

  it('has_signature与signature_status可以同时存在', () => {
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
      has_signature: true,
      signature_status: 'signed',
    })

    const file = fileDb.getFileById(fileId)
    expect(file!.has_signature).toBeTruthy()
    expect(file!.signature_status).toBe('signed')
  })
})
