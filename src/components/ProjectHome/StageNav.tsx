import { useState, useEffect } from 'react'
import { Menu, Button, Input, Modal, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { Project, DEFAULT_STAGES } from '../../types'
import { projectService } from '../../services/projectService'

interface StageNavProps {
  project: Project
  selectedCategory: string | null
  onSelectCategory: (category: string) => void
}

export default function StageNav({ project, selectedCategory, onSelectCategory }: StageNavProps) {
  const [categories, setCategories] = useState<string[]>([])
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editingCategory, setEditingCategory] = useState('')

  useEffect(() => {
    loadCategories()
  }, [project])

  const loadCategories = async () => {
    if (project.category_type === 'stage') {
      try {
        const stages = project.custom_stages
          ? JSON.parse(project.custom_stages)
          : DEFAULT_STAGES
        setCategories(stages)
      } catch {
        setCategories(DEFAULT_STAGES)
      }
    } else {
      // 按内容或智能分类时，从文件中获取分类列表
      setCategories(['所有文件']) // 临时实现
    }
  }

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

  const menuItems = categories.map(cat => ({
    key: cat,
    label: cat
  }))

  return (
    <div style={{ width: 200, borderRight: '1px solid #f0f0f0', padding: '16px 0' }}>
      <div style={{ padding: '0 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>分类</strong>
        <Button
          type="text"
          size="small"
          icon={<PlusOutlined />}
          onClick={() => setEditModalVisible(true)}
        />
      </div>
      <Menu
        mode="inline"
        selectedKeys={selectedCategory ? [selectedCategory] : []}
        items={menuItems}
        onClick={({ key }) => onSelectCategory(key)}
      />

      <Modal
        title="添加分类"
        open={editModalVisible}
        onOk={handleAddCategory}
        onCancel={() => setEditModalVisible(false)}
      >
        <Input
          value={editingCategory}
          onChange={e => setEditingCategory(e.target.value)}
          placeholder="输入分类名称"
        />
      </Modal>
    </div>
  )
}
