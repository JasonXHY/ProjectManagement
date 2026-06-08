import * as fs from 'fs'
import * as path from 'path'
import mammoth from 'mammoth'
import * as XLSX from 'xlsx'

export class FileExtractor {
  /**
   * 提取文件内容
   * @param filePath 文件路径
   * @returns 提取的文本内容，不支持的文件类型返回null
   */
  static async extract(filePath: string): Promise<string | null> {
    const ext = path.extname(filePath).toLowerCase()

    try {
      switch (ext) {
        case '.txt':
        case '.md':
        case '.json':
          return await this.extractText(filePath)
        case '.pdf':
          return await this.extractPDF(filePath)
        case '.doc':
        case '.docx':
          return await this.extractWord(filePath)
        case '.xls':
        case '.xlsx':
          return await this.extractExcel(filePath)
        default:
          // 图片等需要云端OCR的文件，返回null
          return null
      }
    } catch (error) {
      console.error(`文件提取失败: ${filePath}`, error)
      return null
    }
  }

  /**
   * 提取文本文件内容
   */
  private static async extractText(filePath: string): Promise<string> {
    return fs.readFileSync(filePath, 'utf-8')
  }

  /**
   * 提取PDF内容
   * 使用 pdf-parse v2 API
   */
  private static async extractPDF(filePath: string): Promise<string> {
    const { PDFParse } = require('pdf-parse')
    const buffer = fs.readFileSync(filePath)
    const parser = new PDFParse({ data: buffer })
    try {
      const result = await parser.getText()
      return result.text
    } finally {
      await parser.destroy()
    }
  }

  /**
   * 提取Word文档内容
   */
  private static async extractWord(filePath: string): Promise<string> {
    const buffer = fs.readFileSync(filePath)
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }

  /**
   * 提取Excel内容
   */
  private static async extractExcel(filePath: string): Promise<string> {
    const buffer = fs.readFileSync(filePath)
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const allText: string[] = []

    workbook.SheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName]
      const text = XLSX.utils.sheet_to_csv(sheet)
      allText.push(`[${sheetName}]\n${text}`)
    })

    return allText.join('\n\n')
  }
}
