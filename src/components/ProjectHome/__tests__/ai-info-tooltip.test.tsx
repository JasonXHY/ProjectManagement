import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import FileListTable from '../FileListTable'
import { FileRecord } from '../../../types'

const mockFiles: FileRecord[] = [
  {
    id: 1,
    project_id: 1,
    filename: '合同.pdf',
    original_path: '/test/合同.pdf',
    stored_path: '/stored/合同.pdf',
    category: '验收',
    subcategory: null,
    stage: '验收',
    file_type: 'pdf',
    file_size: 1024,
    content_extracted: null,
    is_analyzed: true,
    has_signature: true,
    signature_status: 'signed',
    ai_summary: '这是一份项目合同，金额50万元',
    ai_key_info: '{"project_code":"PRJ-001","amount":"500000"}',
    created_at: '2026-06-17',
  },
  {
    id: 2,
    project_id: 1,
    filename: '方案.docx',
    original_path: '/test/方案.docx',
    stored_path: '/stored/方案.docx',
    category: '方案',
    subcategory: null,
    stage: '方案',
    file_type: 'docx',
    file_size: 2048,
    content_extracted: null,
    is_analyzed: true,
    has_signature: false,
    signature_status: 'unsigned',
    ai_summary: null,
    ai_key_info: null,
    created_at: '2026-06-17',
  },
]

describe('FileListTable AI信息展示', () => {
  it('有AI摘要的文件显示文件名', () => {
    render(
      <FileListTable
        files={mockFiles}
        classifying={null}
        onClassify={vi.fn()}
        onDelete={vi.fn()}
        onStageChange={vi.fn()}
        selectedRowKeys={[]}
        onSelectionChange={vi.fn()}
        onUpload={vi.fn()}
      />
    )

    expect(screen.getByText('合同.pdf')).toBeInTheDocument()
  })

  it('无AI摘要的文件也显示文件名', () => {
    render(
      <FileListTable
        files={mockFiles}
        classifying={null}
        onClassify={vi.fn()}
        onDelete={vi.fn()}
        onStageChange={vi.fn()}
        selectedRowKeys={[]}
        onSelectionChange={vi.fn()}
        onUpload={vi.fn()}
      />
    )

    expect(screen.getByText('方案.docx')).toBeInTheDocument()
  })
})
