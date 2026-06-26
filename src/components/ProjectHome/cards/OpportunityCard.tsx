import { Project, FileRecord } from '../../../types'

interface Props { project: Project; allFiles: FileRecord[] }

export default function OpportunityCard({ project }: Props) {
  const meta = project.metadata ? JSON.parse(project.metadata) : {}
  const opportunities = meta.opportunities || []

  return (
    <div className="feature-card">
      <div className="fc-header">
        <div className="fc-title-row">
          <div className="fc-icon" style={{background:'#FEF3C7',color:'#F59E0B'}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/></svg>
          </div>
          <span className="fc-title">拓展商机</span>
        </div>
      </div>
      <div className="fc-body">
        {opportunities.length === 0 ? (
          <div style={{fontSize:12,color:'var(--text-placeholder)',padding:'8px 0'}}>暂无拓展商机</div>
        ) : opportunities.slice(0, 3).map((opp: any, i: number) => (
          <div key={i} className="opp-row">
            <div className="opp-icon" style={{background:'#FEF3C7',color:'#F59E0B',borderRadius:'50%',width:'24px',height:'24px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/></svg>
            </div>
            <div className="opp-main">
              <div className="opp-name">{opp.name}</div>
              {opp.description && <div className="opp-desc">{opp.description}</div>}
            </div>
            <span className={`opp-tag ${opp.status || 'planned'}`}>{opp.statusText || '规划中'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
