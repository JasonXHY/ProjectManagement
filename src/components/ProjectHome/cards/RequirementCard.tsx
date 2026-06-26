import { useState } from 'react'
import { Project, FileRecord } from '../../../types'
import RequirementDetailModal from '../RequirementDetailModal'

interface Props { project: Project; allFiles: FileRecord[] }

export default function RequirementCard({ project }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const meta = project.metadata ? JSON.parse(project.metadata) : {}
  const requirements = meta.requirements || []

  return (
    <>
      <div className="feature-card">
        <div className="fc-header">
          <div className="fc-title-row">
            <div className="fc-icon" style={{background:'#DBEAFE',color:'#3B82F6'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
            </div>
            <span className="fc-title">需求跟踪</span>
          </div>
          <button className="fc-action" onClick={() => setModalOpen(true)}>管理 →</button>
        </div>
        <div className="fc-body">
          {requirements.length === 0 ? (
            <div style={{fontSize:12,color:'var(--text-placeholder)',padding:'8px 0'}}>暂无需求记录</div>
          ) : requirements.slice(0, 3).map((r: any, i: number) => (
            <div key={i} className="req-row">
              <div className={`req-status-dot ${r.status || 'pending'}`} />
              <div className="req-main">
                <div className="req-name">{r.name}</div>
                {r.detail && <div className="req-detail">{r.detail}</div>}
              </div>
              <span className={`req-tag ${r.status || 'pending'}`}>{r.statusText || '待定'}</span>
            </div>
          ))}
        </div>
      </div>

      <RequirementDetailModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        requirements={requirements}
      />
    </>
  )
}
