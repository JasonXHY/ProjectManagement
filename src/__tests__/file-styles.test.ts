import { describe, it, expect } from 'vitest'
import {
  FILE_TYPE_STYLE,
  getFileTypeStyle,
  getFileTypeLabel,
  getFileTypeDesc,
} from '../components/ProjectHome/projectHome.styles'

describe('FILE_TYPE_STYLE', () => {
  it('包含常见文件类型样式', () => {
    expect(FILE_TYPE_STYLE).toHaveProperty('pdf')
    expect(FILE_TYPE_STYLE).toHaveProperty('doc')
    expect(FILE_TYPE_STYLE).toHaveProperty('docx')
    expect(FILE_TYPE_STYLE).toHaveProperty('xls')
    expect(FILE_TYPE_STYLE).toHaveProperty('xlsx')
    expect(FILE_TYPE_STYLE).toHaveProperty('txt')
    expect(FILE_TYPE_STYLE).toHaveProperty('md')
  })

  it('每个类型有color和bg', () => {
    Object.values(FILE_TYPE_STYLE).forEach((style) => {
      expect(style).toHaveProperty('color')
      expect(style).toHaveProperty('bg')
    })
  })
})

describe('getFileTypeStyle', () => {
  it('PDF文件返回红色样式', () => {
    const style = getFileTypeStyle('report.pdf')
    expect(style.color).toBe('#DC2626')
  })

  it('Word文件返回蓝色样式', () => {
    const style = getFileTypeStyle('doc.docx')
    expect(style.color).toBe('#2563EB')
  })

  it('Excel文件返回绿色样式', () => {
    const style = getFileTypeStyle('data.xlsx')
    expect(style.color).toBe('#059669')
  })

  it('未知类型返回默认灰色', () => {
    const style = getFileTypeStyle('file.xyz')
    expect(style.color).toBe('#6B7280')
  })

  it('无扩展名返回默认灰色', () => {
    const style = getFileTypeStyle('noext')
    expect(style.color).toBe('#6B7280')
  })
})

describe('getFileTypeLabel', () => {
  it('PDF返回"PDF"', () => {
    expect(getFileTypeLabel('report.pdf')).toBe('PDF')
  })

  it('DOCX返回"DOC"', () => {
    expect(getFileTypeLabel('doc.docx')).toBe('DOC')
  })

  it('XLSX返回"XLS"', () => {
    expect(getFileTypeLabel('data.xlsx')).toBe('XLS')
  })

  it('未知类型返回大写扩展名', () => {
    expect(getFileTypeLabel('file.xyz')).toBe('XYZ')
  })
})

describe('getFileTypeDesc', () => {
  it('PDF返回"PDF 文档"', () => {
    expect(getFileTypeDesc('report.pdf')).toBe('PDF 文档')
  })

  it('DOCX返回"Word 文档"', () => {
    expect(getFileTypeDesc('doc.docx')).toBe('Word 文档')
  })

  it('XLSX返回"Excel 表格"', () => {
    expect(getFileTypeDesc('data.xlsx')).toBe('Excel 表格')
  })

  it('TXT返回"文本文件"', () => {
    expect(getFileTypeDesc('readme.txt')).toBe('文本文件')
  })

  it('未知类型返回"文件"', () => {
    expect(getFileTypeDesc('file.xyz')).toBe('文件')
  })
})
