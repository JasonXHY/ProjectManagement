import { Card, Col, Row, Statistic, Button, message } from 'antd'
import { FileTextOutlined, BugOutlined, ClockCircleOutlined, RobotOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { aiService } from '../../services/aiService'

interface SummaryCardsProps {
  projectId: number
  fileCount: number
}

export default function SummaryCards({ projectId, fileCount }: SummaryCardsProps) {
  const [analyzing, setAnalyzing] = useState(false)

  const handleAnalyze = async () => {
    setAnalyzing(true)
    const result = await aiService.analyze(projectId)
    setAnalyzing(false)

    if (result.success) {
      message.success('分析完成')
    } else {
      message.error(result.error || '分析失败')
    }
  }

  return (
    <Row gutter={16} style={{ marginBottom: 24 }}>
      <Col span={6}>
        <Card>
          <Statistic title="文件数量" value={fileCount} prefix={<FileTextOutlined />} />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic title="关键问题" value={0} prefix={<BugOutlined />} />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic title="待处理" value={0} prefix={<ClockCircleOutlined />} />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Button
            type="primary"
            icon={<RobotOutlined />}
            loading={analyzing}
            onClick={handleAnalyze}
            block
          >
            生成/更新摘要
          </Button>
        </Card>
      </Col>
    </Row>
  )
}
