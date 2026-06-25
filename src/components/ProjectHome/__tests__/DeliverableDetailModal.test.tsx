import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import DeliverableDetailModal from '../DeliverableDetailModal'
import { Deliverable } from '../../../types'

const mockDeliverables: Deliverable[] = [
  {
    id: '1',
    name: '业务蓝图',
    type: '方案',
    status: 'delivered',
    currentVersion: 'v2.0',
    versions: [
      { id: 'v1', versionNo: 'v1.0', status: 'draft', createdAt: '2026-06-20', note: '初稿' },
      { id: 'v2', versionNo: 'v2.0', status: 'final', createdAt: '2026-07-15', note: '最终交付版' },
    ],
    createdAt: '2026-06-20',
    updatedAt: '2026-07-15',
  },
  {
    id: '2',
    name: '用户操作手册',
    type: '手册',
    status: 'ready',
    currentVersion: 'v1.0',
    versions: [
      { id: 'v3', versionNo: 'v1.0', status: 'final', createdAt: '2026-07-01', note: '完成版' },
    ],
    createdAt: '2026-07-01',
    updatedAt: '2026-07-01',
  },
]

describe('DeliverableDetailModal', () => {
  it('renders deliverable list', () => {
    render(<DeliverableDetailModal open={true} onClose={vi.fn()} deliverables={mockDeliverables} />)

    expect(screen.getByText('交付物清单')).toBeInTheDocument()
    expect(screen.getByText('业务蓝图')).toBeInTheDocument()
    expect(screen.getByText('用户操作手册')).toBeInTheDocument()
  })

  it('shows deliverable status', () => {
    render(<DeliverableDetailModal open={true} onClose={vi.fn()} deliverables={mockDeliverables} />)

    expect(screen.getByText('已交付')).toBeInTheDocument()
    expect(screen.getByText('待交付')).toBeInTheDocument()
  })

  it('shows version information', () => {
    render(<DeliverableDetailModal open={true} onClose={vi.fn()} deliverables={mockDeliverables} />)

    expect(screen.getByText('v2.0')).toBeInTheDocument()
    expect(screen.getByText('v1.0')).toBeInTheDocument()
  })

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn()
    render(<DeliverableDetailModal open={true} onClose={onClose} deliverables={mockDeliverables} />)

    screen.getByRole('button', { name: /close/i }).click()
    expect(onClose).toHaveBeenCalled()
  })

  it('does not render when open is false', () => {
    render(<DeliverableDetailModal open={false} onClose={vi.fn()} deliverables={mockDeliverables} />)

    expect(screen.queryByText('交付物清单')).not.toBeInTheDocument()
  })

  it('shows empty state when no deliverables', () => {
    render(<DeliverableDetailModal open={true} onClose={vi.fn()} deliverables={[]} />)

    expect(screen.getByText('暂无交付物')).toBeInTheDocument()
  })
})
