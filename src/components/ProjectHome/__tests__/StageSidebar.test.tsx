import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import StageSidebar from '../StageSidebar'
import { FileRecord } from '../../../types'

const mockFiles: FileRecord[] = [
  { id: 1, filename: 'a.pdf', project_id: 1, category: '售前', subcategory: null, stage: null, stored_path: '/a.pdf', original_path: null, file_type: null, file_size: null, content_extracted: null, ai_summary: null, ai_key_info: null, is_analyzed: false, has_signature: false, signature_status: 'unsigned', created_at: '' },
  { id: 2, filename: 'b.pdf', project_id: 1, category: '需求', subcategory: null, stage: null, stored_path: '/b.pdf', original_path: null, file_type: null, file_size: null, content_extracted: null, ai_summary: null, ai_key_info: null, is_analyzed: false, has_signature: false, signature_status: 'unsigned', created_at: '' },
]

describe('StageSidebar', () => {
  it('renders default stages when no customStages provided', () => {
    render(
      <StageSidebar
        files={mockFiles}
        selectedCategory={null}
        onSelectCategory={vi.fn()}
        onUpload={vi.fn()}
      />
    )
    expect(screen.getByText('售前')).toBeInTheDocument()
    expect(screen.getByText('需求')).toBeInTheDocument()
    expect(screen.getByText('方案')).toBeInTheDocument()
  })

  it('renders custom stages when customStages provided', () => {
    render(
      <StageSidebar
        files={mockFiles}
        selectedCategory={null}
        onSelectCategory={vi.fn()}
        onUpload={vi.fn()}
        customStages={['阶段A', '阶段B', '阶段C']}
      />
    )
    expect(screen.getByText('阶段A')).toBeInTheDocument()
    expect(screen.getByText('阶段B')).toBeInTheDocument()
    expect(screen.getByText('阶段C')).toBeInTheDocument()
  })

  it('does not render default stages when customStages provided', () => {
    render(
      <StageSidebar
        files={mockFiles}
        selectedCategory={null}
        onSelectCategory={vi.fn()}
        onUpload={vi.fn()}
        customStages={['自定义阶段']}
      />
    )
    expect(screen.queryByText('售前')).not.toBeInTheDocument()
    expect(screen.queryByText('需求')).not.toBeInTheDocument()
  })

  it('always renders 所有文件 and 未分类', () => {
    render(
      <StageSidebar
        files={mockFiles}
        selectedCategory={null}
        onSelectCategory={vi.fn()}
        onUpload={vi.fn()}
        customStages={['自定义阶段']}
      />
    )
    expect(screen.getByText('所有文件')).toBeInTheDocument()
    expect(screen.getByText('未分类')).toBeInTheDocument()
  })

  it('shows file count for each stage', () => {
    render(
      <StageSidebar
        files={mockFiles}
        selectedCategory={null}
        onSelectCategory={vi.fn()}
        onUpload={vi.fn()}
      />
    )
    expect(screen.getByText('2')).toBeInTheDocument()
  })
})
