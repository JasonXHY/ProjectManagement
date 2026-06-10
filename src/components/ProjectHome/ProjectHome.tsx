import { useState, useEffect, useCallback } from 'react'
import { Button, message, Table, Space, Popconfirm, Tag, Upload } from 'antd'
import {
  UploadOutlined,
  DeleteOutlined,
  RobotOutlined,
  EyeOutlined,
  EditOutlined,
  FolderOutlined,
  FolderOpenOutlined,
  FileTextOutlined,
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
  QuestionCircleOutlined,
  InboxOutlined,
} from '@ant-design/icons'
import { Project, FileRecord } from '../../types'
import { fileService } from '../../services/fileService'
import { aiService } from '../../services/aiService'

const { Dragger } = Upload

/** 项目阶段样式映射 */
const STAGE_STYLE: Record<string, { color: string; bg: string }> = {
  '所有文件': { color: '#4F46E5', bg: '#EEF2FF' },
  '售前': { color: '#92400E', bg: '#FEF3C7' },
  '启动': { color: '#065F46', bg: '#D1FAE5' },
  '需求': { color: '#1E40AF', bg: '#DBEAFE' },
  '方案': { color: '#92400E', bg: '#FEF3C7' },
  '构建': { color: '#5B21B6', bg: '#EDE9FE' },
  '测试': { color: '#9D174D', bg: '#FCE7F3' },
  '上线': { color: '#065F46', bg: '#D1FAE5' },
  '验收': { color: '#9D174D', bg: '#FCE7F3' },
  '转客户成功': { color: '#374151', bg: '#F3F4F6' },
  '关闭': { color: '#374151', bg: '#F3F4F6' },
  '未分类': { color: '#6B7280', bg: '#F9FAFB' },
}

/** 阶段图标映射 */
const STAGE_ICON: Record<string, React.ReactNode> = {
  '所有文件': <AppstoreOutlined />,
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
  '未分类': <QuestionCircleOutlined />,
}

/** 获取阶段样式 */
const getStageStyle = (stage: string) => {
  return STAGE_STYLE[stage] || { color: '#6B7280', bg: '#F9FAFB' }
}

/** 获取阶段图标 */
const getStageIcon = (stage: string) => {
  return STAGE_ICON[stage] || <FolderOutlined />
}

/** 文件类型样式映射 */
const FILE_TYPE_STYLE: Record<string, { color: string; bg: string }> = {
  'pdf': { color: '#DC2626', bg: '#FEE2E2' },
  'doc': { color: '#2563EB', bg: '#DBEAFE' },
  'docx': { color: '#2563EB', bg: '#DBEAFE' },
  'xls': { color: '#059669', bg: '#D1FAE5' },
  'xlsx': { color: '#059669', bg: '#D1FAE5' },
  'ppt': { color: '#D97706', bg: '#FEF3C7' },
  'pptx': { color: '#D97706', bg: '#FEF3C7' },
  'txt': { color: '#6B7280', bg: '#F3F4F6' },
  'md': { color: '#7C3AED', bg: '#EDE9FE' },
}

/** 获取文件类型样式 */
const getFileTypeStyle = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  return FILE_TYPE_STYLE[ext] || { color: '#6B7280', bg: '#F3F4F6' }
}

/** 获取文件类型标签 */
const getFileTypeLabel = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const labels: Record<string, string> = {
    'pdf': 'PDF',
    'doc': 'DOC',
    'docx': 'DOC',
    'xls': 'XLS',
    'xlsx': 'XLS',
    'ppt': 'PPT',
    'pptx': 'PPT',
    'txt': 'TXT',
    'md': 'MD',
  }
  return labels[ext] || ext.toUpperCase()
}

/** 获取文件类型描述 */
const getFileTypeDesc = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const descs: Record<string, string> = {
    'pdf': 'PDF 文档',
    'doc': 'Word 文档',
    'docx': 'Word 文档',
    'xls': 'Excel 表格',
    'xlsx': 'Excel 表格',
    'ppt': 'PowerPoint 演示',
    'pptx': 'PowerPoint 演示',
    'txt': '文本文件',
    'md': 'Markdown 文档',
  }
  return descs[ext] || '文件'
}

interface ProjectHomeProps {
  project: Project
  onBack: () => void
  onChat: () => void
}

export default function ProjectHome({ project, onBack, onChat }: ProjectHomeProps) {
  const [files, setFiles] = useState<FileRecord[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>('所有文件')
  const [uploading, setUploading] = useState(false)
  const [classifying, setClassifying] = useState<number | null>(null)

  /** 加载文件列表 */
  const loadFiles = useCallback(async () => {
    let result
    if (selectedCategory && selectedCategory !== '所有文件') {
      result = await fileService.listByCategory(project.id, selectedCategory)
    } else {
      result = await fileService.list(project.id)
    }

    if (result.success && result.data) {
      setFiles(result.data)
    } else {
      message.error('加载文件列表失败')
    }
  }, [project.id, selectedCategory])

  useEffect(() => {
    loadFiles()
  }, [loadFiles])

  /** 上传文件 */
  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const result = await fileService.upload(project.id, file)
      if (result.success) {
        message.success(`${file.name} 上传成功`)
        loadFiles()
      } else {
        message.error(result.error || '上传失败')
      }
    } catch (error) {
      message.error('上传失败')
      console.error(error)
    } finally {
      setUploading(false)
    }
    return false // 阻止antd默认上传
  }

  /** 删除文件 */
  const handleDelete = async (id: number) => {
    try {
      const result = await fileService.delete(id)
      if (result.success) {
        message.success('删除成功')
        loadFiles()
      } else {
        message.error(result.error || '删除失败')
      }
    } catch (error) {
      message.error('删除失败')
      console.error(error)
    }
  }

  /** AI分类 */
  const handleClassify = async (fileId: number) => {
    setClassifying(fileId)
    try {
      const result = await aiService.classify(fileId)
      if (result.success) {
        const category = typeof result.data === 'object' && result.data ? result.data.category : result.data
        message.success(`分类结果：${category}`)
        loadFiles()
      } else {
        message.error(result.error || '分类失败')
      }
    } catch (error) {
      message.error('分类失败')
      console.error(error)
    } finally {
      setClassifying(null)
    }
  }

  /** 表格列配置 */
  const columns = [
    {
      title: '文件名',
      dataIndex: 'filename',
      key: 'filename',
      render: (name: string) => {
        const typeStyle = getFileTypeStyle(name)
        const typeLabel = getFileTypeLabel(name)
        const typeDesc = getFileTypeDesc(name)
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 600,
                background: typeStyle.bg,
                color: typeStyle.color,
                flexShrink: 0,
              }}
            >
              {typeLabel}
            </div>
            <div>
              <div style={{ fontWeight: 500, color: '#111827' }}>{name}</div>
              <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{typeDesc}</div>
            </div>
          </div>
        )
      },
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: string) => {
        if (!category) return <span style={{ color: '#6B7280' }}>未分类</span>
        const style = getStageStyle(category)
        return (
          <Tag
            style={{
              color: style.color,
              backgroundColor: style.bg,
              border: 'none',
              borderRadius: '9999px',
              padding: '2px 10px',
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            {category}
          </Tag>
        )
      },
    },
    {
      title: '大小',
      dataIndex: 'file_size',
      key: 'file_size',
      width: 100,
      render: (size: number) => {
        if (!size) return '-'
        if (size < 1024) return `${size} B`
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
        return `${(size / (1024 * 1024)).toFixed(1)} MB`
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: FileRecord) => (
        <div
          style={{ display: 'flex', gap: '2px', opacity: 0, transition: 'opacity 150ms' }}
          className="row-actions"
        >
          <Button
            type="text"
            size="small"
            icon={<RobotOutlined />}
            style={{ width: '30px', height: '30px' }}
            loading={classifying === record.id}
            onClick={() => handleClassify(record.id)}
            title="AI 分类"
          />
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            style={{ width: '30px', height: '30px' }}
            title="预览"
          />
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            style={{ width: '30px', height: '30px' }}
            title="编辑"
          />
          <Popconfirm
            title="确定删除该文件？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              style={{ width: '30px', height: '30px', color: '#EF4444' }}
              title="删除"
            />
          </Popconfirm>
        </div>
      ),
    },
  ]

  /** 阶段导航项 */
  const stageItems = [
    { key: '所有文件', icon: <AppstoreOutlined />, label: '所有文件', count: files.length },
    { key: '售前', icon: <FundOutlined />, label: '售前', count: 2 },
    { key: '启动', icon: <RocketOutlined />, label: '启动', count: 1 },
    { key: '需求', icon: <FileSearchOutlined />, label: '需求', count: 5 },
    { key: '方案', icon: <SolutionOutlined />, label: '方案', count: 3 },
    { key: '构建', icon: <ToolOutlined />, label: '构建', count: 6 },
    { key: '测试', icon: <ExperimentOutlined />, label: '测试', count: 4 },
    { key: '上线', icon: <CloudUploadOutlined />, label: '上线', count: 0 },
    { key: '验收', icon: <CheckCircleOutlined />, label: '验收', count: 1 },
    { key: '转客户成功', icon: <TeamOutlined />, label: '转客户成功', count: 0 },
    { key: '关闭', icon: <FolderOutlined />, label: '关闭', count: 1 },
  ]

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 56px)' }}>
      {/* 左侧：项目阶段导航 */}
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
            项目阶段
          </span>
          <Button
            type="text"
            size="small"
            icon={<UploadOutlined />}
            style={{ width: '24px', height: '24px', color: '#9CA3AF' }}
          />
        </div>

        <nav style={{ flex: 1, overflowY: 'auto', padding: '0 8px 8px' }}>
          {stageItems.map((item) => (
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
                color: selectedCategory === item.key ? '#4F46E5' : '#6B7280',
                background: selectedCategory === item.key ? '#EEF2FF' : 'transparent',
                border: 'none',
                width: '100%',
                textAlign: 'left',
                fontFamily: 'inherit',
                fontSize: '13px',
                fontWeight: selectedCategory === item.key ? 500 : 400,
                transition: 'all 150ms',
                position: 'relative',
                marginBottom: '2px',
              }}
              onClick={() => setSelectedCategory(item.key)}
              onMouseEnter={(e) => {
                if (selectedCategory !== item.key) {
                  e.currentTarget.style.background = '#F9FAFB'
                  e.currentTarget.style.color = '#111827'
                }
              }}
              onMouseLeave={(e) => {
                if (selectedCategory !== item.key) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#6B7280'
                }
              }}
            >
              {selectedCategory === item.key && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '8px',
                    bottom: '8px',
                    width: '3px',
                    background: '#4F46E5',
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
                  background: selectedCategory === item.key ? 'rgba(79,70,229,0.12)' : '#F3F4F6',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  color: selectedCategory === item.key ? '#4F46E5' : '#6B7280',
                  fontWeight: 500,
                }}
              >
                {item.count}
              </span>
            </button>
          ))}
        </nav>

        <div style={{ padding: '8px', borderTop: '1px solid #F3F4F6' }}>
          <Dragger
            name="file"
            multiple={true}
            showUploadList={false}
            customRequest={({ file }) => handleUpload(file as File)}
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
          >
            打开文件夹
          </Button>
        </div>
      </div>

      {/* 右侧：内容区域 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        {/* 摘要卡片 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
          <div
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
                  background: '#DBEAFE',
                  color: '#3B82F6',
                }}
              >
                <FileTextOutlined />
              </div>
              <span style={{ fontSize: '12px', color: '#6B7280' }}>文件数量</span>
            </div>
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#111827', fontFeatureSettings: '"tnum"' }}>
              {files.length}
            </span>
            <span style={{ fontSize: '11px', color: '#9CA3AF' }}>本周新增 3 个</span>
          </div>

          <div
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
                  background: '#FEE2E2',
                  color: '#EF4444',
                }}
              >
                <RobotOutlined />
              </div>
              <span style={{ fontSize: '12px', color: '#6B7280' }}>关键问题</span>
            </div>
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#111827', fontFeatureSettings: '"tnum"' }}>
              0
            </span>
            <span style={{ fontSize: '11px', color: '#9CA3AF' }}>待 AI 分析后更新</span>
          </div>

          <div
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
                  background: '#FEF3C7',
                  color: '#F59E0B',
                }}
              >
                <FolderOpenOutlined />
              </div>
              <span style={{ fontSize: '12px', color: '#6B7280' }}>待处理</span>
            </div>
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#111827', fontFeatureSettings: '"tnum"' }}>
              0
            </span>
            <span style={{ fontSize: '11px', color: '#9CA3AF' }}>待 AI 分析后更新</span>
          </div>

          <div
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
                  background: '#EDE9FE',
                  color: '#7C3AED',
                }}
              >
                <RobotOutlined />
              </div>
              <span style={{ fontSize: '12px', color: '#6B7280' }}>AI 摘要</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
              <Button type="default" size="small" style={{ flex: 1, height: '32px', fontSize: '12px' }}>
                查看摘要
              </Button>
              <Button type="primary" size="small" style={{ flex: 1, height: '32px', fontSize: '12px' }}>
                生成/更新
              </Button>
            </div>
          </div>
        </div>

        {/* 文件拖拽上传区域 - 只在"所有文件"显示 */}
        {selectedCategory === '所有文件' && (
          <Dragger
            name="file"
            multiple={true}
            showUploadList={false}
            customRequest={({ file }) => handleUpload(file as File)}
            style={{
              width: '100%',
              minHeight: '160px',
              border: '2px dashed #E5E7EB',
              borderRadius: '12px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#FFFFFF',
              marginBottom: '20px',
              transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <div style={{ fontSize: '48px', color: '#D1D5DB', marginBottom: '12px', transition: 'all 200ms' }}>
              <InboxOutlined />
            </div>
            <div style={{ fontSize: '15px', fontWeight: 500, color: '#6B7280', marginBottom: '4px' }}>
              拖拽文件到此处，或点击上传
            </div>
            <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
              AI 将自动识别文件内容并分类到对应阶段
            </div>
            <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
              {['PDF', 'Word', 'Excel', 'PPT', 'TXT', 'MD'].map((format) => (
                <span
                  key={format}
                  style={{
                    padding: '2px 8px',
                    background: '#F3F4F6',
                    borderRadius: '6px',
                    fontSize: '11px',
                    color: '#9CA3AF',
                    fontWeight: 500,
                  }}
                >
                  {format}
                </span>
              ))}
            </div>
          </Dragger>
        )}

        {/* 文件列表 */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <span style={{ fontSize: '16px', fontWeight: 600 }}>{selectedCategory || '所有文件'}</span>
              <span style={{ fontSize: '14px', color: '#6B7280', fontWeight: 400, marginLeft: '6px' }}>
                ({files.length})
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                type="text"
                size="small"
                icon={<FolderOpenOutlined />}
              >
                打开文件夹
              </Button>
              <Button
                type="text"
                size="small"
                icon={<FolderOutlined />}
                onClick={loadFiles}
              >
                刷新
              </Button>
            </div>
          </div>

          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              overflow: 'hidden',
            }}
          >
            <Table
              columns={columns}
              dataSource={files}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 个文件`,
              }}
              onRow={(record) => ({
                onMouseEnter: () => {
                  const row = document.querySelector(`[data-row-key="${record.id}"]`)
                  if (row) {
                    const actions = row.querySelector('.row-actions') as HTMLElement
                    if (actions) actions.style.opacity = '1'
                  }
                },
                onMouseLeave: () => {
                  const row = document.querySelector(`[data-row-key="${record.id}"]`)
                  if (row) {
                    const actions = row.querySelector('.row-actions') as HTMLElement
                    if (actions) actions.style.opacity = '0'
                  }
                },
              })}
            />
          </div>
        </div>
      </div>

      <style>{`
        .row-actions {
          opacity: 0;
          transition: opacity 150ms;
        }
      `}</style>
    </div>
  )
}
