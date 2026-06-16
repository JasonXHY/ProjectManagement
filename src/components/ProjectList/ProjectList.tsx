import { useState, useEffect, useCallback } from 'react'
import { Button, Input, Modal, Select, Table, Space, message, Popconfirm, Tag, Radio } from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  DeleteOutlined,
  FolderOpenOutlined,
  EditOutlined,
  ProjectOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { Project, CategoryType, PROJECT_STATUS, Milestone } from '../../types'
import { projectService } from '../../services/projectService'
import { getStageStyle } from '../ProjectHome/projectHome.styles'
import { formatTimeRelative } from '../../utils/time'
import ProjectTimeline from './ProjectTimeline'

/** 解析里程碑JSON */
function parseMilestones(raw: string | null): Milestone[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
  } catch {
    // ignore
  }
  return []
}

/** 项目列表页面属性 */
interface ProjectListProps {
  onOpen?: (project: Project) => void
}

/**
 * 项目列表页面
 * 支持查看项目列表、新建项目、删除项目、搜索项目
 */
export default function ProjectList({ onOpen }: ProjectListProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('updated_at')
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card')
  const [modalVisible, setModalVisible] = useState(false)
  const [editStatusVisible, setEditStatusVisible] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [editingName, setEditingName] = useState<string>('')
  const [editingStatus, setEditingStatus] = useState<string>('')
  const [editingCategoryType, setEditingCategoryType] = useState<string>('stage')
  const [newProject, setNewProject] = useState({
    name: '',
    categoryType: 'stage' as CategoryType,
  })

  /** 加载项目列表 */
  const loadProjects = useCallback(async () => {
    let cancelled = false
    setLoading(true)
    try {
      const result = await projectService.list()
      if (cancelled) return
      if (result.success && result.data) {
        setProjects(result.data)
      } else {
        message.error(result.error || '加载项目列表失败')
      }
    } catch (error) {
      if (!cancelled) {
        message.error('加载项目列表失败')
        console.error(error)
      }
    } finally {
      if (!cancelled) setLoading(false)
    }
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  /** 创建项目 */
  const handleCreate = async () => {
    if (!newProject.name.trim()) {
      message.error('请输入项目名称')
      return
    }

    try {
      const result = await projectService.create(newProject.name, newProject.categoryType)
      if (result.success) {
        message.success('项目创建成功')
        setModalVisible(false)
        setNewProject({ name: '', categoryType: 'stage' })
        loadProjects()
      } else {
        message.error(result.error || '创建失败')
      }
    } catch (error) {
      message.error('创建失败')
      console.error(error)
    }
  }

  /** 删除项目 */
  const handleDelete = async (id: number) => {
    try {
      const result = await projectService.delete(id)
      if (result.success) {
        message.success('删除成功')
        loadProjects()
      } else {
        message.error(result.error || '删除失败')
      }
    } catch (error) {
      message.error('删除失败')
      console.error(error)
    }
  }

  /** 编辑项目 */
  const handleEditProject = async () => {
    if (!editingProject) return

    try {
      const result = await projectService.update(editingProject.id, {
        name: editingName,
        current_stage: editingStatus,
        category_type: editingCategoryType as 'stage' | 'content'
      })
      if (result.success) {
        message.success('项目更新成功')
        setEditStatusVisible(false)
        loadProjects()
      } else {
        message.error(result.error || '更新失败')
      }
    } catch (error) {
      message.error('更新失败')
      console.error(error)
    }
  }

  /** 搜索和筛选 */
  const filteredProjects = projects
    .filter((p) => {
      // 搜索过滤
      const matchesSearch = p.name.toLowerCase().includes(searchText.toLowerCase())
      // 状态过滤
      if (statusFilter === 'all') return matchesSearch
      return matchesSearch && p.current_stage === statusFilter
    })
    .sort((a, b) => {
      // 排序
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'created_at') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
      // 默认按更新时间
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })

  /** 表格列配置 */
  const columns: ColumnsType<Project> = [
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <span style={{ fontWeight: 500, color: '#111827' }}>{name}</span>
      ),
    },
    {
      title: '项目状态',
      dataIndex: 'current_stage',
      key: 'current_stage',
      width: 150,
      render: (stage: string) => {
        const style = getStageStyle(stage)
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
            {stage}
          </Tag>
        )
      },
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 180,
      render: (date: string) => {
        if (!date) return 'N/A'
        // SQLite的CURRENT_TIMESTAMP格式是 "YYYY-MM-DD HH:MM:SS"，需要添加T和Z来正确解析
        const d = new Date(date.replace(' ', 'T') + 'Z')
        const now = new Date()
        const diff = now.getTime() - d.getTime()
        const hours = Math.floor(diff / (1000 * 60 * 60))
        if (hours < 1) return '刚刚'
        if (hours < 24) return `${hours}小时前`
        const days = Math.floor(hours / 24)
        if (days < 7) return `${days}天前`
        return d.toLocaleDateString()
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: unknown, record: Project) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<FolderOpenOutlined />}
            onClick={() => onOpen?.(record)}
          >
            管理
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingProject(record)
              setEditingName(record.name)
              setEditingStatus(record.current_stage)
              setEditingCategoryType(record.category_type || 'stage')
              setEditStatusVisible(true)
            }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除该项目？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  /** 渲染卡片视图 */
  const renderCardView = () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '20px',
      }}
    >
      {filteredProjects.map((project, index) => {
        const stageStyle = getStageStyle(project.current_stage)
        const isPresale = project.current_stage === '售前'
        const isClosed = project.current_stage === '关闭'

        return (
          <div
            key={project.id}
            className="project-card"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-sm)',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'all var(--transition-normal)',
              animation: `fadeInUp 300ms ease-out ${index * 50}ms both`,
            }}
            onClick={() => onOpen?.(project)}
          >
            {/* 顶部彩色条 */}
            <div
              style={{
                height: '4px',
                background: isClosed
                  ? '#D1D5DB'
                  : isPresale
                    ? 'linear-gradient(90deg, #F59E0B, #FBBF24)'
                    : 'linear-gradient(90deg, #4F46E5, #6366F1)',
              }}
            />

            {/* 卡片内容 */}
            <div style={{ padding: 'var(--space-4) 20px 20px' }}>
              {/* 标题行 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: 'var(--space-3)',
                }}
              >
                <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {project.name}
                </div>
                <Tag
                  style={{
                    color: stageStyle.color,
                    backgroundColor: stageStyle.bg,
                    border: 'none',
                    borderRadius: 'var(--radius-full)',
                    padding: '2px 10px',
                    fontSize: '12px',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {project.current_stage}
                </Tag>
              </div>

              {/* 元信息 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: 'var(--space-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <FileTextOutlined style={{ width: '14px', textAlign: 'center' }} />
                  <span>文件</span>
                  <span style={{ margin: '0 4px', color: 'var(--border-default)' }}>|</span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '1px 8px',
                      background: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {project.category_type === 'content' ? '按内容分类' : '按阶段分类'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <ProjectOutlined style={{ width: '14px', textAlign: 'center' }} />
                  <span>当前阶段: {project.current_stage}</span>
                </div>
              </div>

              {/* 甘特图进度 */}
              {(() => {
                const milestones = parseMilestones(project.milestones)
                if (milestones.length === 0) return null
                return (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>进度</div>
                    <ProjectTimeline milestones={milestones} currentStage={project.current_stage} />
                  </div>
                )
              })()}

              {/* 底部 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: 'var(--space-3)',
                  borderTop: '1px solid var(--border-light)',
                }}
              >
                <span style={{ fontSize: '12px', color: 'var(--text-placeholder)' }}>
                  {formatTimeRelative(project.updated_at)}
                </span>
                <div
                  className="card-actions"
                  style={{ display: 'flex', gap: '4px' }}
                >
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    style={{ width: '30px', height: '30px' }}
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingProject(project)
                      setEditingStatus(project.current_stage)
                      setEditStatusVisible(true)
                    }}
                  />
                  <Popconfirm
                    title="确定删除该项目？"
                    onConfirm={(e) => {
                      e?.stopPropagation()
                      handleDelete(project.id)
                    }}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      style={{ width: '30px', height: '30px', color: '#EF4444' }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Popconfirm>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )

  /** 渲染空状态 */
  const isFiltering = searchText.trim() !== '' || statusFilter !== 'all'

  const renderEmptyState = () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px var(--space-6)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '80px',
          height: '80px',
          marginBottom: 'var(--space-6)',
          background: 'var(--bg-secondary)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-disabled)',
          fontSize: '32px',
        }}
      >
        {isFiltering ? <SearchOutlined /> : <FolderOpenOutlined />}
      </div>
      <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
        {isFiltering ? '未找到匹配的项目' : '还没有项目'}
      </div>
      <div style={{ fontSize: '14px', color: 'var(--text-placeholder)', marginBottom: 'var(--space-6)', maxWidth: '360px' }}>
        {isFiltering
          ? '尝试调整搜索关键词或筛选条件'
          : '创建你的第一个项目，开始用 AI 智能管理你的项目文件和文档'}
      </div>
      {isFiltering ? (
        <Button
          onClick={() => { setSearchText(''); setStatusFilter('all') }}
          style={{ height: '42px', padding: '0 var(--space-6)', fontSize: '15px' }}
        >
          清除筛选
        </Button>
      ) : (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalVisible(true)}
          style={{ height: '42px', padding: '0 var(--space-6)', fontSize: '15px' }}
        >
          创建第一个项目
        </Button>
      )}
    </div>
  )

  return (
    <div style={{ padding: 'var(--space-6)' }}>
      {/* 工具栏 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-5)',
          gap: 'var(--space-3)',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <Input
            placeholder="搜索项目名称..."
            prefix={<SearchOutlined style={{ color: 'var(--text-placeholder)' }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            style={{ width: '240px' }}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: '140px' }}
            options={[
              { value: 'all', label: '全部状态' },
              { value: '售前', label: '售前' },
              { value: '进行中', label: '进行中' },
              { value: '关闭', label: '关闭' },
            ]}
          />
          <Select
            value={sortBy}
            onChange={setSortBy}
            style={{ width: '160px' }}
            options={[
              { value: 'updated_at', label: '按更新时间排序' },
              { value: 'created_at', label: '按创建时间排序' },
              { value: 'name', label: '按项目名称排序' },
            ]}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Radio.Group
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            buttonStyle="solid"
            size="small"
          >
            <Radio.Button value="card">卡片</Radio.Button>
            <Radio.Button value="table">列表</Radio.Button>
          </Radio.Group>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
          >
            新建项目
          </Button>
        </div>
      </div>

      {/* 内容区域 */}
      {filteredProjects.length === 0 ? (
        renderEmptyState()
      ) : viewMode === 'card' ? (
        renderCardView()
      ) : (
        <Table
          columns={columns}
          dataSource={filteredProjects}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 个项目`,
            showQuickJumper: true,
          }}
        />
      )}

      {/* 新建项目弹窗 */}
      <Modal
        title="新建项目"
        open={modalVisible}
        onOk={handleCreate}
        onCancel={() => setModalVisible(false)}
        okText="创建"
        cancelText="取消"
        width={480}
      >
        <div style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#111827' }}>项目名称</div>
          <Input
            value={newProject.name}
            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
            placeholder="输入项目名称"
          />
        </div>
        <div>
          <div style={{ marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#111827' }}>文件分类方式</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { value: 'stage', title: '按阶段分类', desc: '默认 11 个项目阶段，文件自动归类到对应阶段' },
              { value: 'content', title: '按内容分类', desc: 'AI 自动识别文件内容，创建合适的分类类别' },
            ].map((option) => (
              <div
                key={option.value}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  border: `1px solid ${newProject.categoryType === option.value ? '#4F46E5' : '#E5E7EB'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: newProject.categoryType === option.value ? '#EEF2FF' : 'transparent',
                  transition: 'all 150ms',
                }}
                onClick={() => setNewProject({ ...newProject, categoryType: option.value as CategoryType })}
              >
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    border: `2px solid ${newProject.categoryType === option.value ? '#4F46E5' : '#E5E7EB'}`,
                    borderRadius: '50%',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 150ms',
                  }}
                >
                  {newProject.categoryType === option.value && (
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        background: '#4F46E5',
                        borderRadius: '50%',
                      }}
                    />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>{option.title}</div>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>{option.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* 编辑项目弹窗 */}
      <Modal
        title="编辑项目"
        open={editStatusVisible}
        onOk={handleEditProject}
        onCancel={() => setEditStatusVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        <div style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#111827' }}>项目名称</div>
          <Input
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            placeholder="输入项目名称"
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#111827' }}>项目状态</div>
          <Select
            value={editingStatus}
            onChange={setEditingStatus}
            style={{ width: '100%' }}
            options={PROJECT_STATUS.map(s => ({ value: s.value, label: s.label }))}
          />
        </div>
        <div>
          <div style={{ marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#111827' }}>分类方式</div>
          <Select
            value={editingCategoryType}
            onChange={setEditingCategoryType}
            style={{ width: '100%' }}
            options={[
              { value: 'stage', label: '按阶段分类' },
              { value: 'content', label: '按内容分类' },
            ]}
          />
        </div>
      </Modal>

      {/* 动画样式 */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
