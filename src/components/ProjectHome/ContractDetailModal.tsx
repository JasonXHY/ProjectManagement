import { memo } from 'react'
import { Modal } from 'antd'
import { Project, Milestone } from '../../types'
import { formatAmount } from '../../utils/format'

interface ContractDetailModalProps {
  open: boolean
  onClose: () => void
  project: Project
}

const ContractDetailModal = memo(function ContractDetailModal({
  open,
  onClose,
  project,
}: ContractDetailModalProps) {
  const meta = project.metadata ? JSON.parse(project.metadata) : {}
  const contractAmount = meta.contract_amount || 0
  const contractItems = meta.contract_items || []

  let milestones: Milestone[] = []
  if (project.milestones) {
    try {
      milestones = JSON.parse(project.milestones)
    } catch {
      milestones = []
    }
  }

  const paymentMilestones = milestones.filter(m => m.type === 'payment')
  const confirmedIncome = paymentMilestones
    .filter(m => m.confirmed)
    .reduce((sum, m) => sum + (m.amount || 0), 0)

  return (
    <Modal
      title="合同明细"
      open={open}
      onCancel={onClose}
      footer={null}
      width={640}
    >
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>合同总额</span>
          <span style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-primary)' }}>
            {formatAmount(contractAmount)}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>已确认收入</span>
          <span style={{ fontSize: '16px', fontWeight: 500, color: 'var(--color-success)' }}>
            {formatAmount(confirmedIncome)}
          </span>
        </div>
      </div>

      {contractItems.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>合同分项</h4>
          {contractItems.map((item: any, index: number) => (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 0',
                borderBottom: '1px solid var(--border-light)',
              }}
            >
              <div>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>{item.name}</div>
                {item.description && (
                  <div style={{ fontSize: '12px', color: 'var(--text-placeholder)', marginTop: '4px' }}>
                    {item.description}
                  </div>
                )}
              </div>
              <span style={{ fontSize: '14px', fontWeight: 500 }}>{formatAmount(item.amount)}</span>
            </div>
          ))}
        </div>
      )}

      {paymentMilestones.length > 0 && (
        <div>
          <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>付款里程碑</h4>
          {paymentMilestones.map((m, index: number) => (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: '1px solid var(--border-light)',
              }}
            >
              <div>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>{m.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-placeholder)', marginTop: '4px' }}>
                  {m.date}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>{formatAmount(m.amount || 0)}</span>
                <span
                  style={{
                    fontSize: '12px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: m.confirmed ? '#D1FAE5' : '#FEF3C7',
                    color: m.confirmed ? '#065F46' : '#92400E',
                  }}
                >
                  {m.confirmed ? '已确认' : '待确认'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
})

export default ContractDetailModal
