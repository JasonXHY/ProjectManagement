import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import AISummaryModal from '../AISummaryModal'

describe('AISummaryModal', () => {
  it('renders summary content', () => {
    render(
      <AISummaryModal
        open={true}
        onClose={vi.fn()}
        summary="这是一个项目摘要，包含项目概况、进度、关键问题等信息。"
      />
    )

    expect(screen.getByText('AI 项目摘要')).toBeInTheDocument()
    expect(screen.getByText(/这是一个项目摘要/)).toBeInTheDocument()
  })

  it('renders empty state when no summary', () => {
    render(
      <AISummaryModal
        open={true}
        onClose={vi.fn()}
        summary=""
      />
    )

    expect(screen.getByText('暂无摘要')).toBeInTheDocument()
    expect(screen.getByText('点击"生成/更新"按钮生成项目摘要')).toBeInTheDocument()
  })

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn()
    render(
      <AISummaryModal
        open={true}
        onClose={onClose}
        summary="测试摘要"
      />
    )

    screen.getByRole('button', { name: /close/i }).click()
    expect(onClose).toHaveBeenCalled()
  })

  it('does not render when open is false', () => {
    render(
      <AISummaryModal
        open={false}
        onClose={vi.fn()}
        summary="测试摘要"
      />
    )

    expect(screen.queryByText('AI 项目摘要')).not.toBeInTheDocument()
  })

  it('renders markdown content', () => {
    const markdownSummary = `# 项目概况

这是一个测试项目。

## 关键信息
- 项目名称：测试项目
- 项目状态：进行中

## 下一步
1. 完成需求分析
2. 开始开发`

    render(
      <AISummaryModal
        open={true}
        onClose={vi.fn()}
        summary={markdownSummary}
      />
    )

    expect(screen.getByText('项目概况')).toBeInTheDocument()
    expect(screen.getByText(/这是一个测试项目/)).toBeInTheDocument()
  })
})
