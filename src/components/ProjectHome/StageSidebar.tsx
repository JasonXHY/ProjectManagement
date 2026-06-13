import { Button, Upload } from 'antd'
import {
  UploadOutlined,
  AppstoreOutlined,
  FundOutlined,
  RocketOutlined,
  FileSearchOutlined,
  SolutionOutlined,
  ToolOutlined,
  ExperimentOutlined,
  CloudUploadOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  FolderOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons'
import { FileRecord } from '../../types'
import { getStageStyle } from './projectHome.styles'

const { Dragger } = Upload

/** 11个分类阶段定义 */
const CLASSIFICATION_STAGES = [
  { key: '售前', icon: <FundOutlined />, label: '售前' },
  { key: '启动', icon: <RocketOutlined />, label: '启动' },
  { key: '需求', icon: <FileSearchOutlined />, label: '需求' },
  { key: '方案', icon: <SolutionOutlined />, label: '方案' },
  { key: '构建', icon: <ToolOutlined />, label: '构建' },
  { key: '测试', icon: <ExperimentOutlined />, label: '测试' },
  { key: '上线', icon: <CloudUploadOutlined />, label: '上线' },
  { key: '验收', icon: <CheckCircleOutlined />, label: '验收' },
  { key: '转客户成功', icon: <TeamOutlined />, label: '转客户成功' },
  { key: '关闭', icon: <FolderOutlined />, label: '关闭' },
]

interface StageSidebarProps {
  files: FileRecord[]
  selectedCategory: string | null
  onSelectCategory: (category: string) => void
  onUpload: (file: File) => void
  onOpenFolder?: () => void
}

export default function StageSidebar({ files, selectedCategory, onSelectCategory, onUpload, onOpenFolder }: StageSidebarProps) {
  const uncategorizedCount = files.filter(f => !f.category).length

  const stageItems = [
    { key: '所有文件', icon: <AppstoreOutlined />, label: '所有文件', count: files.length },
    ...CLASSIFICATION_STAGES.map(s => ({
      ...s,
      count: files.filter(f => f.category === s.key).length,
    })),
    { key: '未分类', icon: <QuestionCircleOutlined />, label: '未分类', count: uncategorizedCount },
  ]

  return (
    <div
      style={{
        width: '200px',
        background: '#FFFFFF',
        borderRight: '1px solid #E5E7EB',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '16px 16px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          文件分类
        </span>
        <Button
          type="text"
          size="small"
          icon={<UploadOutlined />}
          style={{ width: '24px', height: '24px', color: '#9CA3AF' }}
        />
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', padding: '0 8px 8px' }}>
        {stageItems.map((item) => {
          const stageStyle = item.key !== '所有文件' ? getStageStyle(item.key) : null
          const isSelected = selectedCategory === item.key

          return (
            <button
              key={item.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                height: '40px',
                padding: '0 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                color: isSelected ? (stageStyle?.color || '#4F46E5') : '#6B7280',
                background: isSelected ? (stageStyle?.bg || '#EEF2FF') : 'transparent',
                border: 'none',
                width: '100%',
                textAlign: 'left',
                fontFamily: 'inherit',
                fontSize: '13px',
                fontWeight: isSelected ? 500 : 400,
                transition: 'all 150ms',
                position: 'relative',
                marginBottom: '2px',
              }}
              onClick={() => onSelectCategory(item.key)}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = '#F9FAFB'
                  e.currentTarget.style.color = '#111827'
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#6B7280'
                }
              }}
            >
              {isSelected && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '8px',
                    bottom: '8px',
                    width: '3px',
                    background: stageStyle?.color || '#4F46E5',
                    borderRadius: '0 2px 2px 0',
                  }}
                />
              )}
              <span style={{ width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '14px' }}>
                {item.icon}
              </span>
              <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.label}
              </span>
              <span
                style={{
                  minWidth: '20px',
                  height: '18px',
                  padding: '0 6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isSelected ? `${stageStyle?.color || '#4F46E5'}18` : '#F3F4F6',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  color: isSelected ? (stageStyle?.color || '#4F46E5') : '#6B7280',
                  fontWeight: 500,
                }}
              >
                {item.count}
              </span>
            </button>
          )
        })}
      </nav>

      <div style={{ padding: '8px', borderTop: '1px solid #F3F4F6' }}>
        <Dragger
          name="file"
          multiple={true}
          showUploadList={false}
          customRequest={({ file }) => onUpload(file as File)}
          style={{ marginBottom: '4px' }}
        >
          <Button
            type="default"
            size="small"
            icon={<UploadOutlined />}
            style={{ width: '100%', marginBottom: '4px' }}
          >
            上传文件
          </Button>
        </Dragger>
        <Button
          type="text"
          size="small"
          icon={<FolderOutlined />}
          style={{ width: '100%' }}
          onClick={onOpenFolder}
        >
          打开文件夹
        </Button>
      </div>
    </div>
  )
}
