// @vitest-environment node
import { describe, it, expect, afterEach } from 'vitest'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { FileExtractor } from '../file-extractor'

// G5 — CSV + 图片内容提取
const tmpFiles: string[] = []

async function writeTmp(name: string, content: string | Buffer): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'pmaer-g5-'))
  const p = path.join(dir, name)
  await fs.writeFile(p, content)
  tmpFiles.push(dir)
  return p
}

afterEach(async () => {
  while (tmpFiles.length) {
    await fs.rm(tmpFiles.pop()!, { recursive: true, force: true })
  }
})

describe('FileExtractor CSV 提取', () => {
  it('提取 CSV 文本内容（非空）', async () => {
    const p = await writeTmp('data.csv', '姓名,年龄\n张三,30\n李四,25\n')
    const result = await FileExtractor.extract(p)
    expect(result).toBeTruthy()
    expect(result).toContain('张三')
    expect(result).toContain('年龄')
  })
})

describe('FileExtractor 图片提取', () => {
  it('无 vision provider 时优雅降级返回 null，不抛错', async () => {
    const p = await writeTmp('scan.png', Buffer.from([0x89, 0x50, 0x4e, 0x47]))
    // 不注入 vision；应安全返回 null
    const result = await FileExtractor.extract(p)
    expect(result).toBeNull()
  })

  it('注入 vision provider 时返回识别文本', async () => {
    const p = await writeTmp('scan.png', Buffer.from([0x89, 0x50, 0x4e, 0x47]))
    const result = await FileExtractor.extract(p, undefined, {
      visionExtract: async () => '识别出的文本内容',
    })
    expect(result).toBe('识别出的文本内容')
  })
})

describe('FileExtractor 不支持类型', () => {
  it('未知类型仍返回 null（不回归）', async () => {
    const p = await writeTmp('file.xyz', 'whatever')
    expect(await FileExtractor.extract(p)).toBeNull()
  })
})
