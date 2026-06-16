// @vitest-environment node
//
// G10 — 端到端集成测试：真实 sql.js + 真实临时文件系统。
// 仅 mock electron 的 app.getPath（指向临时目录），DB 与 fs 全部用真实实现。
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

let tmpRoot: string

// 将 app.getPath('userData') 指向每个测试独立的临时目录
vi.mock('electron', () => ({
  app: {
    getPath: () => tmpRoot,
    isPackaged: false,
  },
}))

// 被测模块（在 mock 之后动态导入，确保拿到 mock 后的 electron）
let dbModule: typeof import('../../database/index')
let projectDb: typeof import('../../database/projects')
let fileDb: typeof import('../../database/files')
let conversationDb: typeof import('../../database/conversations')
let projectPath: typeof import('../../utils/project-path')
let stages: typeof import('../../shared/stages')

beforeEach(async () => {
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pmaer-it-'))
  vi.resetModules()
  dbModule = await import('../../database/index')
  projectDb = await import('../../database/projects')
  fileDb = await import('../../database/files')
  conversationDb = await import('../../database/conversations')
  projectPath = await import('../../utils/project-path')
  stages = await import('../../shared/stages')
  await dbModule.initDatabase()
})

afterEach(async () => {
  await dbModule.flushDatabase()
  dbModule.closeDatabase?.()
  await fs.rm(tmpRoot, { recursive: true, force: true })
})

async function isDir(p: string): Promise<boolean> {
  try { return (await fs.stat(p)).isDirectory() } catch { return false }
}

describe('F01.1 创建项目：真实 DB + 嵌套阶段/子分类目录', () => {
  it('创建项目并建立两级目录结构', async () => {
    const id = projectDb.createProject('集成测试项目', 'stage')
    const dir = await projectPath.createProjectDirectory(id, '集成测试项目')
    await projectPath.createStageFolders(dir, stages.STAGE_DEFINITIONS)
    await fs.mkdir(path.join(dir, '.ai'), { recursive: true })

    // 阶段 + 子分类目录
    expect(await isDir(path.join(dir, '售前', '报价单'))).toBe(true)
    expect(await isDir(path.join(dir, '验收', '验收材料待签'))).toBe(true)
    // DB 记录存在，默认项目阶段为售前
    const project = projectDb.getProject(id)
    expect(project?.name).toBe('集成测试项目')
    expect(project?.current_stage).toBe('售前')
  })
})

describe('N06 持久化：写入后重新打开 DB 数据仍在', () => {
  it('项目在重新初始化后仍存在', async () => {
    const id = projectDb.createProject('持久化项目', 'stage')
    dbModule.closeDatabase?.()
    // 重新初始化（读取磁盘上的 projects.db）
    await dbModule.initDatabase()
    const reloaded = (await import('../../database/projects')).getProject(id)
    expect(reloaded?.name).toBe('持久化项目')
  })
})

describe('F03/G3 文件分类：subcategory 持久化', () => {
  it('createFile 携带 subcategory 并可读回', async () => {
    const pid = projectDb.createProject('分类项目', 'stage')
    const fid = fileDb.createFile(pid, {
      project_id: pid,
      filename: 'quote.pdf',
      original_path: null,
      stored_path: path.join(tmpRoot, 'quote.pdf'),
      category: '售前',
      subcategory: '报价单',
      stage: '售前',
      file_type: 'pdf',
      file_size: 100,
      content_extracted: '报价内容',
      is_analyzed: false,
      has_signature: false,
    })
    const file = fileDb.getFileById(fid)
    expect(file?.category).toBe('售前')
    expect(file?.subcategory).toBe('报价单')
  })
})

describe('F01.4 删除项目：级联清除对话记录', () => {
  it('删除项目后其对话记录被清除', async () => {
    const pid = projectDb.createProject('级联项目', 'stage')
    conversationDb.saveChatMessage(pid, 'sess-1', 'user', '你好', 0)
    expect(conversationDb.getChatHistory(pid, 'sess-1').length).toBe(1)

    projectDb.deleteProject(pid)
    expect(projectDb.getProject(pid)).toBeFalsy()
    expect(conversationDb.getChatHistory(pid, 'sess-1').length).toBe(0)
  })
})
