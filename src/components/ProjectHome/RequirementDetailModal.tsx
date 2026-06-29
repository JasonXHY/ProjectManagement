import { memo, useState } from 'react'
import { Modal, Tag, Timeline } from 'antd'
import { DownOutlined, UpOutlined } from '@ant-design/icons'

interface TimelineNode {
  title: string
  date: string
  source?: string
}

interface Requirement {
  name: string
  status: string
  detail?: string
  source?: string
  solution?: string
  result?: string
  timeline?: TimelineNode[]
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
  open, onClose, requirements,
}: RequirementDetailModalProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null)

  return (
    <Modal
      title="需求管理"
      open={open}
      onCancel={onClose}
      footer={null}
      width={640}
    >
      {requirements.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-placeholder)' }}>暂无需求记录</div>
      ) : (
        <div>
          {requirements.map((req, index) => {
            const statusInfo = statusConfig[req.status] || statusConfig.pending
            const isExpanded = expandedId === index
            return (
              <div key={index}>
                <div
                  style={{ padding: '12px 0', borderBottom: index < requirements.length - 1 ? '1px solid var(--border-light)' : 'none', cursor: 'pointer' }}
                  onClick={() => setExpandedId(isExpanded ? null : index)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>{req.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Tag color={statusInfo.color}>{statusInfo.label}</Tag>
                      <span style={{ fontSize: '12px', color: 'var(--text-placeholder)' }}>{isExpanded ? <UpOutlined /> : <DownOutlined />}</span>
                    </div>
                  </div>
                  {req.detail && <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{req.detail}</div>}
                  {req.source && <div style={{ fontSize: '12px', color: 'var(--text-placeholder)' }}>来源: {req.source}</div>}
                </div>
                {isExpanded && (
                  <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '12px 16px', margin: '4px 0 4px 26px' }}>
                    {req.solution && (
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>方案</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{req.solution}</div>
                      </div>
                    )}
                    {req.result && (
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>结果</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{req.result}</div>
                      </div>
                    )}
                    {req.timeline && req.timeline.length > 0 && (
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>时间轴</div>
                        <Timeline
                          size="small"
                          items={req.timeline.map(node => ({
                            content: (
                              <div>
                                <div style={{ fontSize: '13px' }}>{node.title}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-placeholder)' }}>{node.date} {node.source && `· ${node.source}`}</div>
                              </div>
                            ),
                          }))}
                        />
                      </div>
                    )}
                    {!req.solution && !req.result && (!req.timeline || req.timeline.length === 0) && (
                      <div style={{ fontSize: '12px', color: 'var(--text-placeholder)' }}>暂无详细信息</div>
                    )}
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
