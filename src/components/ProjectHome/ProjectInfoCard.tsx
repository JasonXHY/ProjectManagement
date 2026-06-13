import { memo } from 'react'
import { Descriptions } from 'antd'
import { FileTextOutlined } from '@ant-design/icons'

interface ProjectInfoCardProps {
  metadata: string | null
}

interface KeyInfo {
  project_code?: string
  contract_no?: string
  contact_person?: string
  contact_phone?: string
  customer_address?: string
  project_name?: string
}

const FIELD_LABELS: Record<keyof KeyInfo, string> = {
  project_code: '项目编号',
  contract_no: '合同号',
  contact_person: '客户联系人',
  contact_phone: '联系电话',
  customer_address: '客户地址',
  project_name: '项目名称',
}

const ProjectInfoCard = memo(function ProjectInfoCard({ metadata }: ProjectInfoCardProps) {
  if (!metadata) return null

  let info: KeyInfo
  try {
    info = JSON.parse(metadata)
  } catch {
    return null
  }

  const items = Object.entries(FIELD_LABELS)
    .map(([key, label]) => ({
      label,
      children: info[key as keyof KeyInfo] || '-',
      span: 1,
    }))
    .filter(item => item.children !== '-')

  if (items.length === 0) return null

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '20px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px',
        }}
      >
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            background: '#DBEAFE',
            color: '#3B82F6',
          }}
        >
          <FileTextOutlined />
        </div>
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
          关键信息
        </span>
      </div>
      <Descriptions
        column={3}
        size="small"
        bordered
        items={items}
      />
    </div>
  )
})

export default ProjectInfoCard
