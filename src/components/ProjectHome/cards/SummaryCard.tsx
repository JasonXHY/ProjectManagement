import { useState } from 'react'
import { Project, FileRecord } from '../../../types'
import { parseMetadata } from '../../../utils/metadata'

interface Props { project: Project; allFiles?: FileRecord[] }

export default function SummaryCard({ project }: Props) {
  const [expanded, setExpanded] = useState(false)
  const summary = (parseMetadata(project.metadata) as Record<string, unknown>).project_overview as string || ''

  return (
    <div className="feature-card">
      <div className="fc-header">
        <div className="fc-title-row">
          <div className="fc-icon" style={{background:'#F3E8FF',color:'#8B5CF6'}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </div>
          <span className="fc-title">项目总结</span>
        </div>
      </div>
      <div className="fc-body">
        {summary ? (
          <div style={{fontSize:13,color:'var(--text-secondary)',lineHeight:1.6,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:expanded?'unset':4,WebkitBoxOrient:'vertical'}}>
            {summary}
          </div>
        ) : (
          <div style={{fontSize:12,color:'var(--text-placeholder)',padding:'8px 0'}}>暂无项目总结</div>
        )}
        {summary && summary.length > 100 && (
          <button className="fc-more" onClick={() => setExpanded(!expanded)}>
            {expanded ? '收起' : '展开全部'}
          </button>
        )}
      </div>
    </div>
  )
}
