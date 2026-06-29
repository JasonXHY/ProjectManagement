import { memo, useRef } from 'react'
import { Modal, Button, message } from 'antd'
import { PlusOutlined, UploadOutlined } from '@ant-design/icons'
import { SignatureDoc } from '../../types'

interface SignatureDetailModalProps {
  open: boolean
  onClose: () => void
  docs: SignatureDoc[]
  onDocStatusChange?: (docId: string, status: 'signed' | 'unsigned') => void
}

const SignatureDetailModal = memo(function SignatureDetailModal({
  open,
  onClose,
  docs,
  onDocStatusChange,
}: SignatureDetailModalProps) {
  const activeDocIdRef = useRef<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const signedCount = docs.filter(d => d.status === 'signed').length
  const unsignedCount = docs.filter(d => d.status === 'unsigned').length
  const totalCount = docs.length || 1
  const percent = Math.round((signedCount / totalCount) * 100)

  const handleUploadClick = (docId: string) => {
    activeDocIdRef.current = docId
    fileInputRef.current?.click()
  }

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    onDocStatusChange?.(activeDocIdRef.current, 'signed')
    message.success(`已上传: ${file.name}`)
    e.target.value = ''
  }

  return (
    <Modal
      title="签字文件追踪"
      open={open}
      onCancel={onClose}
      width={640}
      footer={
        <>
          <input
            type="file"
            ref={fileInputRef}
            accept=".pdf,.jpg,.png"
            style={{ display: 'none' }}
            onChange={handleFileSelected}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button icon={<PlusOutlined />}>手动添加</Button>
            <Button onClick={onClose}>关闭</Button>
          </div>
        </>
      }
    >
      {docs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-placeholder)' }}>
          暂无签字文件
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
            <div style={{ textAlign: 'center', padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-success)' }}>{signedCount}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>已签字</div>
            </div>
            <div style={{ textAlign: 'center', padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-error)' }}>{unsignedCount}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>待签字</div>
            </div>
            <div style={{ textAlign: 'center', padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '24px', fontWeight: 700 }}>{percent}%</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>完成率</div>
            </div>
          </div>

          <div style={{ height: '6px', background: 'var(--bg-secondary)', borderRadius: '3px', marginBottom: '16px' }}>
            <div style={{ height: '100%', width: `${percent}%`, background: 'var(--color-success)', borderRadius: '3px' }} />
          </div>

          {docs.map(doc => (
            <div
              key={doc.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 0',
                borderBottom: '1px solid var(--border-light)',
                fontSize: '13px',
              }}
            >
              <span style={{ color: 'var(--text-placeholder)', fontSize: '16px' }}>📄</span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {doc.name}
              </span>
              {doc.category && (
                <span style={{ fontSize: '11px', color: 'var(--text-placeholder)' }}>{doc.category}</span>
              )}
              <span
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: doc.status === 'signed' ? '#D1FAE5' : '#FEE2E2',
                  color: doc.status === 'signed' ? '#065F46' : '#991B1B',
                }}
              >
                {doc.status === 'signed' ? '已签字' : '待签字'}
              </span>
              {doc.status === 'unsigned' && (
                <button
                  style={{
                    padding: '3px 8px',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface)',
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleUploadClick(doc.id)}
                >
                  上传
                </button>
              )}
            </div>
          ))}
        </>
      )}
    </Modal>
  )
})

export default SignatureDetailModal
