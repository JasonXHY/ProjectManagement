import { memo, useState, useCallback, useEffect, useRef } from 'react'
import { Modal, Radio, Input, Button, Checkbox, Space, message, Spin } from 'antd'
import { RobotOutlined, ExportOutlined } from '@ant-design/icons'
import { FileRecord } from '../../types'
import type { HandoverFileInfo } from '../../types/windowApi'

const { TextArea } = Input

interface HandoverDialogProps {
  open: boolean
  onClose: () => void
  projectId: number
  projectName: string
}

const HandoverDialog = memo(function HandoverDialog({
  open,
  onClose,
  projectId,
  projectName: _projectName,
}: HandoverDialogProps) {
  const [mode, setMode] = useState<'full' | 'selective'>('full')
  const [description, setDescription] = useState('')
  const [handoverNote, setHandoverNote] = useState('')
  const [allFiles, setAllFiles] = useState<FileRecord[]>([])
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [aiRecommended, setAiRecommended] = useState<string[]>([])
  const [loadingFiles, setLoadingFiles] = useState(false)
  const [loadingAi, setLoadingAi] = useState(false)
  const [exporting, setExporting] = useState(false)
  const loadFilesRef = useRef<() => Promise<void>>(null)

  useEffect(() => {
    loadFilesRef.current = async () => {
      setLoadingFiles(true)
      try {
        const result = await window.api.file.list(projectId)
        if (result.success && result.data) {
          setAllFiles(result.data)
        }
      } catch {
        message.error('加载文件列表失败')
      } finally {
        setLoadingFiles(false)
      }
    }
  }, [projectId])

  useEffect(() => {
    if (open) {
      loadFilesRef.current?.()
    } else {
      resetState()
    }
  }, [open])

  const resetState = () => {
    setMode('full')
    setDescription('')
    setHandoverNote('')
    setSelectedFiles([])
    setAiRecommended([])
  }

  const handleAiRecommend = useCallback(async () => {
    if (!description.trim()) {
      message.warning('请先填写新同事描述')
      return
    }
    setLoadingAi(true)
    try {
      const result = await window.api.handover.aiSelect(projectId, description)
      if (result.success && result.data) {
        const recommended = result.data.map((f: HandoverFileInfo) => f.filename)
        setAiRecommended(recommended)
        setSelectedFiles(recommended)
        message.success(`AI推荐了 ${recommended.length} 个文件`)
      } else {
        message.error(result.error || 'AI推荐失败')
      }
    } catch {
      message.error('AI推荐请求失败')
    } finally {
      setLoadingAi(false)
    }
  }, [projectId, description])

  const handleFileCheckChange = useCallback((checkedValues: (string | number | boolean)[]) => {
    setSelectedFiles(checkedValues as string[])
  }, [])

  const handleExport = useCallback(async () => {
    if (mode === 'selective') {
      if (!description.trim()) {
        message.warning('请填写新同事描述')
        return
      }
      if (selectedFiles.length === 0) {
        message.warning('请至少选择一个文件')
        return
      }
    }

    setExporting(true)
    try {
      const result = await window.api.handover.export({
        projectId,
        mode,
        selectedFiles: mode === 'selective' ? selectedFiles : undefined,
        handoverNote: handoverNote || undefined,
      })
      if (result.success) {
        message.success('导出成功')
        onClose()
      } else {
        message.error(result.error || '导出失败')
      }
    } catch {
      message.error('导出请求失败')
    } finally {
      setExporting(false)
    }
  }, [projectId, mode, selectedFiles, handoverNote, description, onClose])

  const otherFiles = allFiles.filter(f => !aiRecommended.includes(f.filename))

  return (
    <Modal
      title="项目转交"
      open={open}
      onCancel={onClose}
      width={560}
      footer={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button
            type="primary"
            icon={<ExportOutlined />}
            loading={exporting}
            onClick={handleExport}
          >
            导出
          </Button>
        </Space>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>转交模式：</div>
          <Radio.Group
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            <Space direction="vertical">
              <Radio value="full">整体转交</Radio>
              <Radio value="selective">协作转交</Radio>
            </Space>
          </Radio.Group>
        </div>

        {mode === 'selective' && (
          <>
            <div>
              <div style={{ marginBottom: 8, fontWeight: 500 }}>
                新同事描述 <span style={{ color: '#ef4444' }}>*</span>
              </div>
              <TextArea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="描述新同事的角色和需要关注的文件类型，例如：新来的前端开发，主要负责用户界面模块"
                rows={3}
              />
            </div>

            <div>
              <Space style={{ marginBottom: 8 }}>
                <Button
                  type="primary"
                  icon={<RobotOutlined />}
                  loading={loadingAi}
                  onClick={handleAiRecommend}
                >
                  AI 推荐文件
                </Button>
              </Space>
            </div>

            <Spin spinning={loadingFiles}>
              {allFiles.length > 0 ? (
                <div>
                  <div style={{ marginBottom: 8, fontWeight: 500 }}>文件列表：</div>
                  <Checkbox.Group
                    value={selectedFiles}
                    onChange={handleFileCheckChange}
                    style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                  >
                    {aiRecommended.length > 0 && (
                      <div>
                        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                          AI 推荐
                        </div>
                        {aiRecommended.map((filename) => (
                          <Checkbox key={filename} value={filename} style={{ display: 'block' }}>
                            {filename}
                          </Checkbox>
                        ))}
                      </div>
                    )}
                    {otherFiles.length > 0 && (
                      <div>
                        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                          其他文件
                        </div>
                        {otherFiles.map((file) => (
                          <Checkbox key={file.filename} value={file.filename} style={{ display: 'block' }}>
                            {file.filename}
                          </Checkbox>
                        ))}
                      </div>
                    )}
                  </Checkbox.Group>
                </div>
              ) : (
                <div style={{ color: '#6b7280', fontSize: 13 }}>
                  {loadingFiles ? '加载中...' : '暂无文件'}
                </div>
              )}
            </Spin>
          </>
        )}

        <div>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>转交说明（可选）</div>
          <TextArea
            value={handoverNote}
            onChange={(e) => setHandoverNote(e.target.value)}
            placeholder="添加转交说明，帮助新同事了解项目背景"
            rows={3}
          />
        </div>
      </div>
    </Modal>
  )
})

export default HandoverDialog
