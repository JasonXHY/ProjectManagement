import { Card, Col, Row, Statistic, Button, message, Modal } from 'antd'
import {
  FileTextOutlined,
  BugOutlined,
  ClockCircleOutlined,
  RobotOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import { useState } from 'react'
import { aiService } from '../../services/aiService'

interface SummaryCardsProps {
  projectId: number
  fileCount: number
}

export default function SummaryCards({ projectId, fileCount }: SummaryCardsProps) {
  const [analyzing, setAnalyzing] = useState(false)
  const [summaryVisible, setSummaryVisible] = useState(false)
  const [summaryContent, setSummaryContent] = useState('')

  const handleAnalyze = async () => {
    setAnalyzing(true)
    try {
      const result = await aiService.analyze(projectId)
      if (result.success) {
        message.success('分析完成')
        // 加载摘要内容
        loadSummary()
      } else {
        message.error(result.error || '分析失败')
      }
    } catch (error) {
      message.error('分析失败')
      console.error(error)
    } finally {
      setAnalyzing(false)
    }
  }

  const loadSummary = async () => {
    try {
      // 通过IPC读取摘要文件
      const result = await window.api.file.getSummary(projectId)
      if (result.success && result.data) {
        setSummaryContent(result.data)
        setSummaryVisible(true)
      } else {
        message.info('暂无摘要，请先生成')
      }
    } catch (error) {
      message.info('暂无摘要，请先生成')
    }
  }

  return (
    <>
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title="文件数量"
              value={fileCount}
              prefix={<FileTextOutlined className="text-blue-500" />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title="关键问题"
              value={0}
              prefix={<BugOutlined className="text-red-500" />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title="待处理"
              value={0}
              prefix={<ClockCircleOutlined className="text-yellow-500" />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="shadow-sm hover:shadow-md transition-shadow flex gap-2">
            <Button
              icon={<EyeOutlined />}
              onClick={loadSummary}
              className="flex-1"
            >
              查看摘要
            </Button>
            <Button
              type="primary"
              icon={<RobotOutlined />}
              loading={analyzing}
              onClick={handleAnalyze}
              className="flex-1"
            >
              生成/更新
            </Button>
          </Card>
        </Col>
      </Row>

      {/* 摘要查看弹窗 */}
      <Modal
        title="项目摘要"
        open={summaryVisible}
        onCancel={() => setSummaryVisible(false)}
        footer={null}
        width={800}
      >
        <div className="whitespace-pre-wrap max-h-[60vh] overflow-auto">
          {summaryContent || '暂无摘要'}
        </div>
      </Modal>
    </>
  )
}
