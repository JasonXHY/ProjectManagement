import { useMemo, useState } from 'react'
import type { Project, FileRecord, MilestoneExtended } from '../../types'
import MilestoneModal from './MilestoneModal'

interface SummaryRowProps {
  project: Project
  files: FileRecord[]
  analyzing?: boolean
  onViewSummary?: () => void
  onGenerateSummary?: () => void
}

function getNextMilestone(milestones: MilestoneExtended[]): MilestoneExtended | null {
  const now = new Date()
  const upcoming = milestones.filter(m => new Date(m.date) > now)
  upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  return upcoming.length > 0 ? upcoming[0] : null
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${m}-${day}`
}

export default function SummaryRow({ project, files, analyzing = false, onViewSummary, onGenerateSummary }: SummaryRowProps) {
  const [milestoneOpen, setMilestoneOpen] = useState(false)
  const fileCount = files.length
  const pendingCount = files.filter(f => !f.is_analyzed).length

  const milestones = useMemo(() => {
    if (!project.milestones) return []
    try {
      return JSON.parse(project.milestones) as MilestoneExtended[]
    } catch {
      return []
    }
  }, [project.milestones])

  const nextMilestone = useMemo(() => getNextMilestone(milestones), [milestones])

  return (
    <>
      <div className="summary-row">
        {/* File Count */}
        <div className="summary-card">
          <div className="summary-card-header">
            <div className="summary-card-icon" style={{ background: '#EBF5FF', color: '#3B82F6' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <span className="summary-card-label">文件数量</span>
          </div>
          <div className="summary-card-value">{fileCount}</div>
          <div className="summary-card-footer">个项目文件</div>
        </div>

        {/* Milestone */}
        <div
          className="summary-card"
          style={{ cursor: 'pointer' }}
          onClick={() => setMilestoneOpen(true)}
        >
          <div className="summary-card-header">
            <div className="summary-card-icon" style={{ background: '#FEF3C7', color: '#F59E0B' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <span className="summary-card-label">里程碑</span>
          </div>
          <div className="summary-card-value" style={{ fontSize: '16px', lineHeight: 1.3 }}>
            {nextMilestone ? nextMilestone.title : '—'}
          </div>
          <div className="summary-card-footer">
            {nextMilestone ? `下一步 · ${formatDate(nextMilestone.date)}` : '暂无里程碑'}
          </div>
        </div>

        {/* Pending */}
        <div className="summary-card">
          <div className="summary-card-header">
            <div className="summary-card-icon" style={{ background: '#FEE2E2', color: '#EF4444' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <span className="summary-card-label">待处理</span>
          </div>
          <div className="summary-card-value">{pendingCount}</div>
          <div className="summary-card-footer">个文件待分析</div>
        </div>

        {/* AI Summary */}
        <div className="summary-card">
          <div className="summary-card-header">
            <div className="summary-card-icon" style={{ background: '#F3E8FF', color: '#8B5CF6' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="summary-card-label">AI 摘要</span>
          </div>
          <div className="summary-card-action">
            {analyzing ? (
              <span style={{ fontSize: '12px', color: 'var(--text-placeholder)' }}>分析中...</span>
            ) : (
              <>
                {onViewSummary && <button className="btn btn-secondary btn-sm" type="button" onClick={onViewSummary}>查看摘要</button>}
                {onGenerateSummary && <button className="btn btn-primary btn-sm" type="button" onClick={onGenerateSummary}>生成/更新</button>}
              </>
            )}
          </div>
        </div>
      </div>

      <MilestoneModal
        open={milestoneOpen}
        onClose={() => setMilestoneOpen(false)}
        milestones={milestones}
      />
    </>
  )
}
