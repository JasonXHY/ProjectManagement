import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import SummaryRow from '../SummaryRow'
import { Project, FileRecord } from '../../../types'

const mockProject: Project = {
  id: 1,
  name: '测试项目',
  category_type: 'stage',
  custom_stages: null,
  current_stage: '需求',
  folder_uuid: 'abc-123',
  metadata: null,
  milestones: null,
  created_at: '2026-06-17',
  updated_at: '2026-06-17',
}

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
    content_extracted: '合同内容',
    is_analyzed: true,
    has_signature: false,
    signature_status: 'unsigned',
    ai_summary: '这是一份合同',
    ai_key_info: null,
    created_at: '2026-06-17',
  },
  {
    id: 2,
    project_id: 1,
    filename: '需求文档.docx',
    original_path: '/test/需求文档.docx',
    stored_path: '/stored/需求文档.docx',
    category: '需求',
    subcategory: null,
    stage: '需求',
    file_type: 'docx',
    file_size: 2048,
    content_extracted: '需求文档内容',
    is_analyzed: false,
    has_signature: false,
    signature_status: 'pending',
    ai_summary: null,
    ai_key_info: null,
    created_at: '2026-06-17',
  },
  {
    id: 3,
    project_id: 1,
    filename: '方案.pdf',
    original_path: '/test/方案.pdf',
    stored_path: '/stored/方案.pdf',
    category: '方案',
    subcategory: null,
    stage: '方案',
    file_type: 'pdf',
    file_size: 4096,
    content_extracted: '方案内容',
    is_analyzed: false,
    has_signature: false,
    signature_status: 'unsigned',
    ai_summary: null,
    ai_key_info: null,
    created_at: '2026-06-17',
  },
]

describe('SummaryRow', () => {
  it('renders 4 stat cards (文件数量, 里程碑, 待处理, AI 摘要)', () => {
    render(<SummaryRow project={mockProject} files={mockFiles} />)

    expect(screen.getByText('文件数量')).toBeInTheDocument()
    expect(screen.getByText('里程碑')).toBeInTheDocument()
    expect(screen.getByText('待处理')).toBeInTheDocument()
    expect(screen.getByText('AI 摘要')).toBeInTheDocument()
  })

  it('shows file count from files array length', () => {
    render(<SummaryRow project={mockProject} files={mockFiles} />)

    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('shows next milestone title (first milestone with date > now)', () => {
    const futureDate = new Date()
    futureDate.setMonth(futureDate.getMonth() + 1)
    const dateStr = futureDate.toISOString().split('T')[0]

    const projectWithMilestone: Project = {
      ...mockProject,
      milestones: JSON.stringify([
        { title: '旧里程碑', date: '2020-01-01', type: 'milestone' },
        { title: '未来里程碑', date: dateStr, type: 'key_node' },
      ]),
    }

    render(<SummaryRow project={projectWithMilestone} files={mockFiles} />)

    expect(screen.getByText('未来里程碑')).toBeInTheDocument()
  })

  it('shows dash when no milestones', () => {
    render(<SummaryRow project={mockProject} files={mockFiles} />)

    const milestoneValues = screen.getAllByText('—')
    expect(milestoneValues.length).toBeGreaterThanOrEqual(1)
  })

  it('counts pending files (is_analyzed === false)', () => {
    render(<SummaryRow project={mockProject} files={mockFiles} />)

    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('calls onViewSummary when view button clicked', () => {
    const onViewSummary = vi.fn()
    render(
      <SummaryRow
        project={mockProject}
        files={mockFiles}
        onViewSummary={onViewSummary}
      />
    )

    screen.getByText('查看摘要').click()
    expect(onViewSummary).toHaveBeenCalled()
  })

  it('calls onGenerateSummary when generate button clicked', () => {
    const onGenerateSummary = vi.fn()
    render(
      <SummaryRow
        project={mockProject}
        files={mockFiles}
        onGenerateSummary={onGenerateSummary}
      />
    )

    screen.getByText('生成/更新').click()
    expect(onGenerateSummary).toHaveBeenCalled()
  })
})
