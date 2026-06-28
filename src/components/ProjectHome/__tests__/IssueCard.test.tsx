import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import IssueCard from '../cards/IssueCard'
import { Project } from '../../../types'

const mockProject: Project = {
  id: 1,
  name: '测试项目',
  category_type: 'stage',
  custom_stages: null,
  current_stage: '构建',
  folder_uuid: 'abc-123',
  metadata: JSON.stringify({
    key_issues: [
      { text: '服务器性能问题', priority: 'high', status: 'open' },
      { text: '接口响应慢', priority: 'medium', status: 'resolved' },
      { text: '数据同步延迟', priority: 'low', status: 'open' },
    ],
  }),
  milestones: null,
  created_at: '2026-06-17',
  updated_at: '2026-06-17',
}

describe('IssueCard', () => {
  it('renders issue list with count', () => {
    render(<IssueCard project={mockProject} allFiles={[]} />)

    expect(screen.getByText('关键问题')).toBeInTheDocument()
    expect(screen.getByText('· 3 个')).toBeInTheDocument()
    expect(screen.getByText('服务器性能问题')).toBeInTheDocument()
    expect(screen.getByText('接口响应慢')).toBeInTheDocument()
    expect(screen.getByText('数据同步延迟')).toBeInTheDocument()
  })

  it('shows max 3 issues', () => {
    const projectWithManyIssues: Project = {
      ...mockProject,
      metadata: JSON.stringify({
        key_issues: [
          { text: '问题1', priority: 'high', status: 'open' },
          { text: '问题2', priority: 'medium', status: 'open' },
          { text: '问题3', priority: 'low', status: 'open' },
          { text: '问题4', priority: 'low', status: 'open' },
        ],
      }),
    }

    render(<IssueCard project={projectWithManyIssues} allFiles={[]} />)

    expect(screen.getByText('问题1')).toBeInTheDocument()
    expect(screen.getByText('问题2')).toBeInTheDocument()
    expect(screen.getByText('问题3')).toBeInTheDocument()
    expect(screen.queryByText('问题4')).not.toBeInTheDocument()
  })

  it('shows empty state when no issues', () => {
    const emptyProject: Project = {
      ...mockProject,
      metadata: null,
    }

    render(<IssueCard project={emptyProject} allFiles={[]} />)

    expect(screen.getByText('暂无关键问题')).toBeInTheDocument()
  })

  it('shows issue status tags', () => {
    render(<IssueCard project={mockProject} allFiles={[]} />)

    const unresolved = screen.getAllByText('未解决')
    expect(unresolved.length).toBe(2)
    expect(screen.getByText('已解决')).toBeInTheDocument()
  })

  it('has manage button', () => {
    render(<IssueCard project={mockProject} allFiles={[]} />)

    expect(screen.getByText('管理 →')).toBeInTheDocument()
  })

  it('handles malformed JSON metadata', () => {
    const badProject: Project = { ...mockProject, metadata: 'bad json' }
    render(<IssueCard project={badProject} allFiles={[]} />)
    expect(screen.getByText('暂无关键问题')).toBeInTheDocument()
  })

  it('handles empty key_issues array', () => {
    const emptyProject: Project = {
      ...mockProject,
      metadata: JSON.stringify({ key_issues: [] }),
    }
    render(<IssueCard project={emptyProject} allFiles={[]} />)
    expect(screen.getByText('暂无关键问题')).toBeInTheDocument()
  })
})
