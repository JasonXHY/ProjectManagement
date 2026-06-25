import { memo, ReactNode } from 'react'
import { Modal } from 'antd'

interface ListDetailModalProps<T> {
  open: boolean
  onClose: () => void
  title: string
  items: T[]
  renderItem: (item: T, index: number) => ReactNode
  emptyText?: string
}

function ListDetailModal<T>({
  open,
  onClose,
  title,
  items,
  renderItem,
  emptyText = '暂无数据',
}: ListDetailModalProps<T>) {
  return (
    <Modal
      title={title}
      open={open}
      onCancel={onClose}
      footer={null}
      width={640}
    >
      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-placeholder)' }}>
          {emptyText}
        </div>
      ) : (
        <div>
          {items.map((item, index) => (
            <div
              key={index}
              style={{
                padding: '12px 0',
                borderBottom: index < items.length - 1 ? '1px solid var(--border-light)' : 'none',
              }}
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}

export default memo(ListDetailModal) as <T>(props: ListDetailModalProps<T>) => JSX.Element
