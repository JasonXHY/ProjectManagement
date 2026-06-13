import { Button, Progress } from 'antd'
import {
  RobotOutlined,
  DeleteOutlined,
} from '@ant-design/icons'

interface BatchActionBarProps {
  selectedCount: number
  batchClassifying: boolean
  classifyProgress: { current: number; total: number } | null
  onBatchClassify: () => void
  onBatchDelete: () => void
}

export default function BatchActionBar({ selectedCount, batchClassifying, classifyProgress, onBatchClassify, onBatchDelete }: BatchActionBarProps) {
  if (selectedCount === 0) return null

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '8px 16px',
        background: '#F0F5FF',
        border: '1px solid #BAE7FF',
        borderRadius: '8px',
        marginBottom: '12px',
      }}
    >
      <span style={{ fontSize: '13px', color: '#1890FF', fontWeight: 500 }}>
        已选 {selectedCount} 项
      </span>
      <Button
        type="primary"
        size="small"
        icon={<RobotOutlined />}
        loading={batchClassifying}
        onClick={onBatchClassify}
      >
        批量分类
      </Button>
      <Button
        danger
        size="small"
        icon={<DeleteOutlined />}
        onClick={onBatchDelete}
      >
        批量删除
      </Button>
      {classifyProgress && (
        <Progress
          percent={Math.round((classifyProgress.current / classifyProgress.total) * 100)}
          size="small"
          style={{ width: 120 }}
          format={() => `${classifyProgress.current}/${classifyProgress.total}`}
        />
      )}
    </div>
  )
}