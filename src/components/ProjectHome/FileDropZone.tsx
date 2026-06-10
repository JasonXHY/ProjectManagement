import { useState } from 'react'
import { Upload, message, Table, Button, Space, Popconfirm } from 'antd'
import { InboxOutlined, DeleteOutlined, RobotOutlined } from '@ant-design/icons'
import { FileRecord } from '../../types'
import { fileService } from '../../services/fileService'
import { aiService } from '../../services/aiService'

interface FileDropZoneProps {
  projectId: number
  files: FileRecord[]
  onFilesChange: () => void
}

export default function FileDropZone({ projectId, files, onFilesChange }: FileDropZoneProps) {
  const [uploading, setUploading] = useState(false)
  const [classifying, setClassifying] = useState<number | null>(null)

  const handleUpload = async (file: File) => {
    setUploading(true)
    const result = await fileService.upload(projectId, file)
    setUploading(false)

    if (result.success) {
      message.success(`${file.name} 上传成功`)
      onFilesChange()
    } else {
      message.error(result.error || '上传失败')
    }

    return false // 阻止antd默认上传
  }

  const handleDelete = async (id: number) => {
    const result = await fileService.delete(id)
    if (result.success) {
      message.success('删除成功')
      onFilesChange()
    } else {
      message.error(result.error || '删除失败')
    }
  }

  const handleClassify = async (fileId: number) => {
    setClassifying(fileId)
    const result = await aiService.classify(fileId)
    setClassifying(null)

    if (result.success) {
      const category = typeof result.data === 'object' && result.data ? result.data.category : result.data
      message.success(`分类结果：${category}`)
      onFilesChange()
    } else {
      message.error(result.error || '分类失败')
    }
  }

  const columns = [
    {
      title: '文件名',
      dataIndex: 'filename',
      key: 'filename'
    },
    {
      title: '类型',
      dataIndex: 'file_type',
      key: 'file_type'
    },
    {
      title: '大小',
      dataIndex: 'file_size',
      key: 'file_size',
      render: (size: number) => size ? `${(size / 1024).toFixed(1)} KB` : '-'
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => category || <span style={{ color: '#999' }}>未分类</span>
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: FileRecord) => (
        <Space>
          <Button
            icon={<RobotOutlined />}
            loading={classifying === record.id}
            onClick={() => handleClassify(record.id)}
          >
            AI分类
          </Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div>
      <Upload.Dragger
        multiple
        beforeUpload={handleUpload}
        showUploadList={false}
        disabled={uploading}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
        <p className="ant-upload-hint">支持所有常见文件格式</p>
      </Upload.Dragger>

      <Table
        columns={columns}
        dataSource={files}
        rowKey="id"
        style={{ marginTop: 16 }}
        pagination={{ pageSize: 10 }}
      />
    </div>
  )
}
