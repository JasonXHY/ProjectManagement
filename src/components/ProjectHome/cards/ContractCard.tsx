import { useState } from 'react'
import { Project, FileRecord, Milestone } from '../../../types'
import ContractDetailModal from '../ContractDetailModal'
import { formatAmount } from '../../../utils/format'

interface Props { project: Project; allFiles?: FileRecord[] }

export default function ContractCard({ project }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
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

  const hasData = contractAmount > 0 || contractItems.length > 0
  const confirmedPercent = contractAmount > 0 ? Math.round((confirmedIncome / contractAmount) * 100) : 0
  const pendingAmount = contractAmount - confirmedIncome

  return (
    <>
      <div className="feature-card">
        <div className="fc-header">
          <div className="fc-title-row">
            <div className="fc-icon" style={{background:'#D1FAE5',color:'#10B981'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <span className="fc-title">合同概览</span>
          </div>
          <button className="fc-action" onClick={() => setModalOpen(true)}>查看明细 →</button>
        </div>
        <div className="fc-body">
          {!hasData ? (
            <div style={{fontSize:12,color:'var(--text-placeholder)',padding:'8px 0'}}>暂无合同数据</div>
          ) : (
            <>
              <div style={{display:'flex',alignItems:'baseline',gap:'8px',marginBottom:'10px'}}>
                <span style={{fontSize:'12px',color:'var(--text-secondary)'}}>合同总额</span>
                <span style={{fontSize:'20px',fontWeight:700,color:'var(--color-primary)'}}>
                  {formatAmount(contractAmount)}
                </span>
                {confirmedIncome > 0 && (
                  <span style={{fontSize:'11px',color:'var(--color-success)',marginLeft:'auto'}}>
                    已确认 {formatAmount(confirmedIncome)}
                  </span>
                )}
              </div>

              <div style={{height:'6px',background:'var(--bg-secondary)',borderRadius:'3px',marginBottom:'6px'}}>
                <div style={{height:'100%',width:`${confirmedPercent}%`,background:'var(--color-success)',borderRadius:'3px'}} />
              </div>
              <div style={{fontSize:'11px',color:'var(--text-placeholder)',marginBottom:'8px'}}>
                已确认 {confirmedPercent}% · 待确认 {formatAmount(pendingAmount)}
              </div>

              {contractItems.length > 0 && (
                <div>
                  {contractItems.slice(0, 4).map((item: any, index: number) => (
                    <div key={index} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',fontSize:'13px',borderBottom:index < contractItems.length - 1 ? '1px solid var(--border-light)' : 'none'}}>
                      <span style={{color:'var(--text-secondary)',fontSize:'12px'}}>{item.name}</span>
                      <span style={{fontWeight:600}}>{formatAmount(item.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ContractDetailModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        project={project}
      />
    </>
  )
}
