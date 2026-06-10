import { useState, useEffect } from 'react'
import { Button, Input, Modal, message } from 'antd'
import { PlusOutlined, FolderOutlined } from '@ant-design/icons'
import { Project, DEFAULT_STAGES, FileRecord } from '../../types'
import { projectService } from '../../services/projectService'
import { fileService } from '../../services/fileService'

/** 项目阶段样式映射 */
const STAGE_ICONS: Record<string, string> = {
  '所有文件': '📋',
  '售前': '💼',
  '启动': '🚀',
  '需求': '📋',
  '方案': '📝',
  '构建': '🔨',
  '测试': '🧪',
  '上线': '🚀',
  '验收': '✅',
  '转客户成功': '🤝',
  '关闭': '📁',
  '未分类': '📂',
}

interface StageNavProps {
  project: Project
  selectedCategory: string | null
  onSelectCategory: (category: string) => void
}

export default function StageNav({ project, selectedCategory, onSelectCategory }: StageNavProps) {
  const [categories, setCategories] = useState<string[]>([])
  const [fileCounts, setFileCounts] = useState<Record<string, number>>({})
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editingCategory, setEditingCategory] = useState('')

  useEffect(() => {
    loadCategories()
    loadFileCounts()
  }, [project])

  /** 加载分类列表 */
  const loadCategories = async () => {
    if (project.category_type === 'stage') {
      // 使用新的11个阶段，前面加"所有文件"
      setCategories(['所有文件', ...DEFAULT_STAGES])
    } else {
      // 按内容或智能分类时，从文件中获取分类列表
      const result = await fileService.list(project.id)
      if (result.success && result.data) {
        const categoriesFromFiles = [...new Set(result.data.map((f: FileRecord) => f.category || '未分类'))]
        setCategories(['所有文件', ...categoriesFromFiles])
      } else {
        setCategories(['所有文件'])
      }
    }
  }

  /** 加载每个分类的文件数量 */
  const loadFileCounts = async () => {
    const result = await fileService.list(project.id)
    if (result.success && result.data) {
      const counts: Record<string, number> = { '所有文件': result.data.length }
      result.data.forEach((file: FileRecord) => {
        const category = file.category || '未分类'
        counts[category] = (counts[category] || 0) + 1
      })
      setFileCounts(counts)
    }
  }

  /** 添加分类 */
  const handleAddCategory = async () => {
    if (editingCategory && !categories.includes(editingCategory)) {
      const newCategories = [...categories, editingCategory]
      setCategories(newCategories)

      const result = await projectService.update(project.id, {
        custom_stages: JSON.stringify(newCategories)
      })

      if (!result.success) {
        message.error('保存分类失败')
      }

      setEditModalVisible(false)
      setEditingCategory('')
    }
  }

  /** 获取图标 */
  const getIcon = (category: string) => {
    return STAGE_ICONS[category] || '📂'
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4 h-full">
      {/* 标题 */}
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-base font-semibold m-0 flex items-center gap-2">
          <FolderOutlined />
          项目阶段
        </h4>
        <Button
          type="text"
          size="small"
          icon={<PlusOutlined />}
          onClick={() => setEditModalVisible(true)}
        />
      </div>

      {/* 阶段列表 */}
      <div className="space-y-2">
        {categories.map((category) => (
          <div
            key={category}
            className={`
              flex justify-between items-center p-3 rounded-lg cursor-pointer transition-all
              ${selectedCategory === category
                ? 'bg-blue-500 text-white'
                : 'bg-white hover:bg-gray-100'
              }
            `}
            onClick={() => onSelectCategory(category)}
          >
            <span className="flex items-center gap-2">
              <span>{getIcon(category)}</span>
              <span className="font-medium">{category}</span>
            </span>
            <span
              className={`
                px-2 py-1 rounded-full text-xs
                ${selectedCategory === category
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-200 text-gray-600'
                }
              `}
            >
              {fileCounts[category] || 0}
            </span>
          </div>
        ))}
      </div>

      {/* 底部按钮 */}
      <div className="mt-6 space-y-2">
        <Button type="primary" block icon={<PlusOutlined />}>
          上传文件
        </Button>
        <Button
          block
          icon={<FolderOutlined />}
          onClick={async () => {
            const result = await window.api.file.openFolder(project.id)
            if (!result.success) {
              message.error(result.error || '打开文件夹失败')
            }
          }}
        >
          打开文件夹
        </Button>
      </div>

      {/* 添加分类弹窗 */}
      <Modal
        title="添加分类"
        open={editModalVisible}
        onOk={handleAddCategory}
        onCancel={() => setEditModalVisible(false)}
        okText="添加"
        cancelText="取消"
      >
        <Input
          value={editingCategory}
          onChange={e => setEditingCategory(e.target.value)}
          placeholder="输入分类名称"
          onPressEnter={handleAddCategory}
        />
      </Modal>
    </div>
  )
}
