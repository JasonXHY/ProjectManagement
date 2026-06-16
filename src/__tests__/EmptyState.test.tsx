import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EmptyState from '../components/common/EmptyState'

describe('EmptyState', () => {
  it('渲染标题', () => {
    render(<EmptyState title="还没有项目" />)
    expect(screen.getByText('还没有项目')).toBeInTheDocument()
  })

  it('渲染描述', () => {
    render(
      <EmptyState
        title="还没有项目"
        description="创建你的第一个项目"
      />
    )
    expect(screen.getByText('创建你的第一个项目')).toBeInTheDocument()
  })

  it('不传描述时不渲染描述区域', () => {
    const { container } = render(<EmptyState title="空状态" />)
    const descriptions = container.querySelectorAll('[style*="var(--text-placeholder)"]')
    expect(descriptions.length).toBe(0)
  })

  it('渲染操作按钮', () => {
    const onClick = vi.fn()
    render(
      <EmptyState
        title="空状态"
        action={{ label: '创建项目', onClick }}
      />
    )
    expect(screen.getByText('创建项目')).toBeInTheDocument()
  })

  it('点击操作按钮触发回调', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <EmptyState
        title="空状态"
        action={{ label: '点击我', onClick }}
      />
    )
    await user.click(screen.getByText('点击我'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('不传action时不渲染按钮', () => {
    const { container } = render(<EmptyState title="空状态" />)
    const buttons = container.querySelectorAll('button')
    expect(buttons.length).toBe(0)
  })

  it('使用CSS变量颜色（非硬编码）', () => {
    const { container } = render(<EmptyState title="测试" />)
    const iconContainer = container.querySelector('[style*="var(--bg-secondary)"]')
    expect(iconContainer).toBeInTheDocument()
  })
})
