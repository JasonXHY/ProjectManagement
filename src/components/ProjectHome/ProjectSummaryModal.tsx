import { memo } from 'react'
import { Modal, Tabs, Button, message } from 'antd'
import { StarOutlined, CopyOutlined } from '@ant-design/icons'
import { Project } from '../../types'
import { parseMetadata } from '../../utils/metadata'
import { formatAmount } from '../../utils/format'

interface Achievement {
  title: string
  description: string
  category: '功能亮点' | '量化指标' | '团队经验'
}

interface Retrospective {
  good: string[]
  improve: string[]
  lessons: string[]
}

interface Props {
  open: boolean
  onClose: () => void
  project: Project
}

function deriveAchievements(meta: Record<string, unknown>): Achievement[] {
  const achievements: Achievement[] = []
  const contractAmount = (meta.contract_amount as number) || 0
  const requirements = (meta.requirements as Array<{ name: string; status?: string }>) || []
  const keyIssues = (meta.key_issues as Array<{ status?: string }>) || []
  const completedReqs = requirements.filter(r => r.status === 'completed').length
  const resolvedIssues = keyIssues.filter(i => i.status === 'resolved').length

  if (contractAmount > 0) {
    achievements.push({
      title: `合同金额 ${formatAmount(contractAmount)}`,
      description: '项目合同总额已确认',
      category: '量化指标',
    })
  }
  if (requirements.length > 0) {
    achievements.push({
      title: `需求 ${completedReqs}/${requirements.length} 已完成`,
      description: `${completedReqs} 项需求已完成确认`,
      category: '量化指标',
    })
  }
  if (resolvedIssues > 0) {
    achievements.push({
      title: `已解决 ${resolvedIssues} 个关键问题`,
      description: '项目风险得到有效控制',
      category: '功能亮点',
    })
  }
  return achievements
}

function deriveRetrospective(meta: Record<string, unknown>): Retrospective {
  const keyIssues = (meta.key_issues as Array<{ text: string; priority?: string; status?: string }>) || []
  const opportunities = (meta.opportunities as Array<{ name: string }>) || []
  const good: string[] = []
  const improve: string[] = []
  const lessons: string[] = []

  const highIssues = keyIssues.filter(i => i.priority === 'high')
  if (highIssues.length > 0) improve.push(`存在 ${highIssues.length} 个高优先级问题需关注`)
  const resolvedCount = keyIssues.filter(i => i.status === 'resolved').length
  if (resolvedCount > 0) good.push(`已解决 ${resolvedCount} 个关键问题`)
  if (opportunities.length > 0) good.push(`识别到 ${opportunities.length} 个拓展商机`)
  if (keyIssues.length > 5) lessons.push('问题数量较多，建议加强前期风险评估')

  return { good, improve, lessons }
}

const ProjectSummaryModal = memo(function ProjectSummaryModal({
  open, onClose, project,
}: Props) {
  const meta = parseMetadata(project.metadata) as Record<string, unknown>
  const achievements = deriveAchievements(meta)
  const retrospective = deriveRetrospective(meta)

  const handleCopyReport = () => {
    let txt = '【项目成果】\n'
    achievements.forEach((a, i) => { txt += `${i + 1}. ${a.title} - ${a.description}\n` })
    txt += '\n【项目复盘】\n'
    if (retrospective.good.length) { txt += '做得好：\n'; retrospective.good.forEach(g => { txt += `- ${g}\n` }) }
    if (retrospective.improve.length) { txt += '待改进：\n'; retrospective.improve.forEach(g => { txt += `- ${g}\n` }) }
    if (retrospective.lessons.length) { txt += '经验教训：\n'; retrospective.lessons.forEach(g => { txt += `- ${g}\n` }) }
    window.api.clipboard.writeText(txt).then(() => message.success('已复制'))
  }

  const handleCopyPPT = () => {
    let md = '## 项目成果\n\n'
    achievements.forEach(a => { md += `- **${a.title}**：${a.description}\n` })
    md += '\n## 项目复盘\n\n'
    if (retrospective.good.length) { md += '### 做得好\n'; retrospective.good.forEach(g => { md += `- ${g}\n` }) }
    if (retrospective.improve.length) { md += '### 待改进\n'; retrospective.improve.forEach(g => { md += `- ${g}\n` }) }
    if (retrospective.lessons.length) { md += '### 经验教训\n'; retrospective.lessons.forEach(g => { md += `- ${g}\n` }) }
    window.api.clipboard.writeText(md).then(() => message.success('已复制为PPT大纲'))
  }

  const tabItems = [
    {
      key: 'achievements',
      label: '项目成果',
      children: achievements.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-placeholder)' }}>暂无项目成果，请先生成分析</div>
      ) : (
        <div>
          {achievements.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 0', borderBottom: i < achievements.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
              <StarOutlined style={{ color: 'var(--color-accent)', marginTop: '2px', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>{a.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{a.description}</div>
                <div style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 500, marginTop: '2px' }}>分类：{a.category}</div>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: 'retrospective',
      label: '项目复盘',
      children: (
        <div>
          {retrospective.good.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ color: 'var(--color-success)' }}>●</span> 做得好</div>
              {retrospective.good.map((item, i) => (
                <div key={i} style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '4px 0 4px 16px', position: 'relative' }}><span style={{ position: 'absolute', left: '4px', color: 'var(--text-placeholder)' }}>·</span>{item}</div>
              ))}
            </div>
          )}
          {retrospective.improve.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ color: 'var(--color-warning)' }}>●</span> 待改进</div>
              {retrospective.improve.map((item, i) => (
                <div key={i} style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '4px 0 4px 16px', position: 'relative' }}><span style={{ position: 'absolute', left: '4px', color: 'var(--text-placeholder)' }}>·</span>{item}</div>
              ))}
            </div>
          )}
          {retrospective.lessons.length > 0 && (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ color: 'var(--color-info)' }}>●</span> 经验教训</div>
              {retrospective.lessons.map((item, i) => (
                <div key={i} style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '4px 0 4px 16px', position: 'relative' }}><span style={{ position: 'absolute', left: '4px', color: 'var(--text-placeholder)' }}>·</span>{item}</div>
              ))}
            </div>
          )}
          {retrospective.good.length === 0 && retrospective.improve.length === 0 && retrospective.lessons.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-placeholder)' }}>暂无复盘数据</div>
          )}
        </div>
      ),
    },
  ]

  return (
    <Modal
      title="项目总结"
      open={open}
      onCancel={onClose}
      width={640}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button icon={<CopyOutlined />} onClick={handleCopyReport}>复制为汇报格式</Button>
          <Button icon={<CopyOutlined />} onClick={handleCopyPPT}>复制为PPT大纲</Button>
          <Button onClick={onClose}>关闭</Button>
        </div>
      }
    >
      <Tabs items={tabItems} />
    </Modal>
  )
})

export default ProjectSummaryModal