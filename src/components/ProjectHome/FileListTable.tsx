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
import { buildStageMenuItems, parseStageMenuKey } from './stage-menu'
import EmptyState from '../common/EmptyState'

interface FileListTableProps {
  files: FileRecord[]
  classifying: number | null
  onClassify: (fileId: number) => void
  onDelete: (id: number) => void
  onStageChange: (fileId: number, newStage: string, subcategory?: string | null) => void
  selectedRowKeys: React.Key[]
  onSelectionChange: (keys: React.Key[]) => void
  onUpload: (file: File) => void
  selectedCategory?: string | null
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
  selectedCategory,
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
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
              <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-placeholder)' }}>{typeDesc}</div>
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
        if (!category) return <span style={{ color: 'var(--text-secondary)' }}>未分类</span>
        const style = getStageStyle(category)
        return (
          <Tag
            style={{
              color: style.color,
              backgroundColor: style.bg,
              border: 'none',
              borderRadius: 'var(--radius-full)',
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
              style={{ borderRadius: 'var(--radius-full)', padding: '2px 8px', fontSize: '12px' }}
            >
              有签字
            </Tag>
          ) : (
            <span style={{ color: 'var(--text-placeholder)', fontSize: '12px' }}>-</span>
          )}
        </div>
      ),
    },
    {
      title: '阶段',
      key: 'stage',
      width: 120,
      render: (_: unknown, record: FileRecord) => {
        const stageItems = buildStageMenuItems() as MenuProps['items']

        return (
          <Dropdown
            menu={{
              items: stageItems,
              onClick: ({ key }) => {
                const { stage, subcategory } = parseStageMenuKey(key)
                onStageChange(record.id, stage, subcategory)
              },
            }}
            trigger={['click']}
          >
            <Button
              type="text"
              size="small"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-1)',
                color: record.category ? getStageStyle(record.category).color : 'var(--text-secondary)',
              }}
            >
              {record.category ? (record.subcategory ? `${record.category} / ${record.subcategory}` : record.category) : '选择阶段'}
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
          style={{ display: 'flex', gap: '2px' }}
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
              title={selectedCategory && selectedCategory !== '所有文件'
                ? `当前阶段「${selectedCategory}」暂无文件`
                : '还没有文件'}
              description={selectedCategory && selectedCategory !== '所有文件'
                ? '上传相关文档到此阶段，或切换到其他阶段查看'
                : '上传文件开始项目管理'}
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
        onRow={() => ({})}
      />
    </div>
  )
}