// @vitest-environment node
import { describe, it, expect, afterEach } from 'vitest'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { createStageFolders } from '../project-path'
import { STAGE_DEFINITIONS } from '../../shared/stages'

// G2 — 嵌套子分类文件夹创建（真实文件系统）
const tmpDirs: string[] = []

async function makeTmpProject(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'pmaer-g2-'))
  tmpDirs.push(dir)
  return dir
}

afterEach(async () => {
  while (tmpDirs.length) {
    const d = tmpDirs.pop()!
    await fs.rm(d, { recursive: true, force: true })
  }
})

async function isDir(p: string): Promise<boolean> {
  try {
    return (await fs.stat(p)).isDirectory()
  } catch {
    return false
  }
}

describe('createStageFolders（嵌套两级目录）', () => {
  it('为默认阶段定义创建 阶段/子分类/ 两级目录', async () => {
    const projectPath = await makeTmpProject()
    await createStageFolders(projectPath, STAGE_DEFINITIONS)

    // 阶段级
    expect(await isDir(path.join(projectPath, '售前'))).toBe(true)
    expect(await isDir(path.join(projectPath, '验收'))).toBe(true)
    // 子分类级
    expect(await isDir(path.join(projectPath, '售前', '报价单'))).toBe(true)
    expect(await isDir(path.join(projectPath, '验收', '验收材料待签'))).toBe(true)
    expect(await isDir(path.join(projectPath, '上线', '会议纪要'))).toBe(true)
  })

  it('创建的阶段目录数量与定义一致', async () => {
    const projectPath = await makeTmpProject()
    await createStageFolders(projectPath, STAGE_DEFINITIONS)
    const entries = await fs.readdir(projectPath, { withFileTypes: true })
    const dirs = entries.filter((e) => e.isDirectory()).map((e) => e.name)
    for (const s of STAGE_DEFINITIONS) {
      expect(dirs).toContain(s.name)
    }
  })

  it('支持无子分类的自定义阶段（仅建阶段目录）', async () => {
    const projectPath = await makeTmpProject()
    await createStageFolders(projectPath, [{ name: '自定义阶段', subcategories: [] }])
    expect(await isDir(path.join(projectPath, '自定义阶段'))).toBe(true)
  })

  it('清理阶段/子分类名中的非法字符', async () => {
    const projectPath = await makeTmpProject()
    await createStageFolders(projectPath, [{ name: 'a/b', subcategories: ['c:d'] }])
    expect(await isDir(path.join(projectPath, 'a_b'))).toBe(true)
    expect(await isDir(path.join(projectPath, 'a_b', 'c_d'))).toBe(true)
  })
})
