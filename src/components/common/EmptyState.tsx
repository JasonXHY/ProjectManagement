import { memo } from 'react'
import { Button } from 'antd'
import {
  InboxOutlined,
  FileTextOutlined,
  MessageOutlined,
  SearchOutlined,
} from '@ant-design/icons'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

const ICON_MAP = {
  inbox: <InboxOutlined />,
  file: <FileTextOutlined />,
  message: <MessageOutlined />,
  search: <SearchOutlined />,
}

const EmptyState = memo(function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      textAlign: 'center',
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        background: 'var(--bg-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '28px',
        color: 'var(--text-disabled)',
        marginBottom: '16px',
      }}>
        {icon || ICON_MAP.inbox}
      </div>
      <div style={{
        fontSize: '16px',
        fontWeight: 500,
        color: 'var(--text-secondary)',
        marginBottom: '8px',
      }}>
        {title}
      </div>
      {description && (
        <div style={{
          fontSize: '14px',
          color: 'var(--text-placeholder)',
          marginBottom: action ? '16px' : 0,
        }}>
          {description}
        </div>
      )}
      {action && (
        <Button type="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
})

export default EmptyState
export { ICON_MAP }
