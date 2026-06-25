import { memo } from 'react'
import { Modal } from 'antd'
import MarkdownPreview from '../MarkdownPreview'

interface AISummaryModalProps {
  open: boolean
  onClose: () => void
  summary: string
}

const AISummaryModal = memo(function AISummaryModal({
  open,
  onClose,
  summary,
}: AISummaryModalProps) {
  return (
    <Modal
      title="AI 项目摘要"
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      {summary ? (
        <div className="markdown-body">
          <MarkdownPreview content={summary} />
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-placeholder)' }}>
          <div style={{ fontSize: '16px', marginBottom: '8px' }}>暂无摘要</div>
          <div style={{ fontSize: '14px' }}>点击"生成/更新"按钮生成项目摘要</div>
        </div>
      )}
    </Modal>
  )
})

export default AISummaryModal
