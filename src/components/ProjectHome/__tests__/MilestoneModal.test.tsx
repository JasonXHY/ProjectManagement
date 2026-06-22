import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import MilestoneModal from '../MilestoneModal'
import { Milestone } from '../../../types'

const mockMilestones: Milestone[] = [
  { title: '需求确认', date: '2026-01-15', type: 'milestone' },
  { title: '合同签署', date: '2026-02-01', type: 'key_node' },
  { title: '方案评审', date: '2026-03-10', type: 'milestone' },
  { title: '上线部署', date: '2026-06-01', type: 'key_node' },
  { title: '项目验收', date: '2026-07-15', type: 'key_node' },
]

describe('MilestoneModal', () => {
  it('renders all milestones', () => {
    render(
      <MilestoneModal
        open={true}
        onClose={vi.fn()}
        milestones={mockMilestones}
      />
    )

    expect(screen.getByText('需求确认')).toBeInTheDocument()
    expect(screen.getByText('合同签署')).toBeInTheDocument()
    expect(screen.getByText('方案评审')).toBeInTheDocument()
    expect(screen.getByText('上线部署')).toBeInTheDocument()
    expect(screen.getByText('项目验收')).toBeInTheDocument()
  })

  it('shows title 里程碑时间轴', () => {
    render(
      <MilestoneModal
        open={true}
        onClose={vi.fn()}
        milestones={mockMilestones}
      />
    )

    expect(screen.getByText('里程碑时间轴')).toBeInTheDocument()
  })

  it('shows dates in MM-DD format', () => {
    render(
      <MilestoneModal
        open={true}
        onClose={vi.fn()}
        milestones={mockMilestones}
      />
    )

    expect(screen.getByText('01-15')).toBeInTheDocument()
    expect(screen.getByText('02-01')).toBeInTheDocument()
    expect(screen.getByText('03-10')).toBeInTheDocument()
    expect(screen.getByText('06-01')).toBeInTheDocument()
    expect(screen.getByText('07-15')).toBeInTheDocument()
  })

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn()
    render(
      <MilestoneModal
        open={true}
        onClose={onClose}
        milestones={mockMilestones}
      />
    )

    screen.getByRole('button', { name: /close/i }).click()
    expect(onClose).toHaveBeenCalled()
  })

  it('does not render when open is false', () => {
    render(
      <MilestoneModal
        open={false}
        onClose={vi.fn()}
        milestones={mockMilestones}
      />
    )

    expect(screen.queryByText('里程碑时间轴')).not.toBeInTheDocument()
  })

  it('shows star icon for key milestones', () => {
    render(
      <MilestoneModal
        open={true}
        onClose={vi.fn()}
        milestones={mockMilestones}
      />
    )

    const stars = document.querySelectorAll('[data-icon="star"]')
    expect(stars.length).toBe(3) // 合同签署, 上线部署, 项目验收
  })
})