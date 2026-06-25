import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ContractDetailModal from '../ContractDetailModal'
import { Project } from '../../../types'

const mockProject: Project = {
  id: 1,
  name: '测试项目',
  category_type: 'stage',
  custom_stages: null,
  current_stage: '售前',
  folder_uuid: 'abc-123',
  metadata: JSON.stringify({
    contract_amount: 1000000,
    contract_items: [
      { name: '软件许可', amount: 300000, description: '基础软件' },
      { name: '实施服务', amount: 400000, description: '部署实施' },
      { name: '客户化开发', amount: 300000, description: '定制开发' },
    ],
  }),
  milestones: JSON.stringify([
    { title: '首付款', date: '2026-01-20', type: 'payment', amount: 500000, confirmed: true },
    { title: '上线验收', date: '2026-06-01', type: 'payment', amount: 500000, confirmed: false },
  ]),
  created_at: '2026-06-17',
  updated_at: '2026-06-17',
}

describe('ContractDetailModal', () => {
  it('renders contract items breakdown', () => {
    render(<ContractDetailModal open={true} onClose={vi.fn()} project={mockProject} />)

    expect(screen.getByText('合同明细')).toBeInTheDocument()
    expect(screen.getByText('软件许可')).toBeInTheDocument()
    expect(screen.getByText('实施服务')).toBeInTheDocument()
    expect(screen.getByText('客户化开发')).toBeInTheDocument()
  })

  it('renders payment milestones', () => {
    render(<ContractDetailModal open={true} onClose={vi.fn()} project={mockProject} />)

    expect(screen.getByText('付款里程碑')).toBeInTheDocument()
    expect(screen.getByText('首付款')).toBeInTheDocument()
    expect(screen.getByText('上线验收')).toBeInTheDocument()
  })

  it('shows confirmed status', () => {
    render(<ContractDetailModal open={true} onClose={vi.fn()} project={mockProject} />)

    expect(screen.getByText('已确认')).toBeInTheDocument()
    expect(screen.getByText('待确认')).toBeInTheDocument()
  })

  it('shows total contract amount', () => {
    render(<ContractDetailModal open={true} onClose={vi.fn()} project={mockProject} />)

    expect(screen.getByText('¥100.00万')).toBeInTheDocument()
  })

  it('shows confirmed income', () => {
    render(<ContractDetailModal open={true} onClose={vi.fn()} project={mockProject} />)

    expect(screen.getByText('已确认收入')).toBeInTheDocument()
    const amounts = screen.getAllByText('¥50.00万')
    expect(amounts.length).toBeGreaterThanOrEqual(1)
  })

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn()
    render(<ContractDetailModal open={true} onClose={onClose} project={mockProject} />)

    screen.getByRole('button', { name: /close/i }).click()
    expect(onClose).toHaveBeenCalled()
  })

  it('does not render when open is false', () => {
    render(<ContractDetailModal open={false} onClose={vi.fn()} project={mockProject} />)

    expect(screen.queryByText('合同明细')).not.toBeInTheDocument()
  })
})
