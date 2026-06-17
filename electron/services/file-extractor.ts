import { promises as fsPromises } from 'fs'
import * as path from 'path'
import mammoth from 'mammoth'
import WordExtractor from 'word-extractor'
import ExcelJS from 'exceljs'
import { PDFParse } from 'pdf-parse'
import * as pdfjsLib from 'pdfjs-dist'

declare global {
  class OffscreenCanvas extends EventTarget {
    constructor(width: number, height: number)
    getContext(contextId: '2d'): OffscreenCanvasRenderingContext2D | null
    convertToBlob(options?: { type?: string; quality?: number }): Promise<Blob>
  }
  interface OffscreenCanvasRenderingContext2D extends CanvasStateMethods, CanvasTransformMethods, CanvasFillStrokeMethods, CanvasDrawMethods, CanvasImageMethods, CanvasTextMethods, CanvasPathMethods {
    canvas: OffscreenCanvas
  }
  interface CanvasStateMethods { save(): void; restore(): void; resetTransform(): void }
  interface CanvasTransformMethods { setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void }
  interface CanvasFillStrokeMethods { fill(): void; stroke(): void }
  interface CanvasDrawMethods { drawImage(image: unknown, ...args: unknown[]): void }
  interface CanvasImageMethods { createImageData(sw: number, sh: number): ImageData }
  interface CanvasTextMethods { fillText(text: string, x: number, y: number, maxWidth?: number): void }
  interface CanvasPathMethods { beginPath(): void; moveTo(x: number, y: number): void; lineTo(x: number, y: number): void; closePath(): void }
  interface ImageData { width: number; height: number; data: Uint8ClampedArray }
  interface Blob { arrayBuffer(): Promise<ArrayBuffer> }
}

/** 提取选项：可注入视觉识别能力用于图片 OCR */
export interface ExtractOptions {
  /** 接收 base64 dataURL，返回识别文本；用于图片内容提取 */
  visionExtract?: (imageBase64: string) => Promise<string | null>
}

/** 文件内容提取服务，支持TXT/CSV/PDF/Word/Excel/图片等格式 */
export class FileExtractor {
  /**
   * 提取文件内容
   * @param filePath 文件路径
   * @param extractionSettings 可选的提取方式配置，key 为文件类型后缀对应的设置名
   * @returns 提取的文本内容，不支持的文件类型返回null
   */
  static async extract(
    filePath: string,
    extractionSettings?: Record<string, string>,
    options?: ExtractOptions
  ): Promise<string | null> {
    const ext = path.extname(filePath).toLowerCase()

    try {
      switch (ext) {
        case '.txt':
        case '.md':
        case '.json':
          return await this.extractText(filePath)
        case '.csv':
          return await this.extractCSV(filePath)
        case '.png':
        case '.jpg':
        case '.jpeg':
        case '.gif':
        case '.bmp':
          return await this.extractImage(filePath, options)
        case '.pdf': {
          // 检查是否配置了云端提取（扫描版PDF）
          if (extractionSettings?.extraction_pdf_scanned === 'cloud') {
            // 尝试本地提取，如果失败则返回 null（由调用方决定是否走云端）
            const text = await this.extractPDF(filePath)
            if (!text || text.trim().length < 10) {
              return null
            }
            return text
          }
          return await this.extractPDF(filePath)
        }
        case '.doc':
        case '.docx':
          return await this.extractWord(filePath)
        case '.xls':
        case '.xlsx':
          return await this.extractExcel(filePath)
        default:
          // 其它不支持的类型，返回null
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
    return await fsPromises.readFile(filePath, 'utf-8')
  }

  /**
   * 提取CSV内容（按文本读取，保留分隔结构供AI分析）
   */
  private static async extractCSV(filePath: string): Promise<string> {
    return await fsPromises.readFile(filePath, 'utf-8')
  }

  /**
   * 提取图片内容（通过多模态AI视觉识别）。
   * 未注入 visionExtract 时优雅降级返回 null（不抛错），以便无 vision provider 时上传不中断。
   */
  private static async extractImage(filePath: string, options?: ExtractOptions): Promise<string | null> {
    if (!options?.visionExtract) {
      console.warn('[FileExtractor] 未配置视觉提取能力，图片内容跳过提取:', path.basename(filePath))
      return null
    }
    try {
      const buffer = await fsPromises.readFile(filePath)
      const ext = path.extname(filePath).toLowerCase().replace('.', '') || 'png'
      const base64 = `data:image/${ext};base64,${buffer.toString('base64')}`
      const text = await options.visionExtract(base64)
      return text && text.trim() ? text : null
    } catch (error) {
      console.error('[FileExtractor] 图片提取失败:', error)
      return null
    }
  }

  /**
   * 提取PDF内容
   * 使用 pdf-parse v2 API
   */
  private static async extractPDF(filePath: string): Promise<string> {
    const buffer = await fsPromises.readFile(filePath)
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
   * .docx使用mammoth，.doc使用word-extractor
   */
  private static async extractWord(filePath: string): Promise<string> {
    const ext = path.extname(filePath).toLowerCase()

    if (ext === '.doc') {
      // 旧版.doc格式使用word-extractor
      const extractor = new WordExtractor()
      const doc = await extractor.extract(filePath)
      return doc.getText()
    }

    // .docx格式使用mammoth
    const buffer = await fsPromises.readFile(filePath)
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }

  /**
   * 提取Excel内容
   */
  private static async extractExcel(filePath: string): Promise<string> {
    const buffer = await fsPromises.readFile(filePath)
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)
    const allText: string[] = []

    workbook.eachSheet((sheet) => {
      const rows: string[] = []
      sheet.eachRow({ includeEmpty: false }, (row) => {
        const values: string[] = []
        row.eachCell({ includeEmpty: true }, (cell) => {
          values.push(String(cell.value ?? ''))
        })
        rows.push(values.join(','))
      })
      allText.push(`[${sheet.name}]\n${rows.join('\n')}`)
    })

    return allText.join('\n\n')
  }

  /**
   * 将PDF转换为图片（Base64）
   * 使用pdfjs-dist的getOperatorList()提取图像数据，避免canvas原生模块
   */
  static async pdfToImage(filePath: string): Promise<string | null> {
    try {
      const buffer = await fsPromises.readFile(filePath)
      const data = new Uint8Array(buffer)
      
      const loadingTask = pdfjsLib.getDocument({ data })
      const pdf = await loadingTask.promise
      
      if (pdf.numPages === 0) return null
      
      const page = await pdf.getPage(1)
      const viewport = page.getViewport({ scale: 1.0 })
      
      const canvas = new OffscreenCanvas(viewport.width, viewport.height)
      const ctx = canvas.getContext('2d')
      
      if (!ctx) return null
      
      await page.render({
        canvasContext: ctx as unknown as { fillRect(x: number, y: number, w: number, h: number): void; drawImage(...args: unknown[]): void },
        viewport
      }).promise
      
      const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.8 })
      const arrayBuffer = await blob.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString('base64')
      
      return `data:image/jpeg;base64,${base64}`
    } catch (error) {
      console.error('PDF转图片失败:', error)
      return null
    }
  }
}
