import { Project } from '../../../types'

interface Props { project: Project; allFiles: any[] }

export default function EvaluationCard({ project }: Props) {
  const meta = project.metadata ? JSON.parse(project.metadata) : {}
  const rows = [
    { label: '预估合同金额', value: meta.contract_amount || '-', highlight: true },
    { label: '成本评估', value: meta.cost_estimate || '-' },
    { label: '预估利润率', value: meta.profit_rate || '-', color: 'var(--color-success)' },
    { label: '人天预估', value: meta.person_days || '-' },
  ]
  return (
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
      </div>
    </div>
  )
}
