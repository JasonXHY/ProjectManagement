import { memo, useState, useCallback, useEffect } from 'react'
import { Modal, Upload, Input, Typography, Button, Space, message, Spin } from 'antd'
import { InboxOutlined } from '@ant-design/icons'

const { Dragger } = Upload
const { Text } = Typography

interface HandoverPreview {
  projectName: string
  fileCount: number
  stage: string
  handoverNote: string
}

interface ImportDialogProps {
  open: boolean
  onClose: () => void
  onImported: () => void
}

const ImportDialog = memo(function ImportDialog({
  open,
  onClose,
  onImported,
}: ImportDialogProps) {
  const [filePath, setFilePath] = useState<string | null>(null)
  const [preview, setPreview] = useState<HandoverPreview | null>(null)
  const [projectName, setProjectName] = useState('')
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    if (!open) {
      resetState()
    }
  }, [open])

  const resetState = () => {
    setFilePath(null)
    setPreview(null)
    setProjectName('')
  }

  const handleBeforeUpload = useCallback(async (file: File) => {
    const name = file.name
    if (!name.endsWith('.pmaer.zip')) {
      message.error('请选择 .pmaer.zip 文件')
      return false
    }

    // Electron中File对象有path属性，包含完整路径
    const fullPath = (file as any).path
    if (!fullPath) {
      message.error('无法获取文件路径，请通过文件选择器选择')
      return false
    }

    resetState()
    setLoadingPreview(true)
    try {
      const result = await window.api.handover.preview(fullPath)
      if (result.success && result.data) {
        const data = result.data
        setFilePath(fullPath)
        setPreview({
          projectName: data.projectName || data.project_name || '未命名项目',
          fileCount: data.fileCount || data.file_count || 0,
          stage: data.stage || '未设置',
          handoverNote: data.handoverNote || data.handover_note || '',
        })
        setProjectName(data.projectName || data.project_name || '')
      } else {
        message.error(result.error || '预览失败')
      }
    } catch {
      message.error('预览请求失败')
    } finally {
      setLoadingPreview(false)
    }
    return false
  }, [])

  const handleImport = useCallback(async () => {
    if (!filePath) return

    setImporting(true)
    try {
      const result = await window.api.handover.import({
        zipPath: filePath,
        projectName: projectName || undefined,
      })
      if (result.success) {
        message.success('导入成功')
        onImported()
        onClose()
      } else {
        message.error(result.error || '导入失败')
      }
    } catch {
      message.error('导入请求失败')
    } finally {
      setImporting(false)
    }
  }, [filePath, projectName, onImported, onClose])

  const renderContent = () => {
    if (loadingPreview) {
      return (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin description="正在解析文件..." />
        </div>
      )
    }

    if (!preview) {
      return (
        <Dragger
          accept=".zip"
          showUploadList={false}
          beforeUpload={handleBeforeUpload}
          style={{
            padding: '24px 0',
            height: '200px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽 .pmaer.zip 文件到此处</p>
        </Dragger>
      )
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <Text strong>项目名称：</Text>
          <Text>{preview.projectName}</Text>
        </div>
        <div>
          <Text strong>文件数量：</Text>
          <Text>{preview.fileCount} 个文件</Text>
        </div>
        <div>
          <Text strong>项目阶段：</Text>
          <Text>{preview.stage}</Text>
        </div>
        {preview.handoverNote && (
          <div>
            <Text strong>转交说明：</Text>
            <div style={{ marginTop: 4, padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
              <Text>{preview.handoverNote}</Text>
            </div>
          </div>
        )}
        <div style={{ marginTop: 8 }}>
          <div style={{ marginBottom: 8 }}>
            <Text strong>导入后项目名称：</Text>
          </div>
          <Input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="请输入项目名称"
          />
        </div>
      </div>
    )
  }

  return (
    <Modal
      title="导入转交项目"
      open={open}
      onCancel={onClose}
      width={500}
      styles={{
        body: { maxHeight: '800px', overflow: 'auto' }
      }}
      footer={
        preview ? (
          <Space>
            <Button onClick={onClose}>取消</Button>
            <Button
              type="primary"
              loading={importing}
              onClick={handleImport}
            >
              确认导入
            </Button>
          </Space>
        ) : null
      }
    >
      {renderContent()}
    </Modal>
  )
})

export default ImportDialog
