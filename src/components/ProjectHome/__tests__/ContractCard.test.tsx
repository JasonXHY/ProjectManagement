import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ContractCard from '../cards/ContractCard'
import { Project, FileRecord } from '../../../types'

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
    { title: '合同签署', date: '2026-01-15', type: 'milestone', category: '售前' },
    { title: '首付款', date: '2026-01-20', type: 'payment', amount: 500000, confirmed: true },
    { title: '上线验收', date: '2026-06-01', type: 'payment', amount: 500000, confirmed: false },
  ]),
  created_at: '2026-06-17',
  updated_at: '2026-06-17',
}

const mockFiles: FileRecord[] = [
  {
    id: 1,
    project_id: 1,
    filename: '合同.pdf',
    original_path: '/test/合同.pdf',
    stored_path: '/stored/合同.pdf',
    category: '合同',
    subcategory: null,
    stage: '售前',
    file_type: 'pdf',
    file_size: 1024,
    content_extracted: null,
    is_analyzed: true,
    has_signature: false,
    signature_status: 'signed',
    ai_summary: null,
    ai_key_info: null,
    created_at: '2026-06-17',
  },
]

describe('ContractCard', () => {
  it('renders contract amount', () => {
    render(<ContractCard project={mockProject} allFiles={mockFiles} />)

    expect(screen.getByText('合同概览')).toBeInTheDocument()
    expect(screen.getByText('¥1,000,000.00')).toBeInTheDocument()
  })

  it('renders contract items breakdown', () => {
    render(<ContractCard project={mockProject} allFiles={mockFiles} />)

    expect(screen.getByText('软件许可')).toBeInTheDocument()
    expect(screen.getByText('实施服务')).toBeInTheDocument()
    expect(screen.getByText('客户化开发')).toBeInTheDocument()
  })

  it('renders confirmed income from payment milestones', () => {
    render(<ContractCard project={mockProject} allFiles={mockFiles} />)

    const confirmed = screen.getAllByText(/已确认/)
    expect(confirmed.length).toBeGreaterThanOrEqual(1)
    const amounts = screen.getAllByText(/500,000/)
    expect(amounts.length).toBeGreaterThanOrEqual(1)
  })

  it('shows empty state when no contract data', () => {
    const emptyProject: Project = {
      ...mockProject,
      metadata: null,
      milestones: null,
    }

    render(<ContractCard project={emptyProject} allFiles={[]} />)

    expect(screen.getByText('暂无合同数据')).toBeInTheDocument()
  })

  it('has view all button', () => {
    render(<ContractCard project={mockProject} allFiles={mockFiles} />)

    expect(screen.getByText('查看明细 →')).toBeInTheDocument()
  })

  it('handles malformed JSON metadata gracefully', () => {
    const badProject: Project = {
      ...mockProject,
      metadata: 'not valid json{{{',
    }

    render(<ContractCard project={badProject} allFiles={[]} />)

    expect(screen.getByText('暂无合同数据')).toBeInTheDocument()
  })

  it('handles empty object metadata', () => {
    const emptyMetaProject: Project = {
      ...mockProject,
      metadata: '{}',
    }

    render(<ContractCard project={emptyMetaProject} allFiles={[]} />)

    expect(screen.getByText('暂无合同数据')).toBeInTheDocument()
  })

  it('handles contract_amount = 0', () => {
    const zeroAmountProject: Project = {
      ...mockProject,
      metadata: JSON.stringify({ contract_amount: 0, contract_items: [] }),
    }

    render(<ContractCard project={zeroAmountProject} allFiles={[]} />)

    expect(screen.getByText('暂无合同数据')).toBeInTheDocument()
  })

  it('handles contract_items with missing fields', () => {
    const partialProject: Project = {
      ...mockProject,
      metadata: JSON.stringify({
        contract_amount: 50000,
        contract_items: [{ name: 'Item1' }],
      }),
    }

    render(<ContractCard project={partialProject} allFiles={[]} />)

    expect(screen.getByText('¥50,000.00')).toBeInTheDocument()
    expect(screen.getByText('Item1')).toBeInTheDocument()
  })
})
