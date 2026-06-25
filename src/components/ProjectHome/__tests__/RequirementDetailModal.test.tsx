import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import RequirementDetailModal from '../RequirementDetailModal'

const mockRequirements = [
  { name: '用户登录功能', status: 'progress', detail: '支持手机号登录', source: '需求文档.docx' },
  { name: '数据导出功能', status: 'pending', detail: '支持Excel导出', source: '会议纪要.docx' },
  { name: '权限管理', status: 'completed', detail: '角色权限控制', source: '需求文档.docx' },
]

describe('RequirementDetailModal', () => {
  it('renders requirement list', () => {
    render(<RequirementDetailModal open={true} onClose={vi.fn()} requirements={mockRequirements} />)

    expect(screen.getByText('需求管理')).toBeInTheDocument()
    expect(screen.getByText('用户登录功能')).toBeInTheDocument()
    expect(screen.getByText('数据导出功能')).toBeInTheDocument()
    expect(screen.getByText('权限管理')).toBeInTheDocument()
  })

  it('shows requirement details', () => {
    render(<RequirementDetailModal open={true} onClose={vi.fn()} requirements={mockRequirements} />)

    expect(screen.getByText('支持手机号登录')).toBeInTheDocument()
    expect(screen.getByText('支持Excel导出')).toBeInTheDocument()
    expect(screen.getByText('角色权限控制')).toBeInTheDocument()
  })

  it('shows status tags', () => {
    render(<RequirementDetailModal open={true} onClose={vi.fn()} requirements={mockRequirements} />)

    expect(screen.getByText('进行中')).toBeInTheDocument()
    expect(screen.getByText('待确认')).toBeInTheDocument()
    expect(screen.getByText('已完成')).toBeInTheDocument()
  })

  it('shows source files', () => {
    render(<RequirementDetailModal open={true} onClose={vi.fn()} requirements={mockRequirements} />)

    const sources = screen.getAllByText(/需求文档\.docx/)
    expect(sources.length).toBe(2)
    expect(screen.getByText(/会议纪要\.docx/)).toBeInTheDocument()
  })

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn()
    render(<RequirementDetailModal open={true} onClose={onClose} requirements={mockRequirements} />)

    screen.getByRole('button', { name: /close/i }).click()
    expect(onClose).toHaveBeenCalled()
  })

  it('does not render when open is false', () => {
    render(<RequirementDetailModal open={false} onClose={vi.fn()} requirements={mockRequirements} />)

    expect(screen.queryByText('需求管理')).not.toBeInTheDocument()
  })

  it('shows empty state when no requirements', () => {
    render(<RequirementDetailModal open={true} onClose={vi.fn()} requirements={[]} />)

    expect(screen.getByText('暂无需求记录')).toBeInTheDocument()
  })
})
