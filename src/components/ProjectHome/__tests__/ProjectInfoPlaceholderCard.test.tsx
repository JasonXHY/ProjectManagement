import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProjectInfoPlaceholderCard from '../cards/ProjectInfoPlaceholderCard'
import { Project } from '../../../types'

const mockProject: Project = {
  id: 1,
  name: '测试项目',
  category_type: 'stage',
  custom_stages: null,
  current_stage: '售前',
  folder_uuid: 'abc-123',
  metadata: JSON.stringify({
    project_code: 'PRJ-001',
    customer_name: '测试客户公司',
    contact_person: '张三',
    contact_phone: '13800138000',
    customer_address: '北京市朝阳区',
    project_manager: '李四',
  }),
  milestones: null,
  created_at: '2026-06-17',
  updated_at: '2026-06-17',
}

describe('ProjectInfoPlaceholderCard', () => {
  it('renders project info with customer_name from metadata', () => {
    render(<ProjectInfoPlaceholderCard project={mockProject} allFiles={[]} />)

    expect(screen.getByText('项目信息')).toBeInTheDocument()
    expect(screen.getByText('PRJ-001')).toBeInTheDocument()
    expect(screen.getByText('测试客户公司')).toBeInTheDocument()
    expect(screen.getByText('张三')).toBeInTheDocument()
  })

  it('shows dash for missing customer_name', () => {
    const emptyProject: Project = {
      ...mockProject,
      metadata: JSON.stringify({ project_code: 'PRJ-002' }),
    }
    render(<ProjectInfoPlaceholderCard project={emptyProject} allFiles={[]} />)

    const dashes = screen.getAllByText('-')
    expect(dashes.length).toBeGreaterThanOrEqual(1)
  })
})
