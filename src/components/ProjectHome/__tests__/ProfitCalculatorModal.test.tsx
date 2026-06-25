import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ProfitCalculatorModal from '../ProfitCalculatorModal'

describe('ProfitCalculatorModal', () => {
  it('renders calculator form', () => {
    render(<ProfitCalculatorModal open={true} onClose={vi.fn()} />)

    expect(screen.getByText('利润测算')).toBeInTheDocument()
    expect(screen.getByText(/合同总额/)).toBeInTheDocument()
    expect(screen.getByText(/内部人天/)).toBeInTheDocument()
    expect(screen.getByText(/外包人天/)).toBeInTheDocument()
  })

  it('has calculate button', () => {
    render(<ProfitCalculatorModal open={true} onClose={vi.fn()} />)

    expect(screen.getByRole('button', { name: /测\s*算/ })).toBeInTheDocument()
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

  it('shows result after calculation', () => {
    render(<ProfitCalculatorModal open={true} onClose={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /测\s*算/ }))

    expect(screen.getByText('测算结果')).toBeInTheDocument()
    expect(screen.getByText('总成本')).toBeInTheDocument()
    expect(screen.getByText('整体利润率')).toBeInTheDocument()
  })
})
