import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SignatureCard from '../cards/SignatureCard'
import { Project, FileRecord } from '../../../types'

const mockProject: Project = {
  id: 1,
  name: '测试项目',
  category_type: 'stage',
  custom_stages: null,
  current_stage: '验收',
  folder_uuid: 'abc-123',
  metadata: JSON.stringify({
    contract_amount: 300000,
    contract_items: [
      { name: '软件许可', amount: 100000 },
      { name: '实施服务', amount: 200000 },
    ],
  }),
  milestones: null,
  created_at: '2026-06-17',
  updated_at: '2026-06-17',
}

const mockFiles: FileRecord[] = []

describe('SignatureCard', () => {
  it('renders signature tracking card', () => {
    render(<SignatureCard project={mockProject} allFiles={mockFiles} />)

    expect(screen.getByText('签字追踪')).toBeInTheDocument()
    expect(screen.getByText('查看全部 →')).toBeInTheDocument()
  })

  it('shows tier description', () => {
    render(<SignatureCard project={mockProject} allFiles={mockFiles} />)

    expect(screen.getByText(/规则：10-50万/)).toBeInTheDocument()
  })

  it('shows generated signature docs', () => {
    render(<SignatureCard project={mockProject} allFiles={mockFiles} />)

    expect(screen.getByText('合同原件')).toBeInTheDocument()
  })

  it('shows empty project without contract info', () => {
    const emptyProject: Project = {
      ...mockProject,
      metadata: null,
    }

    render(<SignatureCard project={emptyProject} allFiles={[]} />)

    expect(screen.getByText('签字追踪')).toBeInTheDocument()
    expect(screen.getByText(/规则：10万以下/)).toBeInTheDocument()
  })

  it('has view all button', () => {
    render(<SignatureCard project={mockProject} allFiles={mockFiles} />)

    expect(screen.getByText('查看全部 →')).toBeInTheDocument()
  })
})
