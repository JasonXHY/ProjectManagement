import { FileRecord } from '../../../types'

interface Props { project: any; allFiles: FileRecord[] }

export default function DeliverableCard({ allFiles }: Props) {
  const deliverables = allFiles.filter(f =>
    f.category?.includes('交付') || f.category?.includes('验收')
  ).slice(0, 5)

  return (
    <div className="feature-card">
      <div className="fc-header">
        <div className="fc-title-row">
          <div className="fc-icon" style={{background:'#DBEAFE',color:'#3B82F6'}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <span className="fc-title">交付物清单</span>
        </div>
        <button className="fc-action">查看全部 →</button>
      </div>
      <div className="fc-body">
        {deliverables.length === 0 ? (
          <div style={{fontSize:12,color:'var(--text-placeholder)',padding:'8px 0'}}>暂无交付物</div>
        ) : deliverables.map(f => (
          <div key={f.id} className="deliverable-row">
            <span className="del-check">{f.signature_status === 'signed' ? '✓' : '○'}</span>
            <span className="del-name">{f.filename}</span>
            <span className={`sig-tag ${f.signature_status === 'signed' ? 'signed' : 'unsigned'}`}>
              {f.signature_status === 'signed' ? '已签' : '待签'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
