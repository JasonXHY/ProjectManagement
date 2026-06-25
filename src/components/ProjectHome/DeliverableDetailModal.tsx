import { memo, useState } from 'react'
import { Modal } from 'antd'
import { CheckOutlined, CloseOutlined, DownOutlined, UpOutlined } from '@ant-design/icons'
import { Deliverable } from '../../types'

interface DeliverableDetailModalProps {
  open: boolean
  onClose: () => void
  deliverables: Deliverable[]
}

const statusConfig: Record<string, { color: string; label: string }> = {
  draft: { color: 'var(--bg-secondary)', label: '草稿' },
  merged: { color: '#FEF3C7', label: '整合中' },
  ready: { color: '#DBEAFE', label: '待交付' },
  delivered: { color: '#D1FAE5', label: '已交付' },
}

const DeliverableDetailModal = memo(function DeliverableDetailModal({
  open,
  onClose,
  deliverables,
}: DeliverableDetailModalProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <Modal
      title="交付物清单"
      open={open}
      onCancel={onClose}
      footer={null}
      width={640}
    >
      {deliverables.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-placeholder)' }}>
          暂无交付物
        </div>
      ) : (
        <div>
          {deliverables.map((item, index) => {
            const statusInfo = statusConfig[item.status] || statusConfig.draft
            const isExpanded = expandedId === item.id

            return (
              <div key={item.id}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 0',
                    borderBottom: index < deliverables.length - 1 ? '1px solid var(--border-light)' : 'none',
                    cursor: 'pointer',
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                >
                  <span style={{ color: item.status === 'delivered' ? 'var(--color-success)' : 'var(--text-disabled)', fontSize: '16px' }}>
                    {item.status === 'delivered' ? <CheckOutlined /> : <CloseOutlined />}
                  </span>
                  <span style={{ flex: 1, fontSize: '14px', fontWeight: 500 }}>{item.name}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-placeholder)' }}>{item.type}</span>
                  <span style={{ fontSize: '11px', background: 'var(--bg-secondary)', padding: '1px 6px', borderRadius: 'var(--radius-sm)' }}>
                    {item.currentVersion}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: statusInfo.color,
                      color: statusInfo.label === '已交付' ? '#065F46' : statusInfo.label === '待交付' ? '#1E40AF' : 'var(--text-placeholder)',
                    }}
                  >
                    {statusInfo.label}
                  </span>
                  {item.versions.length > 0 && (
                    <span style={{ fontSize: '12px', color: 'var(--text-placeholder)' }}>
                      {isExpanded ? <UpOutlined /> : <DownOutlined />}
                    </span>
                  )}
                </div>

                {isExpanded && item.versions.length > 0 && (
                  <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '12px 16px', margin: '6px 0 4px 26px' }}>
                    {item.versions.map((version) => (
                      <div key={version.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', fontSize: '12px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', minWidth: '40px' }}>{version.versionNo}</span>
                        <span style={{ flex: 1, color: 'var(--text-secondary)' }}>{version.note || '-'}</span>
                        <span style={{ color: 'var(--text-placeholder)' }}>{version.createdAt}</span>
                        <button
                          style={{
                            fontSize: '11px',
                            color: 'var(--color-primary)',
                            cursor: 'pointer',
                            border: 'none',
                            background: 'none',
                            padding: '2px 6px',
                            borderRadius: 'var(--radius-sm)',
                          }}
                        >
                          查看
                        </button>
                      </div>
                    ))}
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

export default DeliverableDetailModal
