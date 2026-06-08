import { useState, useEffect, useCallback } from 'react'
import { Button, message, Table, Space, Popconfirm, Tag } from 'antd'
import {
  UploadOutlined,
  DeleteOutlined,
  RobotOutlined,
  EyeOutlined,
  EditOutlined,
  FolderOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons'
import { Project, FileRecord } from '../../types'
import StageNav from './StageNav'
import SummaryCards from './SummaryCards'
import { fileService } from '../../services/fileService'
import { aiService } from '../../services/aiService'

/** 项目阶段样式映射 */
const STAGE_STYLE: Record<string, { color: string; bg: string }> = {
  '蓝图阶段': { color: '#2b6cb0', bg: '#ebf8ff' },
  '启动阶段': { color: '#276749', bg: '#f0fff4' },
  '售前阶段': { color: '#975a16', bg: '#fefcbf' },
  '进行中': { color: '#553c9a', bg: '#e9d8fd' },
  '验收阶段': { color: '#97266d', bg: '#fed7e2' },
  '已结束': { color: '#4a5568', bg: '#e2e8f0' },
  '已中止': { color: '#9b2c2c', bg: '#fed7d7' },
  '启动': { color: '#276749', bg: '#f0fff4' },
  '调研': { color: '#2b6cb0', bg: '#ebf8ff' },
  '规划': { color: '#975a16', bg: '#fefcbf' },
  '设计': { color: '#553c9a', bg: '#e9d8fd' },
  '开发': { color: '#553c9a', bg: '#e9d8fd' },
  '测试': { color: '#97266d', bg: '#fed7e2' },
  '部署': { color: '#276749', bg: '#f0fff4' },
  '运维': { color: '#4a5568', bg: '#e2e8f0' },
  '评估': { color: '#975a16', bg: '#fefcbf' },
  '归档': { color: '#4a5568', bg: '#e2e8f0' },
}

/** 获取阶段样式 */
const getStageStyle = (stage: string) => {
  return STAGE_STYLE[stage] || { color: '#4a5568', bg: '#e2e8f0' }
}

interface ProjectHomeProps {
  project: Project
  onBack: () => void
  onChat: () => void
}

export default function ProjectHome({ project, onBack, onChat }: ProjectHomeProps) {
  const [files, setFiles] = useState<FileRecord[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
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
        message.success(`分类结果：${result.data}`)
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
      render: (name: string) => (
        <span className="font-semibold text-gray-800">{name}</span>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: string) => {
        if (!category) return <span className="text-gray-400">未分类</span>
        const style = getStageStyle(category)
        return (
          <Tag
            style={{
              color: style.color,
              backgroundColor: style.bg,
              border: 'none',
              borderRadius: '20px',
              padding: '4px 12px',
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
      width: 280,
      render: (_: unknown, record: FileRecord) => (
        <Space>
          <Button
            size="small"
            icon={<RobotOutlined />}
            loading={classifying === record.id}
            onClick={() => handleClassify(record.id)}
          >
            AI分类
          </Button>
          <Button size="small" icon={<EyeOutlined />}>
            预览
          </Button>
          <Button size="small" icon={<EditOutlined />}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除该文件？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="flex gap-6 min-h-[calc(100vh-200px)]">
      {/* 左侧：项目阶段导航 */}
      <div className="w-64 flex-shrink-0">
        <StageNav
          project={project}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </div>

      {/* 右侧：内容区域 */}
      <div className="flex-1">
        {/* 摘要卡片 */}
        <SummaryCards projectId={project.id} fileCount={files.length} />

        {/* 文件拖拽上传区域 */}
        <div
          style={{
            width: '100%',
            height: '40%',
            minHeight: '200px',
            border: '2px dashed #d9d9d9',
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'center',
            backgroundColor: '#fafafa',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            transition: 'border-color 0.3s, background-color 0.3s',
          }}
          onDrop={(e) => {
            e.preventDefault()
            e.stopPropagation()
            const droppedFiles = Array.from(e.dataTransfer.files)
            droppedFiles.forEach((file) => handleUpload(file))
          }}
          onDragOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onDragEnter={(e) => {
            e.preventDefault()
            e.stopPropagation()
            e.currentTarget.style.borderColor = '#1890ff'
            e.currentTarget.style.backgroundColor = '#e6f7ff'
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            e.stopPropagation()
            e.currentTarget.style.borderColor = '#d9d9d9'
            e.currentTarget.style.backgroundColor = '#fafafa'
          }}
          onClick={() => {
            const input = document.createElement('input')
            input.type = 'file'
            input.multiple = true
            input.onchange = (event) => {
              const target = event.target as HTMLInputElement
              if (target.files) {
                Array.from(target.files).forEach((file) => handleUpload(file))
              }
            }
            input.click()
          }}
        >
          <UploadOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '12px' }} />
          <p style={{ fontSize: '16px', color: '#333', margin: '0 0 8px 0' }}>
            拖拽文件到此处或点击上传
          </p>
          <p style={{ fontSize: '14px', color: '#999', margin: 0 }}>
            支持所有常见文件格式，AI将自动分类
          </p>
        </div>

        {/* 文件列表 */}
        <div className="bg-white rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold m-0">
              {selectedCategory || '所有文件'} ({files.length})
            </h4>
            <Space>
              <Button icon={<FolderOpenOutlined />}>打开文件夹</Button>
              <Button onClick={loadFiles}>刷新</Button>
            </Space>
          </div>
          <Table
            columns={columns}
            dataSource={files}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 个文件`,
            }}
          />
        </div>
      </div>
    </div>
  )
}
