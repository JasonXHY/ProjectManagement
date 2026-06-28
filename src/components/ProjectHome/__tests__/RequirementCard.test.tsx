import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import RequirementCard from '../cards/RequirementCard'
import { Project } from '../../../types'

const mockProject: Project = {
  id: 1,
  name: '测试项目',
  category_type: 'stage',
  custom_stages: null,
  current_stage: '需求',
  folder_uuid: 'abc-123',
  metadata: JSON.stringify({
    requirements: [
      { name: '用户登录功能', status: 'progress', detail: '支持手机号登录' },
      { name: '数据导出功能', status: 'pending', detail: '支持Excel导出' },
      { name: '权限管理', status: 'completed', detail: '角色权限控制' },
    ],
  }),
  milestones: null,
  created_at: '2026-06-17',
  updated_at: '2026-06-17',
}

describe('RequirementCard', () => {
  it('renders requirement list', () => {
    render(<RequirementCard project={mockProject} allFiles={[]} />)

    expect(screen.getByText('需求跟踪')).toBeInTheDocument()
    expect(screen.getByText('用户登录功能')).toBeInTheDocument()
    expect(screen.getByText('数据导出功能')).toBeInTheDocument()
    expect(screen.getByText('权限管理')).toBeInTheDocument()
  })

  it('shows max 3 requirements', () => {
    const projectWithManyReqs: Project = {
      ...mockProject,
      metadata: JSON.stringify({
        requirements: [
          { name: '需求1', status: 'pending' },
          { name: '需求2', status: 'pending' },
          { name: '需求3', status: 'pending' },
          { name: '需求4', status: 'pending' },
        ],
      }),
    }

    render(<RequirementCard project={projectWithManyReqs} allFiles={[]} />)

    expect(screen.getByText('需求1')).toBeInTheDocument()
    expect(screen.getByText('需求2')).toBeInTheDocument()
    expect(screen.getByText('需求3')).toBeInTheDocument()
    expect(screen.queryByText('需求4')).not.toBeInTheDocument()
  })

  it('shows empty state when no requirements', () => {
    const emptyProject: Project = {
      ...mockProject,
      metadata: null,
    }

    render(<RequirementCard project={emptyProject} allFiles={[]} />)

    expect(screen.getByText('暂无需求记录')).toBeInTheDocument()
  })

  it('has manage button', () => {
    render(<RequirementCard project={mockProject} allFiles={[]} />)

    expect(screen.getByText('管理 →')).toBeInTheDocument()
  })

  it('handles malformed JSON metadata', () => {
    const badProject: Project = { ...mockProject, metadata: 'bad json' }
    render(<RequirementCard project={badProject} allFiles={[]} />)
    expect(screen.getByText('暂无需求记录')).toBeInTheDocument()
  })

  it('handles empty requirements array', () => {
    const emptyProject: Project = {
      ...mockProject,
      metadata: JSON.stringify({ requirements: [] }),
    }
    render(<RequirementCard project={emptyProject} allFiles={[]} />)
    expect(screen.getByText('暂无需求记录')).toBeInTheDocument()
  })

  it('handles requirements with missing name field', () => {
    const partialProject: Project = {
      ...mockProject,
      metadata: JSON.stringify({ requirements: [{ status: 'pending' }] }),
    }
    render(<RequirementCard project={partialProject} allFiles={[]} />)
    // Component renders the row even with missing name (shows empty req-name div)
    expect(screen.getByText('待定')).toBeInTheDocument()
  })
})
