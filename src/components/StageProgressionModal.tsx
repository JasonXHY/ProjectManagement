import { memo } from 'react'
import { Modal, Tag } from 'antd'
import { Project } from '../types'
import { STAGE_STYLE } from './ProjectHome/projectHome.styles'

interface StageProgressionModalProps {
  open: boolean
  project: Project
  detectedFileType: string
  targetStage: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

const StageProgressionModal = memo(function StageProgressionModal({
  open,
  project,
  detectedFileType,
  targetStage,
  onConfirm,
  onCancel,
  loading = false,
}: StageProgressionModalProps) {
  const currentStyle = STAGE_STYLE[project.current_stage] || { color: '#6B7280', bg: '#F9FAFB' }
  const targetStyle = STAGE_STYLE[targetStage] || { color: '#6B7280', bg: '#F9FAFB' }

  return (
    <Modal
      title="检测到阶段推进信号"
      open={open}
      onOk={onConfirm}
      onCancel={onCancel}
      okText="确认推进"
      cancelText="取消"
      confirmLoading={loading}
      width={480}
    >
      <div style={{ padding: '8px 0' }}>
        <div style={{ marginBottom: '16px', color: '#374151', fontSize: '14px', lineHeight: '1.6' }}>
          AI识别到文件属于<strong>「{detectedFileType}」</strong>阶段，
          可能意味着项目阶段需要推进。
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>当前阶段</div>
            <Tag
              style={{
                color: currentStyle.color,
                backgroundColor: currentStyle.bg,
                border: 'none',
                borderRadius: '9999px',
                padding: '4px 12px',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              {project.current_stage}
            </Tag>
          </div>

          <div style={{ fontSize: '20px', color: '#D1D5DB' }}>→</div>

          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>目标阶段</div>
            <Tag
              style={{
                color: targetStyle.color,
                backgroundColor: targetStyle.bg,
                border: 'none',
                borderRadius: '9999px',
                padding: '4px 12px',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              {targetStage}
            </Tag>
          </div>
        </div>

        <div style={{ fontSize: '13px', color: '#6B7280', background: '#F9FAFB', padding: '10px 12px', borderRadius: '8px' }}>
          确认后，项目阶段将自动更新为「{targetStage}」。
        </div>
      </div>
    </Modal>
  )
})

export default StageProgressionModal
