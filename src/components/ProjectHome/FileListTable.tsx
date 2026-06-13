import { useMemo } from 'react'
import { Table, Button, Popconfirm, Tag, message, MenuProps, Dropdown } from 'antd'
import {
  RobotOutlined,
  DeleteOutlined,
  EyeOutlined,
  DownOutlined,
  SignatureOutlined,
} from '@ant-design/icons'
import { FileRecord } from '../../types'
import { getStageStyle, getFileTypeStyle, getFileTypeLabel, getFileTypeDesc } from './projectHome.styles'
import EmptyState from '../common/EmptyState'

interface FileListTableProps {
  files: FileRecord[]
  classifying: number | null
  onClassify: (fileId: number) => void
  onDelete: (id: number) => void
  onStageChange: (fileId: number, newStage: string) => void
  selectedRowKeys: React.Key[]
  onSelectionChange: (keys: React.Key[]) => void
  onUpload: (file: File) => void
}

export default function FileListTable({
  files,
  classifying,
  onClassify,
  onDelete,
  onStageChange,
  selectedRowKeys,
  onSelectionChange,
  onUpload,
}: FileListTableProps) {
  const columns = useMemo(() => [
    {
      title: '文件名',
      dataIndex: 'filename',
      key: 'filename',
      render: (name: string) => {
        const typeStyle = getFileTypeStyle(name)
        const typeLabel = getFileTypeLabel(name)
        const typeDesc = getFileTypeDesc(name)
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 600,
                background: typeStyle.bg,
                color: typeStyle.color,
                flexShrink: 0,
              }}
            >
              {typeLabel}
            </div>
            <div>
              <div style={{ fontWeight: 500, color: '#111827' }}>{name}</div>
              <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{typeDesc}</div>
            </div>
          </div>
        )
      },
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: string) => {
        if (!category) return <span style={{ color: '#6B7280' }}>未分类</span>
        const style = getStageStyle(category)
        return (
          <Tag
            style={{
              color: style.color,
              backgroundColor: style.bg,
              border: 'none',
              borderRadius: '9999px',
              padding: '2px 10px',
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            {category}
          </Tag>
        )
      },
    },
    {
      title: '签字',
      dataIndex: 'has_signature',
      key: 'has_signature',
      width: 80,
      render: (hasSignature: boolean) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {hasSignature ? (
            <Tag
              color="success"
              icon={<SignatureOutlined />}
              style={{ borderRadius: '9999px', padding: '2px 8px', fontSize: '12px' }}
            >
              有签字
            </Tag>
          ) : (
            <span style={{ color: '#9CA3AF', fontSize: '12px' }}>-</span>
          )}
        </div>
      ),
    },
    {
      title: '阶段',
      key: 'stage',
      width: 120,
      render: (_: unknown, record: FileRecord) => {
        const stageItems: MenuProps['items'] = [
          { key: '售前', label: '售前' },
          { key: '启动', label: '启动' },
          { key: '需求', label: '需求' },
          { key: '方案', label: '方案' },
          { key: '构建', label: '构建' },
          { key: '测试', label: '测试' },
          { key: '上线', label: '上线' },
          { key: '验收', label: '验收' },
          { key: '转客户成功', label: '转客户成功' },
          { key: '关闭', label: '关闭' },
        ]

        return (
          <Dropdown
            menu={{
              items: stageItems,
              onClick: ({ key }) => onStageChange(record.id, key),
            }}
            trigger={['click']}
          >
            <Button
              type="text"
              size="small"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
                color: record.category ? getStageStyle(record.category).color : '#6B7280',
              }}
            >
              {record.category || '选择阶段'}
              <DownOutlined style={{ fontSize: '10px' }} />
            </Button>
          </Dropdown>
        )
      },
    },
    {
      title: '大小',
      dataIndex: 'file_size',
      key: 'file_size',
      width: 100,
      render: (size: number) => {
        if (!size) return '-'
        if (size < 1024) return `${size} B`
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
        return `${(size / (1024 * 1024)).toFixed(1)} MB`
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: FileRecord) => (
        <div
          style={{ display: 'flex', gap: '2px', opacity: 0, transition: 'opacity 150ms' }}
          className="row-actions"
        >
          <Button
            type="text"
            size="small"
            icon={<RobotOutlined />}
            style={{ width: '30px', height: '30px' }}
            loading={classifying === record.id}
            onClick={() => onClassify(record.id)}
            title="AI 分类"
          />
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            style={{ width: '30px', height: '30px' }}
            onClick={async () => {
              const result = await window.api.file.open(record.id)
              if (!result.success) {
                message.error(result.error || '打开文件失败')
              }
            }}
            title="打开文件"
          />
          <Popconfirm
            title="确定删除该文件？"
            onConfirm={() => onDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              style={{ width: '30px', height: '30px', color: '#EF4444' }}
              title="删除"
            />
          </Popconfirm>
        </div>
      ),
    },
  ], [classifying, onClassify, onDelete, onStageChange])

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      <Table
        columns={columns}
        dataSource={files}
        rowKey="id"
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => onSelectionChange(keys),
        }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 个文件`,
        }}
        locale={{
          emptyText: (
            <EmptyState
              icon={<RobotOutlined />}
              title="还没有文件"
              description="上传文件开始项目管理"
              action={{
                label: '上传文件',
                onClick: () => {
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.multiple = true
                  input.onchange = (e) => {
                    const files = (e.target as HTMLInputElement).files
                    if (files) {
                      Array.from(files).forEach(file => onUpload(file))
                    }
                  }
                  input.click()
                },
              }}
            />
          ),
        }}
        onRow={(record) => ({
          onMouseEnter: () => {
            const row = document.querySelector(`[data-row-key="${record.id}"]`)
            if (row) {
              const actions = row.querySelector('.row-actions') as HTMLElement
              if (actions) actions.style.opacity = '1'
            }
          },
          onMouseLeave: () => {
            const row = document.querySelector(`[data-row-key="${record.id}"]`)
            if (row) {
              const actions = row.querySelector('.row-actions') as HTMLElement
              if (actions) actions.style.opacity = '0'
            }
          },
        })}
      />
    </div>
  )
}