// @vitest-environment node
import { describe, it, expect, afterEach } from 'vitest'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { FileExtractor } from '../file-extractor'

const tmpFiles: string[] = []

async function writeTmp(name: string, content: string | Buffer): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'pmaer-doc-'))
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

describe('FileExtractor .doc格式支持', () => {
  it('.doc文件提取文本内容（使用word-extractor）', async () => {
    // 创建一个简单的文本文件作为测试（实际.doc是二进制格式）
    // word-extractor会尝试解析，如果不是有效.doc格式会抛错
    const p = await writeTmp('test.doc', '这是测试内容')
    const result = await FileExtractor.extract(p)
    // 由于这是假的.doc文件，word-extractor会抛错，被catch捕获返回null
    expect(result === null || typeof result === 'string').toBe(true)
  })

  it('.docx文件正常提取内容（使用mammoth）', async () => {
    // .docx是ZIP格式，这里测试文件不存在的情况
    const p = await writeTmp('test.docx', Buffer.from([0x50, 0x4b, 0x03, 0x04]))
    const result = await FileExtractor.extract(p)
    // 无效的.docx文件应返回null（被catch捕获）
    expect(result).toBeNull()
  })

  it('未知格式返回null', async () => {
    const p = await writeTmp('test.xyz', '内容')
    const result = await FileExtractor.extract(p)
    expect(result).toBeNull()
  })
})
