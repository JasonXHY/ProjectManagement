import { useState } from 'react'
import { Project } from '../../../types'
import ProfitCalculatorModal from '../ProfitCalculatorModal'

interface Props { project: Project; allFiles: any[] }

function formatAmount(amount: number): string {
  if (amount >= 10000) {
    return `¥${(amount / 10000).toFixed(2)}万`
  }
  return `¥${amount.toLocaleString()}`
}

function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`
}

export default function EvaluationCard({ project }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const meta = project.metadata ? JSON.parse(project.metadata) : {}
  const contractAmount = meta.contract_amount || 0
  const costEstimate = meta.cost_estimate || 0
  const profitRate = meta.profit_rate || 0
  const personDays = meta.person_days || 0

  const hasData = contractAmount > 0 || costEstimate > 0

  const rows = [
    { label: '预估合同金额', value: hasData ? formatAmount(contractAmount) : '—', highlight: true },
    { label: '成本评估', value: hasData ? formatAmount(costEstimate) : '—' },
    { label: '预估利润率', value: hasData ? formatPercent(profitRate) : '—', color: 'var(--color-success)' },
    { label: '人天预估', value: hasData ? `${personDays}天` : '—' },
  ]

  return (
    <>
      <div className="feature-card">
        <div className="fc-header">
          <div className="fc-title-row">
            <div className="fc-icon" style={{background:'#EDE9FE',color:'#7C3AED'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            </div>
            <span className="fc-title">项目评估</span>
          </div>
        </div>
        <div className="fc-body">
          {rows.map(r => (
            <div key={r.label} className="eval-row">
              <span className="eval-label">{r.label}</span>
              <span className="eval-value" style={r.highlight ? {color:'var(--color-primary)'} : r.color ? {color:r.color} : {}}>{r.value}</span>
            </div>
          ))}
          <div className="eval-action" style={{marginTop:'8px',fontSize:'12px'}}>
            <span
              style={{color:'var(--color-primary)',cursor:'pointer',textDecoration:'underline'}}
              onClick={() => setModalOpen(true)}
            >
              利润测算
            </span>
          </div>
        </div>
      </div>

      <ProfitCalculatorModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  )
}
