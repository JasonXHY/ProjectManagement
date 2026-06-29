import { memo, useState, useEffect } from 'react'
import { Modal, Checkbox } from 'antd'

interface Issue {
  text: string
  priority?: string
  status?: string
  source?: string
}

interface Props {
  open: boolean
  onClose: () => void
  issues: Issue[]
  onIssuesChange?: (issues: Issue[]) => void
}

const priorityColors: Record<string, string> = {
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#3B82F6',
}

const IssueDetailModal = memo(function IssueDetailModal({
  open,
  onClose,
  issues,
  onIssuesChange,
}: Props) {
  const [localIssues, setLocalIssues] = useState<Issue[]>(issues)

  useEffect(() => {
    setLocalIssues(issues)
  }, [issues])

  const handleToggle = (index: number) => {
    const updated = [...localIssues]
    updated[index] = {
      ...updated[index],
      status: updated[index].status === 'resolved' ? 'open' : 'resolved',
    }
    setLocalIssues(updated)
    onIssuesChange?.(updated)
  }

  return (
    <Modal
      title="关键问题"
      open={open}
      onCancel={onClose}
      footer={null}
      width={640}
    >
      {localIssues.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-placeholder)' }}>
          暂无关键问题
        </div>
      ) : (
        <div>
          {localIssues.map((issue, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 0',
                borderBottom: i < localIssues.length - 1 ? '1px solid var(--border-light)' : 'none',
              }}
            >
              <Checkbox
                checked={issue.status === 'resolved'}
                onChange={() => handleToggle(i)}
              />
              <span
                style={{
                  flex: 1,
                  fontSize: '14px',
                  textDecoration: issue.status === 'resolved' ? 'line-through' : 'none',
                  color: issue.status === 'resolved' ? 'var(--text-placeholder)' : 'var(--text-primary)',
                }}
              >
                {issue.text}
              </span>
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: priorityColors[issue.priority || 'medium'],
                  flexShrink: 0,
                }}
              />
              {issue.source && (
                <span style={{ fontSize: '11px', color: 'var(--text-placeholder)', flexShrink: 0 }}>
                  {issue.source}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
})

export default IssueDetailModal