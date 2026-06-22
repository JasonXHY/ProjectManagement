// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import JSZip from 'jszip'

let tmpRoot: string

vi.mock('electron', () => ({
  app: {
    getPath: () => tmpRoot,
    isPackaged: false,
    getVersion: () => '0.1.2',
  },
}))

let dbModule: typeof import('../database/index')
let projectDb: typeof import('../database/projects')
let fileDb: typeof import('../database/files')
let HandoverService: typeof import('../services/handover-service').HandoverService

beforeEach(async () => {
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pmaer-handover-'))
  vi.resetModules()
  dbModule = await import('../database/index')
  projectDb = await import('../database/projects')
  fileDb = await import('../database/files')
  HandoverService = (await import('../services/handover-service')).HandoverService
  await dbModule.initDatabase()
})

afterEach(async () => {
  await dbModule.flushDatabase()
  dbModule.closeDatabase?.()
  await fs.rm(tmpRoot, { recursive: true, force: true })
})

describe('HandoverService', () => {
  it('class is importable', () => {
    expect(HandoverService).toBeDefined()
    expect(typeof HandoverService.exportHandover).toBe('function')
    expect(typeof HandoverService.previewHandover).toBe('function')
  })

  it('exportHandover throws when project not found', async () => {
    await expect(
      HandoverService.exportHandover({ projectId: 999, mode: 'full' })
    ).rejects.toThrow('项目不存在')
  })

  it('exportHandover generates a valid zip with handover.json', async () => {
    const projectId = projectDb.createProject('测试项目', 'stage')
    const projectPath = path.join(tmpRoot, 'projects', '测试项目')
    await fs.mkdir(projectPath, { recursive: true })
    await fs.mkdir(path.join(projectPath, '.ai'), { recursive: true })
    await fs.writeFile(path.join(projectPath, 'readme.txt'), 'hello')
    await fs.writeFile(
      path.join(projectPath, '.ai', 'project-summary.md'),
      '# Summary'
    )

    fileDb.createFile(projectId, {
      filename: 'readme.txt',
      original_path: '/test/readme.txt',
      stored_path: path.join(projectPath, 'readme.txt'),
      category: '文档',
      subcategory: null,
      stage: '售前',
      file_type: 'txt',
      file_size: 5,
      content_extracted: null,
      is_analyzed: false,
      has_signature: false,
    })

    const buffer = await HandoverService.exportHandover({
      projectId,
      mode: 'full',
      handoverNote: '请查收',
    })

    const zip = await JSZip.loadAsync(buffer)
    expect(zip.file('handover.json')).not.toBeNull()

    const json = JSON.parse(await zip.file('handover.json')!.async('text'))
    expect(json.format_version).toBe('1.0')
    expect(json.type).toBe('full')
    expect(json.project.name).toBe('测试项目')
    expect(json.files).toHaveLength(1)
    expect(json.files[0].filename).toBe('readme.txt')
    expect(json.files[0].category).toBe('文档')
    expect(json.handover_note).toBe('请查收')
    expect(json.exported_by).toContain('PMAer')
  })

  it('exportHandover includes project-summary.md when exists', async () => {
    const projectId = projectDb.createProject('摘要项目', 'stage')
    const projectPath = path.join(tmpRoot, 'projects', '摘要项目')
    await fs.mkdir(path.join(projectPath, '.ai'), { recursive: true })
    await fs.writeFile(
      path.join(projectPath, '.ai', 'project-summary.md'),
      '# Project Summary\n- item1\n- item2'
    )

    const buffer = await HandoverService.exportHandover({
      projectId,
      mode: 'full',
    })

    const zip = await JSZip.loadAsync(buffer)
    const summary = zip.file('project-summary.md')
    expect(summary).not.toBeNull()
    expect(await summary!.async('text')).toContain('Project Summary')
  })

  it('exportHandover includes context.md when handoverNote provided', async () => {
    const projectId = projectDb.createProject('上下文项目', 'stage')
    const projectPath = path.join(tmpRoot, 'projects', '上下文项目')
    await fs.mkdir(projectPath, { recursive: true })

    const buffer = await HandoverService.exportHandover({
      projectId,
      mode: 'full',
      handoverNote: '这是交接说明',
    })

    const zip = await JSZip.loadAsync(buffer)
    const ctx = zip.file('context.md')
    expect(ctx).not.toBeNull()
    expect(await ctx!.async('text')).toBe('这是交接说明')
  })

  it('previewHandover parses handover.json correctly', async () => {
    const projectId = projectDb.createProject('预览项目', 'content')
    const projectPath = path.join(tmpRoot, 'projects', '预览项目')
    await fs.mkdir(projectPath, { recursive: true })

    fileDb.createFile(projectId, {
      filename: 'doc.pdf',
      original_path: '/test/doc.pdf',
      stored_path: path.join(projectPath, 'doc.pdf'),
      category: '合同',
      subcategory: null,
      stage: '售前',
      file_type: 'pdf',
      file_size: 2048,
      content_extracted: null,
      is_analyzed: false,
      has_signature: false,
      ai_summary: '合同摘要',
      ai_key_info: JSON.stringify({ amount: '100000' }),
    })

    const buffer = await HandoverService.exportHandover({
      projectId,
      mode: 'full',
      handoverNote: '交接备注',
    })

    const zipPath = path.join(tmpRoot, 'test-handover.zip')
    await fs.writeFile(zipPath, buffer)

    const result = await HandoverService.previewHandover(zipPath)
    expect(result.format_version).toBe('1.0')
    expect(result.type).toBe('full')
    expect(result.project.name).toBe('预览项目')
    expect(result.project.category_type).toBe('content')
    expect(result.files).toHaveLength(1)
    expect(result.files[0].filename).toBe('doc.pdf')
    expect(result.files[0].category).toBe('合同')
    expect(result.files[0].ai_summary).toBe('合同摘要')
    expect(result.files[0].ai_key_info).toEqual({ amount: '100000' })
    expect(result.handover_note).toBe('交接备注')
  })

  it('previewHandover throws for invalid zip', async () => {
    const badPath = path.join(tmpRoot, 'bad.zip')
    await fs.writeFile(badPath, 'not a zip')
    await expect(HandoverService.previewHandover(badPath)).rejects.toThrow()
  })

  it('previewHandover throws for zip without handover.json', async () => {
    const zip = new JSZip()
    zip.file('other.txt', 'data')
    const data = await zip.generateAsync({ type: 'nodebuffer' })
    const zipPath = path.join(tmpRoot, 'no-handover.zip')
    await fs.writeFile(zipPath, data)
    await expect(HandoverService.previewHandover(zipPath)).rejects.toThrow('无效的转交包')
  })

  it('exportHandover in selective mode only includes selected files', async () => {
    const projectId = projectDb.createProject('选择项目', 'stage')
    const projectPath = path.join(tmpRoot, 'projects', '选择项目')
    await fs.mkdir(projectPath, { recursive: true })

    fileDb.createFile(projectId, {
      filename: 'a.txt',
      original_path: '/test/a.txt',
      stored_path: path.join(projectPath, 'a.txt'),
      category: '文档',
      stage: '售前',
      file_type: 'txt',
      file_size: 1,
      content_extracted: null,
      is_analyzed: false,
      has_signature: false,
    })
    fileDb.createFile(projectId, {
      filename: 'b.txt',
      original_path: '/test/b.txt',
      stored_path: path.join(projectPath, 'b.txt'),
      category: '合同',
      stage: '售前',
      file_type: 'txt',
      file_size: 1,
      content_extracted: null,
      is_analyzed: false,
      has_signature: false,
    })

    const buffer = await HandoverService.exportHandover({
      projectId,
      mode: 'selective',
      selectedFiles: ['a.txt'],
    })

    const zip = await JSZip.loadAsync(buffer)
    const json = JSON.parse(await zip.file('handover.json')!.async('text'))
    expect(json.files).toHaveLength(1)
    expect(json.files[0].filename).toBe('a.txt')
  })
})
