import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import SignatureDetailModal from '../SignatureDetailModal'
import { SignatureDoc } from '../../../types'

const mockDocs: SignatureDoc[] = [
  { id: '1', name: '合同原件', required: true, status: 'signed', source: 'auto', category: '售前' },
  { id: '2', name: '上线确认单', required: true, status: 'unsigned', source: 'auto', category: '上线' },
  { id: '3', name: '验收确认单', required: true, status: 'unsigned', source: 'auto', category: '验收' },
]

describe('SignatureDetailModal', () => {
  it('renders signature file list', () => {
    render(<SignatureDetailModal open={true} onClose={vi.fn()} docs={mockDocs} />)

    expect(screen.getByText('签字文件追踪')).toBeInTheDocument()
    expect(screen.getByText('合同原件')).toBeInTheDocument()
    expect(screen.getByText('上线确认单')).toBeInTheDocument()
    expect(screen.getByText('验收确认单')).toBeInTheDocument()
  })

  it('shows signature statistics', () => {
    render(<SignatureDetailModal open={true} onClose={vi.fn()} docs={mockDocs} />)

    expect(screen.getByText('1')).toBeInTheDocument()
    const signed = screen.getAllByText('已签字')
    expect(signed.length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('2')).toBeInTheDocument()
    const unsigned = screen.getAllByText('待签字')
    expect(unsigned.length).toBeGreaterThanOrEqual(1)
  })

  it('shows upload button for unsigned docs', () => {
    render(<SignatureDetailModal open={true} onClose={vi.fn()} docs={mockDocs} />)

    const uploadButtons = screen.getAllByText('上传')
    expect(uploadButtons.length).toBe(2)
  })

  it('shows add manual button', () => {
    render(<SignatureDetailModal open={true} onClose={vi.fn()} docs={mockDocs} />)

    expect(screen.getByText('手动添加')).toBeInTheDocument()
  })

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn()
    render(<SignatureDetailModal open={true} onClose={onClose} docs={mockDocs} />)

    screen.getByRole('button', { name: /close/i }).click()
    expect(onClose).toHaveBeenCalled()
  })

  it('does not render when open is false', () => {
    render(<SignatureDetailModal open={false} onClose={vi.fn()} docs={mockDocs} />)

    expect(screen.queryByText('签字文件追踪')).not.toBeInTheDocument()
  })

  it('shows empty state when no docs', () => {
    render(<SignatureDetailModal open={true} onClose={vi.fn()} docs={[]} />)

    expect(screen.getByText('暂无签字文件')).toBeInTheDocument()
  })
})
