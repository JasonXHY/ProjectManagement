import { memo, useMemo } from 'react'
import { Modal, Tag } from 'antd'
import { StarFilled } from '@ant-design/icons'
import { MilestoneExtended } from '../../types'
import { formatAmount } from '../../utils/format'

interface MilestoneModalProps {
  open: boolean
  onClose: () => void
  milestones: MilestoneExtended[]
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

// 阶段分组顺序（单一数据源：stages.ts）
import { FILE_CLASSIFICATION_STAGES } from '../../../electron/shared/stages'

const MilestoneModal = memo(function MilestoneModal({
  open,
  onClose,
  milestones,
}: MilestoneModalProps) {
  // 按日期排序
  const sorted = useMemo(() => {
    return [...milestones].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [milestones])

  // 找到下一个里程碑索引
  const nextIndex = useMemo(() => {
    const now = new Date()
    for (let i = 0; i < sorted.length; i++) {
      if (new Date(sorted[i].date) > now) return i
    }
    return -1
  }, [sorted])

  // 按阶段分组
  const grouped = useMemo(() => {
    const groups: Record<string, MilestoneExtended[]> = {}
    sorted.forEach(m => {
      const category = m.category || '其他'
      if (!groups[category]) groups[category] = []
      groups[category].push(m)
    })
    // 按阶段顺序排序
    const orderedGroups: { category: string; items: MilestoneExtended[] }[] = []
    FILE_CLASSIFICATION_STAGES.forEach(cat => {
      if (groups[cat]) {
        orderedGroups.push({ category: cat, items: groups[cat] })
      }
    })
    // 添加未在预定义顺序中的阶段
    Object.keys(groups).forEach(cat => {
      if (!FILE_CLASSIFICATION_STAGES.includes(cat)) {
        orderedGroups.push({ category: cat, items: groups[cat] })
      }
    })
    return orderedGroups
  }, [sorted])

  // 获取全局索引（用于判断next状态）
  const getGlobalIndex = (category: string, localIndex: number): number => {
    let globalIndex = 0
    for (const group of grouped) {
      if (group.category === category) {
        return globalIndex + localIndex
      }
      globalIndex += group.items.length
    }
    return -1
  }

  return (
    <Modal
      title="里程碑时间轴"
      open={open}
      onCancel={onClose}
      footer={null}
      width={640}
      style={{ top: 20 }}
    >
      <div style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
        {grouped.map((group, groupIndex) => (
          <div key={group.category} style={{ marginBottom: groupIndex < grouped.length - 1 ? '24px' : 0 }}>
            <div style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '12px',
              paddingBottom: '8px',
              borderBottom: '1px solid var(--border-light)',
            }}>
              {group.category}
            </div>
            {group.items.map((m, localIndex) => {
              const globalIndex = getGlobalIndex(group.category, localIndex)
              const status = getStatus(m.date, nextIndex, globalIndex)
              const isKey = isKeyMilestone(m.title)

              let dotColor: string
              if (status === 'done') {
                dotColor = '#4F46E5'
              } else if (status === 'next') {
                dotColor = '#F59E0B'
              } else {
                dotColor = '#D1D5DB'
              }

              if (new Date(m.date) < new Date() && status !== 'done') {
                dotColor = '#EF4444'
              }

              return (
                <div
                  key={m.id || `${group.category}-${localIndex}`}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '8px 0',
                    position: 'relative',
                  }}
                >
                  {/* 时间轴线 */}
                  <div style={{
                    position: 'absolute',
                    left: '5px',
                    top: '20px',
                    bottom: '-8px',
                    width: '2px',
                    background: localIndex < group.items.length - 1 ? 'var(--border-default)' : 'transparent',
                  }} />

                  {/* 节点圆点 */}
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: dotColor,
                    flexShrink: 0,
                    marginTop: '4px',
                    boxShadow: status === 'next' ? '0 0 0 3px rgba(245,158,11,0.2)' : 'none',
                  }} />

                  {/* 内容 */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '14px',
                        color: status === 'done' ? '#6B7280' : '#374151',
                        textDecoration: status === 'done' ? 'line-through' : 'none',
                        fontWeight: status === 'next' ? 'bold' : 'normal',
                      }}>
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
                      {m.manuallyEdited && (
                        <Tag color="blue" style={{ marginLeft: '4px' }}>
                          手动编辑
                        </Tag>
                      )}
                    </div>

                    {/* 付款信息 */}
                    {m.type === 'payment' && (
                      <div style={{ fontSize: '12px', color: 'var(--text-placeholder)', marginTop: '4px' }}>
                        {m.amount && <span>金额: {formatAmount(m.amount)}</span>}
                        {m.confirmed !== undefined && (
                          <span style={{
                            marginLeft: '8px',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            backgroundColor: m.confirmed ? '#D1FAE5' : '#FEF3C7',
                            color: m.confirmed ? '#065F46' : '#92400E',
                          }}>
                            {m.confirmed ? '已确认' : '待确认'}
                          </span>
                        )}
                      </div>
                    )}

                    {/* 日期 */}
                    <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
                      {formatDate(m.date)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </Modal>
  )
})

export default MilestoneModal
