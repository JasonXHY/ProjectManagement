import { useState } from 'react'
import ListDetailModal from '../ListDetailModal'

interface Props { project: any; allFiles: any[] }

const priorityConfig: Record<string, { color: string; label: string }> = {
  high: { color: '#EF4444', label: '高' },
  medium: { color: '#F59E0B', label: '中' },
  low: { color: '#3B82F6', label: '低' },
}

export default function IssueCard({ project }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const meta = project.metadata ? JSON.parse(project.metadata) : {}
  const issues = meta.key_issues || []

  return (
    <>
      <div className="feature-card">
        <div className="fc-header">
          <div className="fc-title-row">
            <div className="fc-icon" style={{background:'#FEE2E2',color:'#EF4444'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <span className="fc-title">关键问题</span>
            <span className="fc-subtitle">· {issues.length} 个</span>
          </div>
          <button className="fc-action" onClick={() => setModalOpen(true)}>管理 →</button>
        </div>
        <div className="fc-body">
          {issues.length === 0 ? (
            <div style={{fontSize:12,color:'var(--text-placeholder)',padding:'8px 0'}}>暂无关键问题</div>
          ) : issues.slice(0, 3).map((issue: any, i: number) => (
            <div key={i} className="issue-row">
              <div className={`issue-dot ${issue.priority || 'medium'}`} />
              <span className="issue-text">{issue.text || issue}</span>
              <span className={`issue-tag ${issue.status === 'resolved' ? 'resolved' : 'open'}`}>
                {issue.status === 'resolved' ? '已解决' : '未解决'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <ListDetailModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="问题管理"
        items={issues}
        emptyText="暂无关键问题"
        renderItem={(issue: any) => {
          const priorityInfo = priorityConfig[issue.priority || 'medium']
          return (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
                  {issue.text || issue}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-placeholder)' }}>
                  优先级: {priorityInfo.label}
                </div>
              </div>
              <span
                style={{
                  fontSize: '12px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: issue.status === 'resolved' ? '#D1FAE5' : '#FEE2E2',
                  color: issue.status === 'resolved' ? '#065F46' : '#991B1B',
                }}
              >
                {issue.status === 'resolved' ? '已解决' : '未解决'}
              </span>
            </div>
          )
        }}
      />
    </>
  )
}
