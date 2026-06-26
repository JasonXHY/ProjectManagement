import { Project, FileRecord } from '../../../types'

interface Props { project: Project; allFiles?: FileRecord[] }

export default function ProjectInfoPlaceholderCard({ project }: Props) {
  const meta = project.metadata ? JSON.parse(project.metadata) : {}
  const fields = [
    { label: '项目编号', value: meta.project_code || '-' },
    { label: '客户名称', value: meta.customer_name || '-' },
    { label: '联系人', value: meta.contact_person || '-' },
    { label: '联系电话', value: meta.contact_phone || '-' },
    { label: '客户地址', value: meta.customer_address || '-' },
    { label: '项目经理', value: meta.project_manager || '-' },
  ]
  return (
    <div className="feature-card">
      <div className="fc-header">
        <div className="fc-title-row">
          <div className="fc-icon" style={{background:'#DBEAFE',color:'#3B82F6'}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
          </div>
          <span className="fc-title">项目信息</span>
        </div>
      </div>
      <div className="fc-body">
        <div className="info-grid">
          {fields.map(f => (
            <div key={f.label} className="info-item">
              <div className="info-label">{f.label}</div>
              <div className="info-value">{f.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
