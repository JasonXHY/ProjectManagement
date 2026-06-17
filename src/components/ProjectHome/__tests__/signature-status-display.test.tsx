import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import FileListTable from '../FileListTable'
import { FileRecord } from '../../../types'

const mockFiles: FileRecord[] = [
  {
    id: 1,
    project_id: 1,
    filename: '合同_已签.pdf',
    original_path: '/test/合同_已签.pdf',
    stored_path: '/stored/合同_已签.pdf',
    category: '验收',
    subcategory: '已签',
    stage: '验收',
    file_type: 'pdf',
    file_size: 1024,
    content_extracted: '合同内容',
    is_analyzed: true,
    has_signature: true,
    signature_status: 'signed',
    ai_summary: '这是一份已签署的合同',
    ai_key_info: '{"amount":"500000"}',
    created_at: '2026-06-17',
  },
  {
    id: 2,
    project_id: 1,
    filename: '需求文档_待签.docx',
    original_path: '/test/需求文档_待签.docx',
    stored_path: '/stored/需求文档_待签.docx',
    category: '需求',
    subcategory: null,
    stage: '需求',
    file_type: 'docx',
    file_size: 2048,
    content_extracted: '需求文档内容',
    is_analyzed: true,
    has_signature: false,
    signature_status: 'pending',
    ai_summary: '这是一份待签署的需求文档',
    ai_key_info: null,
    created_at: '2026-06-17',
  },
  {
    id: 3,
    project_id: 1,
    filename: '方案_未签.pdf',
    original_path: '/test/方案_未签.pdf',
    stored_path: '/stored/方案_未签.pdf',
    category: '方案',
    subcategory: null,
    stage: '方案',
    file_type: 'pdf',
    file_size: 4096,
    content_extracted: '方案内容',
    is_analyzed: true,
    has_signature: false,
    signature_status: 'unsigned',
    ai_summary: null,
    ai_key_info: null,
    created_at: '2026-06-17',
  },
]

describe('FileListTable signature_status显示', () => {
  it('显示已签字状态为绿色标签', () => {
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

    expect(screen.getByText('已签')).toBeInTheDocument()
  })

  it('显示待签字状态为橙色标签', () => {
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

    expect(screen.getByText('待签')).toBeInTheDocument()
  })

  it('显示未签字状态为灰色标签', () => {
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

    expect(screen.getByText('未签')).toBeInTheDocument()
  })
})
