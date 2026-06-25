import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ListDetailModal from '../ListDetailModal'

const mockItems = [
  { id: 1, name: '项目1', status: 'active', description: '描述1' },
  { id: 2, name: '项目2', status: 'inactive', description: '描述2' },
]

describe('ListDetailModal', () => {
  it('renders item list', () => {
    render(
      <ListDetailModal
        open={true}
        onClose={vi.fn()}
        title="测试列表"
        items={mockItems}
        renderItem={(item) => <span>{item.name}</span>}
      />
    )

    expect(screen.getByText('测试列表')).toBeInTheDocument()
    expect(screen.getByText('项目1')).toBeInTheDocument()
    expect(screen.getByText('项目2')).toBeInTheDocument()
  })

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn()
    render(
      <ListDetailModal
        open={true}
        onClose={onClose}
        title="测试列表"
        items={mockItems}
        renderItem={(item) => <span>{item.name}</span>}
      />
    )

    screen.getByRole('button', { name: /close/i }).click()
    expect(onClose).toHaveBeenCalled()
  })

  it('does not render when open is false', () => {
    render(
      <ListDetailModal
        open={false}
        onClose={vi.fn()}
        title="测试列表"
        items={mockItems}
        renderItem={(item) => <span>{item.name}</span>}
      />
    )

    expect(screen.queryByText('测试列表')).not.toBeInTheDocument()
  })

  it('shows empty state when no items', () => {
    render(
      <ListDetailModal
        open={true}
        onClose={vi.fn()}
        title="测试列表"
        items={[]}
        renderItem={(item) => <span>{item.name}</span>}
        emptyText="暂无数据"
      />
    )

    expect(screen.getByText('暂无数据')).toBeInTheDocument()
  })
})
