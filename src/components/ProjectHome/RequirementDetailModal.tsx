import { memo } from 'react'
import { Modal, Tag } from 'antd'

interface Requirement {
  name: string
  status: string
  detail?: string
  source?: string
}

interface RequirementDetailModalProps {
  open: boolean
  onClose: () => void
  requirements: Requirement[]
}

const statusConfig: Record<string, { color: string; label: string }> = {
  pending: { color: 'default', label: '待确认' },
  progress: { color: 'processing', label: '进行中' },
  completed: { color: 'success', label: '已完成' },
  delayed: { color: 'warning', label: '延期' },
  closed: { color: 'default', label: '已关闭' },
}

const RequirementDetailModal = memo(function RequirementDetailModal({
  open,
  onClose,
  requirements,
}: RequirementDetailModalProps) {
  return (
    <Modal
      title="需求管理"
      open={open}
      onCancel={onClose}
      footer={null}
      width={640}
    >
      {requirements.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-placeholder)' }}>
          暂无需求记录
        </div>
      ) : (
        <div>
          {requirements.map((req, index) => {
            const statusInfo = statusConfig[req.status] || statusConfig.pending
            return (
              <div
                key={index}
                style={{
                  padding: '16px 0',
                  borderBottom: index < requirements.length - 1 ? '1px solid var(--border-light)' : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>{req.name}</span>
                  <Tag color={statusInfo.color}>{statusInfo.label}</Tag>
                </div>
                {req.detail && (
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    {req.detail}
                  </div>
                )}
                {req.source && (
                  <div style={{ fontSize: '12px', color: 'var(--text-placeholder)' }}>
                    来源: {req.source}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Modal>
  )
})

export default RequirementDetailModal
