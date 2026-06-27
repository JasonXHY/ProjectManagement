import { useState, useMemo } from 'react'
import { Project, FileRecord, Deliverable } from '../../../types'
import DeliverableDetailModal from '../DeliverableDetailModal'
import { parseMetadata } from '../../../utils/metadata'

interface Props { project: Project; allFiles: FileRecord[] }

const statusConfig: Record<string, { color: string; label: string }> = {
  draft: { color: 'var(--bg-secondary)', label: '草稿' },
  merged: { color: '#FEF3C7', label: '整合中' },
  ready: { color: '#DBEAFE', label: '待交付' },
  delivered: { color: '#D1FAE5', label: '已交付' },
}

// 交付物识别规则：基于文件分类阶段和子分类
const DELIVERABLE_RULES = {
  stages: ['方案', '构建', '测试', '上线', '验收', '转客户成功', '关闭'],
  subcategories: [
    '蓝图', '开发规格说明书',
    '开发文档', '接口文档', '配置文档',
    '测试用例', '测试报告',
    '部署文档', '操作手册',
    '验收报告', '项目总结',
    '交接文档', '培训资料', 'FAQ',
  ],
  filenameKeywords: [
    '蓝图', '需求规格', '技术设计', '接口文档',
    '测试计划', '测试报告', '测试用例', 'UAT',
    '操作手册', '用户手册', '部署文档',
    '验收报告', '项目总结', '交接文档', '培训资料',
    '方案', '确认单', '项目章程',
  ],
}

function isDeliverable(file: FileRecord): boolean {
  if (!DELIVERABLE_RULES.stages.includes(file.category || '')) {
    return false
  }

  if (file.subcategory && DELIVERABLE_RULES.subcategories.includes(file.subcategory)) {
    return true
  }

  const filename = file.filename.toLowerCase()
  return DELIVERABLE_RULES.filenameKeywords.some(keyword => filename.includes(keyword))
}

function getDeliverableStatus(file: FileRecord): 'draft' | 'merged' | 'ready' | 'delivered' {
  if (file.signature_status === 'signed') return 'delivered'
  if (file.category === '验收' || file.category === '关闭') return 'ready'
  if (file.category === '上线') return 'merged'
  return 'draft'
}

export default function DeliverableCard({ project, allFiles }: Props) {
  const [modalOpen, setModalOpen] = useState(false)

  // 从metadata中获取手动添加的交付物
  const manualDeliverables = useMemo(() => {
    const meta = parseMetadata(project.metadata)
    return (meta.deliverables as Deliverable[]) || []
  }, [project.metadata])

  // 从文件中自动识别交付物
  const autoDeliverables = useMemo(() => {
    const deliverableFiles = allFiles.filter(isDeliverable)
    return deliverableFiles.map((file, index) => ({
      id: `auto-${file.id}`,
      name: file.filename,
      type: file.subcategory || file.stage || '未分类',
      status: getDeliverableStatus(file),
      currentVersion: 'v1.0',
      versions: [{
        id: `v-${file.id}`,
        versionNo: 'v1.0',
        status: 'final' as const,
        fileId: String(file.id),
        createdAt: file.created_at,
      }],
      createdAt: file.created_at,
      updatedAt: file.created_at,
    }))
  }, [allFiles])

  // 合并手动和自动识别的交付物
  const allDeliverables = useMemo(() => {
    return [...manualDeliverables, ...autoDeliverables]
  }, [manualDeliverables, autoDeliverables])

  return (
    <>
      <div className="feature-card">
        <div className="fc-header">
          <div className="fc-title-row">
            <div className="fc-icon" style={{background:'#DBEAFE',color:'#3B82F6'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
            </div>
            <span className="fc-title">交付物清单</span>
            <span className="fc-subtitle">· {allDeliverables.length} 项</span>
          </div>
          <button className="fc-action" onClick={() => setModalOpen(true)}>查看全部 →</button>
        </div>
        <div className="fc-body">
          {allDeliverables.length === 0 ? (
            <div style={{fontSize:12,color:'var(--text-placeholder)',padding:'8px 0'}}>暂无交付物</div>
          ) : allDeliverables.slice(0, 3).map((item: Deliverable) => {
            const statusInfo = statusConfig[item.status] || statusConfig.draft
            return (
              <div key={item.id} style={{display:'flex',alignItems:'center',gap:'8px',padding:'5px 0',fontSize:'12px'}}>
                <span style={{color:item.status === 'delivered' ? 'var(--color-success)' : 'var(--text-disabled)',fontSize:'14px'}}>
                  {item.status === 'delivered' ? '✓' : '☐'}
                </span>
                <span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.name}</span>
                <span style={{fontSize:'10px',color:'var(--text-placeholder)'}}>{item.currentVersion}</span>
                <span
                  style={{
                    fontSize:'11px',
                    padding:'1px 6px',
                    borderRadius:'var(--radius-sm)',
                    backgroundColor: statusInfo.color,
                    color: statusInfo.label === '已交付' ? '#065F46' : statusInfo.label === '待交付' ? '#1E40AF' : 'var(--text-placeholder)',
                  }}
                >
                  {statusInfo.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <DeliverableDetailModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        deliverables={allDeliverables}
      />
    </>
  )
}
