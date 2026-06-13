import { memo } from 'react'
import { Timeline, Tag, Tooltip } from 'antd'
import { StarFilled } from '@ant-design/icons'
import { Milestone } from '../../types'

interface ProjectTimelineProps {
  milestones: Milestone[]
  currentStage?: string
}

const STAGE_STYLE: Record<string, { color: string; bg: string }> = {
  '售前': { color: '#92400E', bg: '#FEF3C7' },
  '进行中': { color: '#553c9a', bg: '#e9d8fd' },
  '关闭': { color: '#374151', bg: '#F3F4F6' },
}

const KEY_NODE_KEYWORDS = ['上线单', '验收单', '蓝图确认', '签署', '合同', '验收', '上线']

function isKeyNode(milestone: Milestone): boolean {
  return KEY_NODE_KEYWORDS.some((kw) => milestone.title.includes(kw))
}

const ProjectTimeline = memo(function ProjectTimeline({ milestones, currentStage }: ProjectTimelineProps) {
  if (!milestones || milestones.length === 0) {
    return (
      <div style={{ fontSize: '12px', color: '#9CA3AF', padding: '4px 0' }}>
        暂无里程碑数据
      </div>
    )
  }

  const sorted = [...milestones].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const stageStyle = currentStage ? STAGE_STYLE[currentStage] : null

  return (
    <div style={{ padding: '4px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        {currentStage && stageStyle ? (
          <Tag
            style={{
              color: stageStyle.color,
              backgroundColor: stageStyle.bg,
              border: 'none',
              borderRadius: '9999px',
              padding: '2px 12px',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            {currentStage}
          </Tag>
        ) : (
          <span style={{ fontSize: '13px', color: '#6B7280' }}>暂无阶段</span>
        )}
      </div>

      <Timeline
        items={sorted.map((m) => {
          const key = isKeyNode(m)
          const dateStr = m.date
          const displayDate = dateStr.length >= 10 ? dateStr.substring(5, 10) : dateStr

          return {
            color: key ? '#FAAD14' : '#4F46E5',
            children: (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px', color: '#374151' }}>{m.title}</span>
                {key && (
                  <Tooltip title="关键节点">
                    <StarFilled style={{ color: '#FAAD14', fontSize: '14px' }} />
                  </Tooltip>
                )}
                <span style={{ fontSize: '11px', color: '#9CA3AF', marginLeft: 'auto' }}>
                  {displayDate}
                </span>
              </div>
            ),
          }
        })}
      />
    </div>
  )
})

export default ProjectTimeline
