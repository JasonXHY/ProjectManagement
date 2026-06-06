import { useState, useEffect } from 'react'
import { Layout, Button, Space, Typography } from 'antd'
import { ArrowLeftOutlined, MessageOutlined } from '@ant-design/icons'
import { Project, FileRecord } from '../../types'
import StageNav from './StageNav'
import FileDropZone from './FileDropZone'
import SummaryCards from './SummaryCards'
import { fileService } from '../../services/fileService'

const { Sider, Content } = Layout
const { Title } = Typography

interface ProjectHomeProps {
  project: Project
  onBack: () => void
  onChat: () => void
}

export default function ProjectHome({ project, onBack, onChat }: ProjectHomeProps) {
  const [files, setFiles] = useState<FileRecord[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  useEffect(() => {
    loadFiles()
  }, [project, selectedCategory])

  const loadFiles = async () => {
    let result
    if (selectedCategory && selectedCategory !== '所有文件') {
      result = await fileService.listByCategory(project.id, selectedCategory)
    } else {
      result = await fileService.list(project.id)
    }

    if (result.success && result.data) {
      setFiles(result.data)
    }
  }

  return (
    <div>
      {/* 顶部导航 */}
      <Space className="mb-4">
        <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
          返回项目列表
        </Button>
        <Title level={3} className="!mb-0">
          {project.name}
        </Title>
        <Button icon={<MessageOutlined />} onClick={onChat}>
          AI对话
        </Button>
      </Space>

      {/* 主要内容区 */}
      <Layout style={{ minHeight: 'calc(100vh - 200px)' }}>
        <Sider width={200} style={{ background: '#fff' }}>
          <StageNav
            project={project}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </Sider>
        <Content style={{ padding: 24 }}>
          <SummaryCards projectId={project.id} fileCount={files.length} />
          <FileDropZone
            projectId={project.id}
            files={files}
            onFilesChange={loadFiles}
          />
        </Content>
      </Layout>
    </div>
  )
}
