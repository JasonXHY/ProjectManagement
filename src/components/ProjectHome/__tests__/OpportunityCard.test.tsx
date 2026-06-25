import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import OpportunityCard from '../cards/OpportunityCard'
import { Project } from '../../../types'

const mockProject: Project = {
  id: 1,
  name: '测试项目',
  category_type: 'stage',
  custom_stages: null,
  current_stage: '关闭',
  folder_uuid: 'abc-123',
  metadata: JSON.stringify({
    opportunities: [
      { name: '二期系统升级', description: '客户追加的二期需求', status: 'planned' },
      { name: '数据迁移服务', description: '历史数据迁移', status: 'confirmed' },
    ],
  }),
  milestones: null,
  created_at: '2026-06-17',
  updated_at: '2026-06-17',
}

describe('OpportunityCard', () => {
  it('renders opportunity list', () => {
    render(<OpportunityCard project={mockProject} allFiles={[]} />)

    expect(screen.getByText('拓展商机')).toBeInTheDocument()
    expect(screen.getByText('二期系统升级')).toBeInTheDocument()
    expect(screen.getByText('数据迁移服务')).toBeInTheDocument()
  })

  it('shows max 3 opportunities', () => {
    const projectWithManyOpps: Project = {
      ...mockProject,
      metadata: JSON.stringify({
        opportunities: [
          { name: '商机1', status: 'planned' },
          { name: '商机2', status: 'planned' },
          { name: '商机3', status: 'planned' },
          { name: '商机4', status: 'planned' },
        ],
      }),
    }

    render(<OpportunityCard project={projectWithManyOpps} allFiles={[]} />)

    expect(screen.getByText('商机1')).toBeInTheDocument()
    expect(screen.getByText('商机2')).toBeInTheDocument()
    expect(screen.getByText('商机3')).toBeInTheDocument()
    expect(screen.queryByText('商机4')).not.toBeInTheDocument()
  })

  it('shows empty state when no opportunities', () => {
    const emptyProject: Project = {
      ...mockProject,
      metadata: null,
    }

    render(<OpportunityCard project={emptyProject} allFiles={[]} />)

    expect(screen.getByText('暂无拓展商机')).toBeInTheDocument()
  })

  it('does not use emoji', () => {
    render(<OpportunityCard project={mockProject} allFiles={[]} />)

    expect(screen.queryByText('💡')).not.toBeInTheDocument()
  })
})
