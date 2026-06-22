import { memo, useMemo } from 'react'
import { Modal, Timeline, Tag } from 'antd'
import { StarFilled } from '@ant-design/icons'
import { Milestone } from '../../types'

interface MilestoneModalProps {
  open: boolean
  onClose: () => void
  milestones: Milestone[]
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${m}-${day}`
}

function isKeyMilestone(title: string): boolean {
  return title.includes('合同') || title.includes('上线') || title.includes('验收')
}

function getStatus(dateStr: string, nextIndex: number, index: number): 'done' | 'next' | 'pending' {
  const date = new Date(dateStr)
  const now = new Date()
  if (date < now) return 'done'
  if (index === nextIndex) return 'next'
  return 'pending'
}

const MilestoneModal = memo(function MilestoneModal({
  open,
  onClose,
  milestones,
}: MilestoneModalProps) {
  const sorted = useMemo(() => {
    return [...milestones].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [milestones])

  const nextIndex = useMemo(() => {
    const now = new Date()
    for (let i = 0; i < sorted.length; i++) {
      if (new Date(sorted[i].date) > now) return i
    }
    return -1
  }, [sorted])

  return (
    <Modal
      title="里程碑时间轴"
      open={open}
      onCancel={onClose}
      footer={null}
      width={640}
    >
      <Timeline
        items={sorted.map((m, index) => {
          const status = getStatus(m.date, nextIndex, index)
          const isKey = isKeyMilestone(m.title)

          let color: string
          if (status === 'done') {
            color = '#4F46E5' // Indigo solid
          } else if (status === 'next') {
            color = '#F59E0B' // Amber solid
          } else {
            color = '#D1D5DB' // Gray hollow
          }

          if (new Date(m.date) < new Date() && status !== 'done') {
            color = '#EF4444' // Red for overdue
          }

          return {
            color,
            content: (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '14px',
                    color: status === 'done' ? '#6B7280' : '#374151',
                    textDecoration: status === 'done' ? 'line-through' : 'none',
                    fontWeight: status === 'next' ? 'bold' : 'normal',
                  }}
                >
                  {m.title}
                </span>
                {isKey && (
                  <StarFilled style={{ color: '#F59E0B', fontSize: '14px' }} />
                )}
                {status === 'next' && (
                  <Tag color="amber" style={{ marginLeft: '4px' }}>
                    下一步
                  </Tag>
                )}
                <span
                  style={{
                    fontSize: '12px',
                    color: '#9CA3AF',
                    marginLeft: 'auto',
                  }}
                >
                  {formatDate(m.date)}
                </span>
              </div>
            ),
          }
        })}
      />
    </Modal>
  )
})

export default MilestoneModal