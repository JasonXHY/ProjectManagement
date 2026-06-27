import { useState } from 'react'
import { Button, Upload, Tooltip } from 'antd'
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
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'
import { FileRecord } from '../../types'
import { getStageStyle } from './projectHome.styles'
import { STAGE_DEFINITIONS } from '../../../electron/shared/stages'

const { Dragger } = Upload

const STAGE_ICONS: Record<string, React.ReactNode> = {
  '售前': <FundOutlined />,
  '启动': <RocketOutlined />,
  '需求': <FileSearchOutlined />,
  '方案': <SolutionOutlined />,
  '构建': <ToolOutlined />,
  '测试': <ExperimentOutlined />,
  '上线': <CloudUploadOutlined />,
  '验收': <CheckCircleOutlined />,
  '转客户成功': <TeamOutlined />,
  '关闭': <FolderOutlined />,
}

interface StageSidebarProps {
  files: FileRecord[]
  selectedCategory: string | null
  onSelectCategory: (category: string) => void
  onUpload: (file: File) => void
  onOpenFolder?: () => void
  customStages?: string[]
}

/**
 * 侧边栏组件
 * 
 * 设计决策：
 * - 支持折叠模式（56px图标模式）和展开模式（200px完整模式）
 * - 折叠时只显示图标，悬停显示Tooltip提示阶段名称
 * - 默认展开，点击按钮切换
 */
export default function StageSidebar({ files, selectedCategory, onSelectCategory, onUpload, onOpenFolder, customStages }: StageSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const uncategorizedCount = files.filter(f => !f.category || f.category === '未分类').length

  const stagesToShow = customStages && customStages.length > 0
    ? customStages.map(name => ({ name, subcategories: [] }))
    : STAGE_DEFINITIONS

  const stageItems = [
    { key: '所有文件', icon: <AppstoreOutlined />, label: '所有文件', count: files.length },
    ...stagesToShow.map(s => ({
      key: s.name,
      icon: STAGE_ICONS[s.name] || <FolderOutlined />,
      label: s.name,
      count: files.filter(f => f.category === s.name).length,
    })),
    { key: '未分类', icon: <QuestionCircleOutlined />, label: '未分类', count: uncategorizedCount },
  ]

  const sidebarContent = (
    <div
      style={{
        width: collapsed ? '56px' : '200px',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-default)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflow: 'hidden',
        transition: 'width var(--transition-normal)',
      }}
    >
      <div
        style={{
          padding: collapsed ? 'var(--space-4) var(--space-2) var(--space-3)' : 'var(--space-4) var(--space-4) var(--space-3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
        }}
      >
        {!collapsed && (
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-placeholder)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            文件分类
          </span>
        )}
        <Button
          type="text"
          size="small"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => setCollapsed(!collapsed)}
          style={{ width: '24px', height: '24px', color: 'var(--text-placeholder)' }}
        />
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: collapsed ? '0 var(--space-1) var(--space-2)' : '0 var(--space-2) var(--space-2)' }}>
        {stageItems.map((item) => {
          const stageStyle = item.key !== '所有文件' ? getStageStyle(item.key) : null
          const isSelected = selectedCategory === item.key

          const button = (
            <button
              key={item.key}
              className={`stage-menu-item${isSelected ? ' selected' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: collapsed ? 0 : 'var(--space-2)',
                height: '40px',
                padding: collapsed ? '0' : '0 var(--space-3)',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                color: isSelected ? (stageStyle?.color || 'var(--color-primary)') : 'var(--text-secondary)',
                background: isSelected ? (stageStyle?.bg || 'var(--color-primary-light)') : 'transparent',
                border: 'none',
                width: '100%',
                textAlign: 'left',
                fontFamily: 'inherit',
                fontSize: '12px',
                fontWeight: isSelected ? 500 : 400,
                transition: 'all var(--transition-fast)',
                position: 'relative',
                marginBottom: '2px',
              }}
              onClick={() => onSelectCategory(item.key)}
            >
              {isSelected && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '8px',
                    bottom: '8px',
                    width: '3px',
                    background: stageStyle?.color || 'var(--color-primary)',
                    borderRadius: '0 2px 2px 0',
                  }}
                />
              )}
              <span style={{ width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '14px' }}>
                {item.icon}
              </span>
              {!collapsed && (
                <>
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
                      background: isSelected ? `${stageStyle?.color || 'var(--color-primary)'}18` : 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '11px',
                      color: isSelected ? (stageStyle?.color || 'var(--color-primary)') : 'var(--text-secondary)',
                      fontWeight: 500,
                    }}
                  >
                    {item.count}
                  </span>
                </>
              )}
            </button>
          )

          return collapsed ? (
            <Tooltip key={item.key} title={item.label} placement="right">
              {button}
            </Tooltip>
          ) : button
        })}
      </nav>

      {!collapsed && (
        <div style={{ padding: 'var(--space-2)', borderTop: '1px solid var(--border-light)' }}>
          <Dragger
            name="file"
            multiple={true}
            showUploadList={false}
            customRequest={({ file }) => onUpload(file as File)}
            style={{ marginBottom: 'var(--space-1)' }}
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
      )}
    </div>
  )

  return sidebarContent
}
