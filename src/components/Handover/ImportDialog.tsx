import { memo, useState, useCallback, useEffect } from 'react'
import { Modal, Input, Typography, Button, Space, message, Spin } from 'antd'
import { InboxOutlined } from '@ant-design/icons'

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

  const handleSelectFile = useCallback(async () => {
    const result = await window.api.handover.selectFile()
    if (!result.success || !result.data) {
      if (result.error !== '用户取消选择') {
        message.error(result.error || '选择文件失败')
      }
      return
    }

    const fullPath = result.data.filePath
    if (!fullPath.endsWith('.pmaer.zip')) {
      message.error('请选择 .pmaer.zip 文件')
      return
    }

    resetState()
    setLoadingPreview(true)
    try {
      const previewResult = await window.api.handover.preview(fullPath)
      if (previewResult.success && previewResult.data) {
        const data = previewResult.data
        setFilePath(fullPath)
        setPreview({
          projectName: data.projectName || data.project_name || '未命名项目',
          fileCount: data.fileCount || data.file_count || 0,
          stage: data.stage || '未设置',
          handoverNote: data.handoverNote || data.handover_note || '',
        })
        setProjectName(data.projectName || data.project_name || '')
      } else {
        message.error(previewResult.error || '预览失败')
      }
    } catch {
      message.error('预览请求失败')
    } finally {
      setLoadingPreview(false)
    }
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
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ marginBottom: 16, color: 'var(--text-placeholder)', fontSize: 48 }}>
            <InboxOutlined />
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
            选择 .pmaer.zip 转交包文件进行导入
          </p>
          <Button type="primary" icon={<InboxOutlined />} onClick={handleSelectFile}>
            选择文件
          </Button>
        </div>
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
