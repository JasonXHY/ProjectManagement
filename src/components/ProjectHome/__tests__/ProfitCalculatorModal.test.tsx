import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProfitCalculatorModal from '../ProfitCalculatorModal'

describe('ProfitCalculatorModal', () => {
  it('renders calculator form', () => {
    render(<ProfitCalculatorModal open={true} onClose={vi.fn()} />)

    expect(screen.getByText('利润测算')).toBeInTheDocument()
    expect(screen.getByText(/合同总额/)).toBeInTheDocument()
    expect(screen.getByText('成员配置')).toBeInTheDocument()
  })

  it('renders member table with default row', () => {
    render(<ProfitCalculatorModal open={true} onClose={vi.fn()} />)

    expect(screen.getByText('添加成员')).toBeInTheDocument()
    expect(screen.getByText('内部差旅（元）')).toBeInTheDocument()
    expect(screen.getByText('外部差旅（元）')).toBeInTheDocument()
  })

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn()
    render(<ProfitCalculatorModal open={true} onClose={onClose} />)

    screen.getByRole('button', { name: /close/i }).click()
    expect(onClose).toHaveBeenCalled()
  })

  it('does not render when open is false', () => {
    render(<ProfitCalculatorModal open={false} onClose={vi.fn()} />)

    expect(screen.queryByText('利润测算')).not.toBeInTheDocument()
  })

  it('shows result section immediately (real-time calculation)', () => {
    render(<ProfitCalculatorModal open={true} onClose={vi.fn()} />)

    expect(screen.getByText('测算结果')).toBeInTheDocument()
    expect(screen.getByText('总成本')).toBeInTheDocument()
    expect(screen.getByText('内部利润率')).toBeInTheDocument()
    expect(screen.getByText('外包利润率')).toBeInTheDocument()
    expect(screen.getByText('整体利润率')).toBeInTheDocument()
  })

  it('shows copy button in footer', () => {
    render(<ProfitCalculatorModal open={true} onClose={vi.fn()} />)

    expect(screen.getByText('复制结果')).toBeInTheDocument()
  })

  // T2 — 测算后保存到metadata（合并现有数据，不覆盖）
  it('saves evaluation to project metadata when save clicked', async () => {
    const mockGet = vi.fn().mockResolvedValue({
      success: true,
      data: { id: 1, metadata: JSON.stringify({ customer_name: '测试客户', project_code: 'PRJ-001' }) }
    })
    vi.mocked(window.api.project.get).mockImplementation(mockGet)

    const mockUpdate = vi.fn().mockResolvedValue({ success: true })
    vi.mocked(window.api.project.update).mockImplementation(mockUpdate)

    render(<ProfitCalculatorModal open={true} onClose={vi.fn()} projectId={1} />)

    screen.getByRole('button', { name: /保.*存/ }).click()

    await vi.waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled()
    })

    const [id, data] = mockUpdate.mock.calls[0]
    expect(id).toBe(1)
    const metadata = JSON.parse(data.metadata)
    expect(metadata.evaluation).toBeDefined()
    expect(metadata.evaluation.result).toBeDefined()
    expect(metadata.evaluation.members).toBeDefined()
    expect(metadata.contract_amount).toBe(0)
    expect(metadata.customer_name).toBe('测试客户')
  })
})
