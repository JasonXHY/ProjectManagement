import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import DeliverableCard from '../cards/DeliverableCard'
import { Project, FileRecord } from '../../../types'

const mockProject: Project = {
  id: 1,
  name: '测试项目',
  category_type: 'stage',
  custom_stages: null,
  current_stage: '关闭',
  folder_uuid: 'abc-123',
  metadata: JSON.stringify({
    deliverables: [
      {
        id: '1',
        name: '业务蓝图',
        type: '方案',
        status: 'delivered',
        currentVersion: 'v2.0',
        versions: [
          { id: 'v1', versionNo: 'v1.0', status: 'draft', createdAt: '2026-06-20' },
          { id: 'v2', versionNo: 'v2.0', status: 'final', createdAt: '2026-07-15' },
        ],
        createdAt: '2026-06-20',
        updatedAt: '2026-07-15',
      },
      {
        id: '2',
        name: '用户操作手册',
        type: '手册',
        status: 'ready',
        currentVersion: 'v1.0',
        versions: [
          { id: 'v3', versionNo: 'v1.0', status: 'final', createdAt: '2026-07-01' },
        ],
        createdAt: '2026-07-01',
        updatedAt: '2026-07-01',
      },
    ],
  }),
  milestones: null,
  created_at: '2026-06-17',
  updated_at: '2026-06-17',
}

function makeFile(overrides: Partial<FileRecord>): FileRecord {
  return {
    id: 1,
    filename: 'test.pdf',
    project_id: 1,
    category: null,
    subcategory: null,
    stage: null,
    stored_path: '/test.pdf',
    original_path: null,
    file_type: null,
    file_size: null,
    content_extracted: null,
    ai_summary: null,
    ai_key_info: null,
    is_analyzed: false,
    has_signature: false,
    signature_status: 'unsigned',
    created_at: '2026-06-01',
    ...overrides,
  }
}

describe('DeliverableCard', () => {
  it('renders deliverable card', () => {
    render(<DeliverableCard project={mockProject} allFiles={[]} />)

    expect(screen.getByText('交付物清单')).toBeInTheDocument()
    expect(screen.getByText('· 2 项')).toBeInTheDocument()
    expect(screen.getByText('查看全部 →')).toBeInTheDocument()
  })

  it('shows deliverable list', () => {
    render(<DeliverableCard project={mockProject} allFiles={[]} />)

    expect(screen.getByText('业务蓝图')).toBeInTheDocument()
    expect(screen.getByText('用户操作手册')).toBeInTheDocument()
  })

  it('shows deliverable status', () => {
    render(<DeliverableCard project={mockProject} allFiles={[]} />)

    expect(screen.getByText('已交付')).toBeInTheDocument()
    expect(screen.getByText('待交付')).toBeInTheDocument()
  })

  it('shows version information', () => {
    render(<DeliverableCard project={mockProject} allFiles={[]} />)

    expect(screen.getByText('v2.0')).toBeInTheDocument()
    expect(screen.getByText('v1.0')).toBeInTheDocument()
  })

  it('shows empty state when no deliverables', () => {
    const emptyProject: Project = {
      ...mockProject,
      metadata: null,
    }

    render(<DeliverableCard project={emptyProject} allFiles={[]} />)

    expect(screen.getByText('暂无交付物')).toBeInTheDocument()
  })

  it('auto-identifies deliverables from file.category matching rules', () => {
    const files = [
      makeFile({ id: 1, filename: '业务蓝图.pdf', category: '方案', subcategory: '蓝图' }),
      makeFile({ id: 2, filename: '操作手册.docx', category: '上线', subcategory: '操作手册' }),
      makeFile({ id: 3, filename: '测试报告.xlsx', category: '测试', subcategory: '测试报告' }),
    ]

    render(<DeliverableCard project={{ ...mockProject, metadata: null }} allFiles={files} />)

    expect(screen.getByText('业务蓝图.pdf')).toBeInTheDocument()
    expect(screen.getByText('操作手册.docx')).toBeInTheDocument()
    expect(screen.getByText('测试报告.xlsx')).toBeInTheDocument()
  })

  it('does NOT match files by file.stage (project stage) only by file.category', () => {
    const files = [
      makeFile({ id: 1, filename: '需求文档.pdf', category: '需求', stage: '进行中' }),
    ]

    render(<DeliverableCard project={{ ...mockProject, metadata: null }} allFiles={files} />)

    expect(screen.getByText('暂无交付物')).toBeInTheDocument()
  })

  it('matches files by filename keywords regardless of category', () => {
    const files = [
      makeFile({ id: 1, filename: '验收报告最终版.pdf', category: '验收' }),
    ]

    render(<DeliverableCard project={{ ...mockProject, metadata: null }} allFiles={files} />)

    expect(screen.getByText('验收报告最终版.pdf')).toBeInTheDocument()
  })
})
