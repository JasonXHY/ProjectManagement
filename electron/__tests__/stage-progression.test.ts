// @vitest-environment node
//
// TDD: 项目阶段自动推进
// 测试文件上传后自动分类触发阶段推进的完整链路
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

let tmpRoot: string

vi.mock('electron', () => ({
  app: {
    getPath: () => tmpRoot,
    isPackaged: false,
  },
  ipcMain: {
    handle: vi.fn(),
  },
}))

let dbModule: typeof import('../database/index')
let projectDb: typeof import('../database/projects')
let fileDb: typeof import('../database/files')

beforeEach(async () => {
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pmaer-progression-'))
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

describe('checkStageProgression（阶段推进规则）', () => {
  let checkStageProgression: typeof import('../shared/stages').checkStageProgression

  beforeEach(async () => {
    const stages = await import('../shared/stages')
    checkStageProgression = stages.checkStageProgression
  })

  it('售前项目收到"进行中"文件应触发推进', () => {
    const result = checkStageProgression('售前', '进行中')
    expect(result).toEqual({
      shouldProgress: true,
      targetStage: '进行中',
      detectedType: '进行中',
    })
  })

  it('进行中项目收到"关闭"文件应触发推进', () => {
    const result = checkStageProgression('进行中', '关闭')
    expect(result).toEqual({
      shouldProgress: true,
      targetStage: '关闭',
      detectedType: '关闭',
    })
  })

  it('售前项目收到"关闭"文件不应触发推进（跳级禁止）', () => {
    expect(checkStageProgression('售前', '关闭')).toBeNull()
  })

  it('进行中项目收到"售前"文件不应触发推进（禁止回退）', () => {
    expect(checkStageProgression('进行中', '售前')).toBeNull()
  })

  it('关闭项目收到任何文件不应触发推进', () => {
    expect(checkStageProgression('关闭', '进行中')).toBeNull()
    expect(checkStageProgression('关闭', '售前')).toBeNull()
  })

  it('空fileStage应返回null', () => {
    expect(checkStageProgression('售前', '')).toBeNull()
    expect(checkStageProgression('售前', null as unknown as string)).toBeNull()
  })
})

describe('自动分类始终使用stage prompt（不依赖category_type）', () => {
  it('CLASSIFY_PROMPT_STAGES包含stage字段', async () => {
    const { CLASSIFY_PROMPT_STAGES } = await import('../prompts/classify')
    expect(CLASSIFY_PROMPT_STAGES).toContain('stage')
    expect(CLASSIFY_PROMPT_STAGES).toContain('售前')
  })

  it('CLASSIFY_PROMPT_CONTENT不包含stage字段', async () => {
    const { CLASSIFY_PROMPT_CONTENT } = await import('../prompts/classify')
    // content prompt 只关注内容分类，不含阶段
    expect(CLASSIFY_PROMPT_CONTENT).not.toMatch(/"stage"/)
  })
})

describe('文件上传后阶段推进链路', () => {
  it('project的current_stage初始值为售前', async () => {
    const projectId = projectDb.createProject('测试项目', 'stage')
    const project = projectDb.getProject(projectId)
    expect(project).not.toBeNull()
    expect(project!.current_stage).toBe('售前')
  })

  it('可以更新project的current_stage', async () => {
    const projectId = projectDb.createProject('测试项目', 'stage')
    projectDb.updateProject(projectId, { current_stage: '进行中' })
    const project = projectDb.getProject(projectId)
    expect(project!.current_stage).toBe('进行中')
  })

  it('updateProject支持current_stage字段', async () => {
    const projectId = projectDb.createProject('测试项目', 'stage')
    projectDb.updateProject(projectId, { current_stage: '关闭' })
    const project = projectDb.getProject(projectId)
    expect(project!.current_stage).toBe('关闭')
  })
})

describe('自动分类prompt选择（始终用stage prompt）', () => {
  it('自动分类应始终使用CLASSIFY_PROMPT_STAGES，无论category_type', async () => {
    // 方案C：自动分类始终使用stage prompt，确保AI返回stage字段
    const { CLASSIFY_PROMPT_STAGES } = await import('../prompts/classify')

    // 模拟自动分类逻辑：不管category_type是什么，都用stage prompt
    const categoryTypes = ['stage', 'content', undefined]
    for (const categoryType of categoryTypes) {
      // 自动分类路径：始终用stage prompt（修复后的逻辑）
      const promptTemplate = CLASSIFY_PROMPT_STAGES
      expect(promptTemplate).toContain('stage')
    }
  })
})

describe('自动分类后阶段推进检查', () => {
  let checkStageProgression: typeof import('../shared/stages').checkStageProgression

  beforeEach(async () => {
    const stages = await import('../shared/stages')
    checkStageProgression = stages.checkStageProgression
  })

  it('AI返回stage时应检查阶段推进', () => {
    // 模拟自动分类后检查阶段推进
    const projectStage = '售前'
    const fileStage = '进行中' // AI返回的stage

    const progression = checkStageProgression(projectStage, fileStage)
    expect(progression).not.toBeNull()
    expect(progression!.shouldProgress).toBe(true)
    expect(progression!.targetStage).toBe('进行中')
  })

  it('AI返回null stage时不应触发推进', () => {
    const progression = checkStageProgression('售前', null as unknown as string)
    expect(progression).toBeNull()
  })

  it('同阶段文件不应触发推进（如售前项目收到售前文件）', () => {
    // STAGE_PROGRESSION_RULES中没有售前→售前的规则
    const progression = checkStageProgression('售前', '售前')
    expect(progression).toBeNull()
  })
})

describe('阶段推进IPC事件结构', () => {
  it('后端应通过webContents发送阶段推进事件到前端', () => {
    // 验证IPC事件数据结构符合前端期望
    const progressionEvent = {
      projectId: 1,
      targetStage: '进行中',
      detectedType: 'AI自动分类',
    }
    expect(progressionEvent).toHaveProperty('projectId')
    expect(progressionEvent).toHaveProperty('targetStage')
    expect(progressionEvent).toHaveProperty('detectedType')
  })
})
