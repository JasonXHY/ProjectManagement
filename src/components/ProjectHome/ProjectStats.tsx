import { Button } from 'antd'
import {
  FileTextOutlined,
  RobotOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons'
import { FileRecord } from '../../types'

interface ProjectStatsProps {
  files: FileRecord[]
  criticalIssues: number | null
  analyzing: boolean
  onViewSummary: () => void
  onGenerateSummary: () => void
}

export default function ProjectStats({ files, criticalIssues, analyzing, onViewSummary, onGenerateSummary }: ProjectStatsProps) {
  const stats = [
    {
      icon: <FileTextOutlined />,
      iconBg: '#DBEAFE',
      iconColor: '#3B82F6',
      label: '文件数量',
      value: files.length,
      suffix: '个项目文件',
    },
    {
      icon: <RobotOutlined />,
      iconBg: '#FEE2E2',
      iconColor: '#EF4444',
      label: '关键问题',
      value: criticalIssues !== null ? criticalIssues : '—',
      suffix: criticalIssues !== null ? '个关键问题' : '待 AI 分析后更新',
    },
    {
      icon: <FolderOpenOutlined />,
      iconBg: '#FEF3C7',
      iconColor: '#F59E0B',
      label: '待处理',
      value: files.filter(f => !f.is_analyzed).length,
      suffix: '个文件待分析',
    },
    {
      icon: <RobotOutlined />,
      iconBg: '#EDE9FE',
      iconColor: '#7C3AED',
      label: 'AI 摘要',
      value: null,
      suffix: null,
      isSummary: true,
    },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
      {stats.map((stat, index) => (
        <div
          key={index}
          style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            transition: 'all 200ms',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                background: stat.iconBg,
                color: stat.iconColor,
              }}
            >
              {stat.icon}
            </div>
            <span style={{ fontSize: '12px', color: '#6B7280' }}>{stat.label}</span>
          </div>
          {stat.isSummary ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
              <Button type="default" size="small" style={{ flex: 1, height: '32px', fontSize: '12px' }} onClick={onViewSummary}>
                查看摘要
              </Button>
              <Button type="primary" size="small" style={{ flex: 1, height: '32px', fontSize: '12px' }} loading={analyzing} onClick={onGenerateSummary}>
                生成/更新
              </Button>
            </div>
          ) : (
            <>
              <span style={{ fontSize: '24px', fontWeight: 700, color: '#111827', fontFeatureSettings: '"tnum"' }}>
                {stat.value}
              </span>
              <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{stat.suffix}</span>
            </>
          )}
        </div>
      ))}
    </div>
  )
}