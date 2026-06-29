import { useState } from 'react'
import { Project, FileRecord, Issue } from '../../../types'
import IssueDetailModal from '../IssueDetailModal'
import { parseMetadata } from '../../../utils/metadata'

interface Props { project: Project; allFiles?: FileRecord[] }

export default function IssueCard({ project }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const meta = parseMetadata(project.metadata)
  const issues = (meta.key_issues as Issue[]) || []

  const handleIssuesChange = (updatedIssues: Issue[]) => {
    const updatedMeta = parseMetadata(project.metadata)
    updatedMeta.key_issues = updatedIssues
    window.api.project.update(project.id, { metadata: JSON.stringify(updatedMeta) })
  }

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
          ) : issues.slice(0, 3).map((issue, i) => (
            <div key={i} className="issue-row">
              <div className={`issue-dot ${issue.priority || 'medium'}`} />
              <span className="issue-text">{issue.text || ''}</span>
              <span className={`issue-tag ${issue.status === 'resolved' ? 'resolved' : 'open'}`}>
                {issue.status === 'resolved' ? '已解决' : '未解决'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <IssueDetailModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        issues={issues}
        onIssuesChange={handleIssuesChange}
      />
    </>
  )
}