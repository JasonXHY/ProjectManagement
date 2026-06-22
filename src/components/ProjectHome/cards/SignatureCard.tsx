import { FileRecord } from '../../../types'

interface Props { project: any; allFiles: FileRecord[] }

export default function SignatureCard({ allFiles }: Props) {
  const sigFiles = allFiles.filter(f => f.signature_status && f.signature_status !== 'unsigned')
  const signed = sigFiles.filter(f => f.signature_status === 'signed').length
  const total = sigFiles.length || 1
  const percent = Math.round((signed / total) * 100)

  return (
    <div className="feature-card">
      <div className="fc-header">
        <div className="fc-title-row">
          <div className="fc-icon" style={{background:'#D1FAE5',color:'#10B981'}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <span className="fc-title">签字追踪</span>
        </div>
        <button className="fc-action">查看全部 →</button>
      </div>
      <div className="fc-body">
        <div className="sig-stats-row">
          <div className="sig-stat"><strong className="green">{signed}</strong> 已签</div>
          <div className="sig-stat"><strong className="red">{total - signed}</strong> 待签</div>
          <div className="sig-stat"><strong>{percent}%</strong></div>
          <div className="sig-bar-wrap"><div className="sig-bar" style={{width:`${percent}%`}} /></div>
        </div>
        {sigFiles.slice(0, 3).map(f => (
          <div key={f.id} className="sig-file">
            <span className="sig-file-name">{f.filename}</span>
            <span className={`sig-tag ${f.signature_status}`}>{f.signature_status === 'signed' ? '已签' : '待签'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
