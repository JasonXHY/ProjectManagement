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

    expect(screen.getByText('需求跟踪')).toBeInTheDocument()
    expect(screen.getByText('关键问题')).toBeInTheDocument()
    expect(screen.getByText('签字追踪')).toBeInTheDocument()
    expect(screen.queryByText('项目信息')).not.toBeInTheDocument()
    expect(screen.queryByText('合同概览')).not.toBeInTheDocument()
    expect(screen.queryByText('项目评估')).not.toBeInTheDocument()
    expect(screen.queryByText('拓展商机')).not.toBeInTheDocument()
    expect(screen.queryByText('交付物清单')).not.toBeInTheDocument()
    expect(screen.queryByText('项目总结')).not.toBeInTheDocument()
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
    expect(screen.getByText('合同概览')).toBeInTheDocument()
    expect(screen.getByText('项目评估')).toBeInTheDocument()
    expect(screen.queryByText('需求跟踪')).not.toBeInTheDocument()
    expect(screen.queryByText('关键问题')).not.toBeInTheDocument()
    expect(screen.queryByText('签字追踪')).not.toBeInTheDocument()
  })

  it('shows closed cards when sidebar is 关闭', () => {
    render(
      <FeatureCards
        project={mockProject}
        selectedCategory="关闭"
        allFiles={mockFiles}
      />
    )

    expect(screen.getByText('拓展商机')).toBeInTheDocument()
    expect(screen.getByText('交付物清单')).toBeInTheDocument()
    expect(screen.getByText('项目总结')).toBeInTheDocument()
    expect(screen.queryByText('需求跟踪')).not.toBeInTheDocument()
    expect(screen.queryByText('项目信息')).not.toBeInTheDocument()
  })

  it('shows handover cards when sidebar is 转客户成功', () => {
    render(
      <FeatureCards
        project={mockProject}
        selectedCategory="转客户成功"
        allFiles={mockFiles}
      />
    )

    expect(screen.getByText('签字追踪')).toBeInTheDocument()
    expect(screen.getByText('拓展商机')).toBeInTheDocument()
    expect(screen.getByText('交付物清单')).toBeInTheDocument()
    expect(screen.queryByText('需求跟踪')).not.toBeInTheDocument()
    expect(screen.queryByText('项目总结')).not.toBeInTheDocument()
  })
})
