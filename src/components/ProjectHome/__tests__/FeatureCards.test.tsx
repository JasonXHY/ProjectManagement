import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import FeatureCards from '../FeatureCards'
import { Project, FileRecord } from '../../../types'

const mockProject: Project = {
  id: 1,
  name: '测试项目',
  category_type: 'stage',
  custom_stages: null,
  current_stage: '进行中',
  folder_uuid: 'abc-123',
  metadata: null,
  milestones: null,
  created_at: '2026-06-17',
  updated_at: '2026-06-17',
}

const mockFiles: FileRecord[] = []

describe('FeatureCards', () => {
  it('shows progress cards when sidebar is 所有文件 and stage is 进行中', () => {
    render(
      <FeatureCards
        project={{ ...mockProject, current_stage: '进行中' }}
        selectedCategory="所有文件"
        allFiles={mockFiles}
      />
    )

    expect(screen.getByText('需求')).toBeInTheDocument()
    expect(screen.getByText('问题')).toBeInTheDocument()
    expect(screen.getByText('签字')).toBeInTheDocument()
    expect(screen.queryByText('项目信息')).not.toBeInTheDocument()
    expect(screen.queryByText('合同')).not.toBeInTheDocument()
    expect(screen.queryByText('评估')).not.toBeInTheDocument()
    expect(screen.queryByText('商机')).not.toBeInTheDocument()
    expect(screen.queryByText('交付物')).not.toBeInTheDocument()
    expect(screen.queryByText('总结')).not.toBeInTheDocument()
  })

  it('shows presale cards when sidebar is 售前', () => {
    render(
      <FeatureCards
        project={mockProject}
        selectedCategory="售前"
        allFiles={mockFiles}
      />
    )

    expect(screen.getByText('项目信息')).toBeInTheDocument()
    expect(screen.getByText('合同')).toBeInTheDocument()
    expect(screen.getByText('评估')).toBeInTheDocument()
    expect(screen.queryByText('需求')).not.toBeInTheDocument()
    expect(screen.queryByText('问题')).not.toBeInTheDocument()
    expect(screen.queryByText('签字')).not.toBeInTheDocument()
  })

  it('shows closed cards when sidebar is 关闭', () => {
    render(
      <FeatureCards
        project={mockProject}
        selectedCategory="关闭"
        allFiles={mockFiles}
      />
    )

    expect(screen.getByText('商机')).toBeInTheDocument()
    expect(screen.getByText('交付物')).toBeInTheDocument()
    expect(screen.getByText('总结')).toBeInTheDocument()
    expect(screen.queryByText('需求')).not.toBeInTheDocument()
    expect(screen.queryByText('项目信息')).not.toBeInTheDocument()
  })
})
