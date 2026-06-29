import { memo } from 'react'
import { Modal, Tag } from 'antd'
import { StarOutlined } from '@ant-design/icons'

interface Opportunity {
  name: string
  description?: string
  solution?: string
  status?: string
  statusText?: string
}

interface Props {
  open: boolean
  onClose: () => void
  opportunities: Opportunity[]
}

const statusConfig: Record<string, { color: string; label: string }> = {
  planned: { color: 'default', label: '规划中' },
  confirmed: { color: 'processing', label: '已确认' },
  'in-progress': { color: 'success', label: '进行中' },
}

const OpportunityDetailModal = memo(function OpportunityDetailModal({
  open,
  onClose,
  opportunities,
}: Props) {
  return (
    <Modal
      title="拓展商机"
      open={open}
      onCancel={onClose}
      footer={null}
      width={640}
    >
      {opportunities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-placeholder)' }}>
          暂无拓展商机
        </div>
      ) : (
        <div>
          {opportunities.map((opp, index) => {
            const statusInfo = statusConfig[opp.status || 'planned'] || statusConfig.planned
            return (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '12px 0',
                  borderBottom: index < opportunities.length - 1 ? '1px solid var(--border-light)' : 'none',
                }}
              >
                <StarOutlined style={{ color: 'var(--color-accent)', marginTop: '2px', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>{opp.name}</div>
                  {opp.description && (
                    <div style={{ fontSize: '12px', color: 'var(--text-placeholder)', marginBottom: '2px' }}>
                      {opp.description}
                    </div>
                  )}
                  {opp.solution && (
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      方案：{opp.solution}
                    </div>
                  )}
                </div>
                <Tag color={statusInfo.color}>{statusInfo.label}</Tag>
              </div>
            )
          })}
        </div>
      )}
    </Modal>
  )
})

export default OpportunityDetailModal
