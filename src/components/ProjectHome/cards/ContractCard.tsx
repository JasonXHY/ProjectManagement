import { FileRecord } from '../../../types'

interface Props { project: any; allFiles: FileRecord[] }

export default function ContractCard({ allFiles }: Props) {
  const contractFiles = allFiles.filter(f =>
    f.category?.includes('合同') || f.category?.includes('售前')
  ).slice(0, 5)

  return (
    <div className="feature-card">
      <div className="fc-header">
        <div className="fc-title-row">
          <div className="fc-icon" style={{background:'#D1FAE5',color:'#10B981'}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <span className="fc-title">合同概览</span>
        </div>
        <button className="fc-action">查看全部 →</button>
      </div>
      <div className="fc-body">
        {contractFiles.length === 0 ? (
          <div style={{fontSize:12,color:'var(--text-placeholder)',padding:'8px 0'}}>暂无合同文件</div>
        ) : contractFiles.map(f => (
          <div key={f.id} className="sig-file">
            <span className="sig-file-name">{f.filename}</span>
            <span className={`sig-tag ${f.signature_status === 'signed' ? 'signed' : 'unsigned'}`}>
              {f.signature_status === 'signed' ? '已签字' : '待签字'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
