import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SummaryCard from '../cards/SummaryCard'
import { Project } from '../../../types'

const mockProject: Project = {
  id: 1,
  name: '测试项目',
  category_type: 'stage',
  custom_stages: null,
  current_stage: '关闭',
  folder_uuid: 'abc-123',
  metadata: JSON.stringify({
    project_overview: '本项目成功完成了系统部署，客户满意度高。项目团队协作良好，按时交付所有里程碑。建议后续跟进二期需求。',
  }),
  milestones: null,
  created_at: '2026-06-17',
  updated_at: '2026-06-17',
}

describe('SummaryCard', () => {
  it('renders project summary', () => {
    render(<SummaryCard project={mockProject} allFiles={[]} />)

    expect(screen.getByText('项目总结')).toBeInTheDocument()
    expect(screen.getByText(/本项目成功完成了系统部署/)).toBeInTheDocument()
  })

  it('shows expand button for long summary', () => {
    const longSummaryProject: Project = {
      ...mockProject,
      metadata: JSON.stringify({
        project_overview: '这是一个很长的项目总结'.repeat(20),
      }),
    }

    render(<SummaryCard project={longSummaryProject} allFiles={[]} />)

    expect(screen.getByText('展开全部')).toBeInTheDocument()
  })

  it('hides expand button for short summary', () => {
    render(<SummaryCard project={mockProject} allFiles={[]} />)

    expect(screen.queryByText('展开全部')).not.toBeInTheDocument()
  })

  it('shows empty state when no summary', () => {
    const emptyProject: Project = {
      ...mockProject,
      metadata: null,
    }

    render(<SummaryCard project={emptyProject} allFiles={[]} />)

    expect(screen.getByText('暂无项目总结')).toBeInTheDocument()
  })

  it('truncates long summary by default', () => {
    const longSummaryProject: Project = {
      ...mockProject,
      metadata: JSON.stringify({
        project_overview: '这是一个很长的项目总结'.repeat(20),
      }),
    }

    render(<SummaryCard project={longSummaryProject} allFiles={[]} />)

    const summaryEl = screen.getByText(/这是一个很长的项目总结/)
    expect(summaryEl).toBeInTheDocument()
  })

  it('handles malformed JSON metadata', () => {
    const badProject: Project = { ...mockProject, metadata: 'bad json' }
    render(<SummaryCard project={badProject} allFiles={[]} />)
    expect(screen.getByText('暂无项目总结')).toBeInTheDocument()
  })

  it('handles empty project_overview', () => {
    const emptyProject: Project = {
      ...mockProject,
      metadata: JSON.stringify({ project_overview: '' }),
    }
    render(<SummaryCard project={emptyProject} allFiles={[]} />)
    expect(screen.getByText('暂无项目总结')).toBeInTheDocument()
  })
})
