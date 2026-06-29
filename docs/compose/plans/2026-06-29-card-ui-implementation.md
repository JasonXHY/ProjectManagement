# 卡片UI修复 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复8个卡片UI问题（P1-P6, P9, P10），对齐mockup设计

**Architecture:** 新增5个Modal组件，改造4个现有组件，添加Electron IPC clipboard桥接。每个问题独立实施，无交叉依赖。

**Tech Stack:** React 19 + TypeScript + Ant Design 6（Modal/Tabs/Checkbox/Timeline/Button/message）+ Electron IPC

## Global Constraints

- 工作目录：C:\NewProject
- 测试命令：`npm test`（426测试必须全通过）
- TypeScript编译：`npm run electron:compile`
- Git分支：main，每次完成一个Task后commit
- 文件路径前缀：`src/components/ProjectHome/` 为组件目录
- 数据存储：metadata为JSON字符串，通过`parseMetadata()`读取
- 样式：使用CSS变量（var(--text-primary)等），不新增CSS文件
- Ant Design v6：Timeline用`items`+`content`（非`children`）

---

### Task 0: Electron IPC Clipboard桥接

**Covers:** P1复制功能、P3复制功能的基础依赖

**Files:**
- Modify: `electron/preload.ts:9-23`（添加clipboardWriteText方法）
- Modify: `electron/main.ts`（添加clipboard:writeText handler）
- Modify: `src/types/windowApi.ts`（添加类型声明）

**Interfaces:**
- Produces: `window.api.clipboardWriteText(text: string) => Promise<void>`

- [ ] **Step 1: 在preload.ts添加clipboard方法**

在`contextBridge.exposeInMainWorld('api', {...})`的`project`块后面添加：

```typescript
clipboardWriteText: (text: string) => ipcRenderer.invoke('clipboard:writeText', text),
```

- [ ] **Step 2: 在主进程添加handler**

在`electron/main.ts`中，找到现有的`ipcMain.handle`调用区域，添加：

```typescript
import { clipboard } from 'electron'

ipcMain.handle('clipboard:writeText', (_event, text: string) => {
  clipboard.writeText(text)
})
```

注意：检查main.ts是否已经import了electron模块中的clipboard。如果没有，需要在文件顶部的import中添加。

- [ ] **Step 3: 在windowApi.ts添加类型**

在`src/types/windowApi.ts`的WindowApi接口中添加：

```typescript
clipboardWriteText: (text: string) => Promise<void>
```

- [ ] **Step 4: 编译验证**

Run: `npm run electron:compile`
Expected: 编译通过，无错误

- [ ] **Step 5: Commit**

```bash
git add electron/preload.ts electron/main.ts src/types/windowApi.ts
git commit -m "feat: add Electron IPC clipboard bridge for copy functionality"
```

---

### Task 1: P2 - 拓展商机弹窗

**Covers:** P2

**Files:**
- Create: `src/components/ProjectHome/OpportunityDetailModal.tsx`
- Modify: `src/components/ProjectHome/cards/OpportunityCard.tsx`

**Interfaces:**
- Consumes: `Opportunity` type from `src/types/index.ts`
- Produces: `<OpportunityDetailModal open onClose opportunities />`

- [ ] **Step 1: 创建OpportunityDetailModal.tsx**

```typescript
import { memo } from 'react'
import { Modal, Tag } from 'antd'
import { StarOutlined } from '@ant-design/icons'

interface Opportunity {
  name: string
  description?: string
  solution?: string
  status?: 'planned' | 'confirmed' | 'in-progress'
  statusText?: string
}

interface Props {
  open: boolean
  onClose: () => void
  opportunities: Opportunity[]
}

const statusConfig: Record<string, { color: string; label: string }> = {
  planned: { color: 'default', label: '规划中' },
  confirmed: { color: 'processing', label: '已确认' },
  'in-progress': { color: 'success', label: '进行中' },
}

const OpportunityDetailModal = memo(function OpportunityDetailModal({
  open,
  onClose,
  opportunities,
}: Props) {
  return (
    <Modal
      title="拓展商机"
      open={open}
      onCancel={onClose}
      footer={null}
      width={640}
    >
      {opportunities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-placeholder)' }}>
          暂无拓展商机
        </div>
      ) : (
        <div>
          {opportunities.map((opp, index) => {
            const statusInfo = statusConfig[opp.status || 'planned'] || statusConfig.planned
            return (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '12px 0',
                  borderBottom: index < opportunities.length - 1 ? '1px solid var(--border-light)' : 'none',
                }}
              >
                <StarOutlined style={{ color: 'var(--color-accent)', marginTop: '2px', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>{opp.name}</div>
                  {opp.description && (
                    <div style={{ fontSize: '12px', color: 'var(--text-placeholder)', marginBottom: '2px' }}>
                      {opp.description}
                    </div>
                  )}
                  {opp.solution && (
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      方案：{opp.solution}
                    </div>
                  )}
                </div>
                <Tag color={statusInfo.color}>{statusInfo.label}</Tag>
              </div>
            )
          })}
        </div>
      )}
    </Modal>
  )
})

export default OpportunityDetailModal
```

- [ ] **Step 2: 修改OpportunityCard.tsx添加弹窗**

在OpportunityCard.tsx中：
1. 添加`useState`导入和modal state
2. 导入OpportunityDetailModal
3. 卡片header添加"查看全部 →"按钮
4. 渲染OpportunityDetailModal

```typescript
import { useState } from 'react'
import { Project, FileRecord, Opportunity } from '../../../types'
import { parseMetadata } from '../../../utils/metadata'
import OpportunityDetailModal from '../OpportunityDetailModal'

interface Props { project: Project; allFiles?: FileRecord[] }

export default function OpportunityCard({ project }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const meta = parseMetadata(project.metadata)
  const opportunities = (meta.opportunities as Opportunity[]) || []

  return (
    <>
      <div className="feature-card">
        <div className="fc-header">
          <div className="fc-title-row">
            <div className="fc-icon" style={{background:'#FEF3C7',color:'#F59E0B'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/></svg>
            </div>
            <span className="fc-title">拓展商机</span>
          </div>
          <button className="fc-action" onClick={() => setModalOpen(true)}>查看全部 →</button>
        </div>
        <div className="fc-body">
          {opportunities.length === 0 ? (
            <div style={{fontSize:12,color:'var(--text-placeholder)',padding:'8px 0'}}>暂无拓展商机</div>
          ) : opportunities.slice(0, 3).map((opp, i) => (
            <div key={i} className="opp-row">
              <div className="opp-icon" style={{background:'#FEF3C7',color:'#F59E0B',borderRadius:'50%',width:'24px',height:'24px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/></svg>
              </div>
              <div className="opp-main">
                <div className="opp-name">{opp.name}</div>
                {opp.description && <div className="opp-desc">{opp.description}</div>}
              </div>
              <span className={`opp-tag ${opp.status || 'planned'}`}>{opp.statusText || '规划中'}</span>
            </div>
          ))}
        </div>
      </div>

      <OpportunityDetailModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        opportunities={opportunities}
      />
    </>
  )
}
```

- [ ] **Step 3: 编译验证**

Run: `npm run electron:compile`
Expected: 编译通过

- [ ] **Step 4: 运行测试**

Run: `npm test`
Expected: 426测试全通过

- [ ] **Step 5: Commit**

```bash
git add src/components/ProjectHome/OpportunityDetailModal.tsx src/components/ProjectHome/cards/OpportunityCard.tsx
git commit -m "feat(P2): add OpportunityDetailModal with full list and solution field"
```

---

### Task 2: P5 - 关键问题弹窗（独立IssueDetailModal）

**Covers:** P5

**Files:**
- Create: `src/components/ProjectHome/IssueDetailModal.tsx`
- Modify: `src/components/ProjectHome/cards/IssueCard.tsx`

**Interfaces:**
- Consumes: `Issue` type from `src/types/index.ts`
- Produces: `<IssueDetailModal open onClose issues onIssuesChange />`

- [ ] **Step 1: 创建IssueDetailModal.tsx**

```typescript
import { memo, useState, useEffect } from 'react'
import { Modal, Checkbox } from 'antd'

interface Issue {
  text: string
  priority?: string
  status?: string
  source?: string
}

interface Props {
  open: boolean
  onClose: () => void
  issues: Issue[]
  onIssuesChange?: (issues: Issue[]) => void
}

const priorityColors: Record<string, string> = {
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#3B82F6',
}

const IssueDetailModal = memo(function IssueDetailModal({
  open,
  onClose,
  issues,
  onIssuesChange,
}: Props) {
  const [localIssues, setLocalIssues] = useState<Issue[]>(issues)

  useEffect(() => {
    setLocalIssues(issues)
  }, [issues])

  const handleToggle = (index: number) => {
    const updated = [...localIssues]
    updated[index] = {
      ...updated[index],
      status: updated[index].status === 'resolved' ? 'open' : 'resolved',
    }
    setLocalIssues(updated)
    onIssuesChange?.(updated)
  }

  return (
    <Modal
      title="关键问题"
      open={open}
      onCancel={onClose}
      footer={null}
      width={640}
    >
      {localIssues.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-placeholder)' }}>
          暂无关键问题
        </div>
      ) : (
        <div>
          {localIssues.map((issue, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 0',
                borderBottom: i < localIssues.length - 1 ? '1px solid var(--border-light)' : 'none',
              }}
            >
              <Checkbox
                checked={issue.status === 'resolved'}
                onChange={() => handleToggle(i)}
              />
              <span
                style={{
                  flex: 1,
                  fontSize: '14px',
                  textDecoration: issue.status === 'resolved' ? 'line-through' : 'none',
                  color: issue.status === 'resolved' ? 'var(--text-placeholder)' : 'var(--text-primary)',
                }}
              >
                {issue.text}
              </span>
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: priorityColors[issue.priority || 'medium'],
                  flexShrink: 0,
                }}
              />
              {issue.source && (
                <span style={{ fontSize: '11px', color: 'var(--text-placeholder)', flexShrink: 0 }}>
                  {issue.source}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
})

export default IssueDetailModal
```

- [ ] **Step 2: 修改IssueCard.tsx**

替换ListDetailModal为IssueDetailModal，添加onIssuesChange回调保存到metadata：

```typescript
import { useState } from 'react'
import { Project, FileRecord, Issue } from '../../../types'
import IssueDetailModal from '../IssueDetailModal'
import { parseMetadata } from '../../../utils/metadata'

interface Props { project: Project; allFiles?: FileRecord[] }

export default function IssueCard({ project }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const meta = parseMetadata(project.metadata)
  const issues = (meta.key_issues as Issue[]) || []

  const handleIssuesChange = (updatedIssues: Issue[]) => {
    const updatedMeta = parseMetadata(project.metadata)
    updatedMeta.key_issues = updatedIssues
    window.api.project.update(project.id, { metadata: JSON.stringify(updatedMeta) })
  }

  return (
    <>
      <div className="feature-card">
        <div className="fc-header">
          <div className="fc-title-row">
            <div className="fc-icon" style={{background:'#FEE2E2',color:'#EF4444'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <span className="fc-title">关键问题</span>
            <span className="fc-subtitle">· {issues.length} 个</span>
          </div>
          <button className="fc-action" onClick={() => setModalOpen(true)}>管理 →</button>
        </div>
        <div className="fc-body">
          {issues.length === 0 ? (
            <div style={{fontSize:12,color:'var(--text-placeholder)',padding:'8px 0'}}>暂无关键问题</div>
          ) : issues.slice(0, 3).map((issue, i) => (
            <div key={i} className="issue-row">
              <div className={`issue-dot ${issue.priority || 'medium'}`} />
              <span className="issue-text">{issue.text || ''}</span>
              <span className={`issue-tag ${issue.status === 'resolved' ? 'resolved' : 'open'}`}>
                {issue.status === 'resolved' ? '已解决' : '未解决'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <IssueDetailModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        issues={issues}
        onIssuesChange={handleIssuesChange}
      />
    </>
  )
}
```

- [ ] **Step 3: 编译验证**

Run: `npm run electron:compile`
Expected: 编译通过

- [ ] **Step 4: 运行测试**

Run: `npm test`
Expected: 426测试全通过

- [ ] **Step 5: Commit**

```bash
git add src/components/ProjectHome/IssueDetailModal.tsx src/components/ProjectHome/cards/IssueCard.tsx
git commit -m "feat(P5): add IssueDetailModal with checkbox toggle and status persistence"
```

---

### Task 3: P1 - 项目总结弹窗

**Covers:** P1

**Files:**
- Create: `src/components/ProjectHome/ProjectSummaryModal.tsx`
- Modify: `src/components/ProjectHome/cards/SummaryCard.tsx`

**Interfaces:**
- Consumes: `Project` type, `window.api.clipboardWriteText` (from Task 0)
- Produces: `<ProjectSummaryModal open onClose project />`

- [ ] **Step 1: 创建ProjectSummaryModal.tsx**

```typescript
import { memo } from 'react'
import { Modal, Tabs, Button, message, Tag } from 'antd'
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
      description: `项目合同总额已确认`,
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
  if (highIssues.length > 0) {
    improve.push(`存在 ${highIssues.length} 个高优先级问题需关注`)
  }
  const resolvedCount = keyIssues.filter(i => i.status === 'resolved').length
  if (resolvedCount > 0) {
    good.push(`已解决 ${resolvedCount} 个关键问题`)
  }
  if (opportunities.length > 0) {
    good.push(`识别到 ${opportunities.length} 个拓展商机`)
  }
  if (keyIssues.length > 5) {
    lessons.push('问题数量较多，建议加强前期风险评估')
  }

  return { good, improve, lessons }
}

const ProjectSummaryModal = memo(function ProjectSummaryModal({
  open,
  onClose,
  project,
}: Props) {
  const meta = parseMetadata(project.metadata) as Record<string, unknown>
  const achievements = deriveAchievements(meta)
  const retrospective = deriveRetrospective(meta)

  const handleCopyReport = () => {
    let txt = '【项目成果】\n'
    achievements.forEach((a, i) => {
      txt += `${i + 1}. ${a.title} - ${a.description}\n`
    })
    txt += '\n【项目复盘】\n'
    if (retrospective.good.length) {
      txt += '做得好：\n'
      retrospective.good.forEach(g => { txt += `- ${g}\n` })
    }
    if (retrospective.improve.length) {
      txt += '待改进：\n'
      retrospective.improve.forEach(g => { txt += `- ${g}\n` })
    }
    if (retrospective.lessons.length) {
      txt += '经验教训：\n'
      retrospective.lessons.forEach(g => { txt += `- ${g}\n` })
    }
    window.api.clipboardWriteText(txt).then(() => message.success('已复制'))
  }

  const handleCopyPPT = () => {
    let md = '## 项目成果\n\n'
    achievements.forEach(a => {
      md += `- **${a.title}**：${a.description}\n`
    })
    md += '\n## 项目复盘\n\n'
    if (retrospective.good.length) {
      md += '### 做得好\n'
      retrospective.good.forEach(g => { md += `- ${g}\n` })
    }
    if (retrospective.improve.length) {
      md += '### 待改进\n'
      retrospective.improve.forEach(g => { md += `- ${g}\n` })
    }
    if (retrospective.lessons.length) {
      md += '### 经验教训\n'
      retrospective.lessons.forEach(g => { md += `- ${g}\n` })
    }
    window.api.clipboardWriteText(md).then(() => message.success('已复制为PPT大纲'))
  }

  const tabItems = [
    {
      key: 'achievements',
      label: '项目成果',
      children: achievements.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-placeholder)' }}>
          暂无项目成果，请先生成分析
        </div>
      ) : (
        <div>
          {achievements.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 0', borderBottom: i < achievements.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
              <StarOutlined style={{ color: 'var(--color-accent)', marginTop: '2px', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>{a.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{a.description}</div>
                <div style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 500, marginTop: '2px' }}>
                  分类：{a.category}
                </div>
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
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: 'var(--color-success)' }}>●</span> 做得好
              </div>
              {retrospective.good.map((item, i) => (
                <div key={i} style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '4px 0 4px 16px', position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '4px', color: 'var(--text-placeholder)' }}>·</span>
                  {item}
                </div>
              ))}
            </div>
          )}
          {retrospective.improve.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: 'var(--color-warning)' }}>●</span> 待改进
              </div>
              {retrospective.improve.map((item, i) => (
                <div key={i} style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '4px 0 4px 16px', position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '4px', color: 'var(--text-placeholder)' }}>·</span>
                  {item}
                </div>
              ))}
            </div>
          )}
          {retrospective.lessons.length > 0 && (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: 'var(--color-info)' }}>●</span> 经验教训
              </div>
              {retrospective.lessons.map((item, i) => (
                <div key={i} style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '4px 0 4px 16px', position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '4px', color: 'var(--text-placeholder)' }}>·</span>
                  {item}
                </div>
              ))}
            </div>
          )}
          {retrospective.good.length === 0 && retrospective.improve.length === 0 && retrospective.lessons.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-placeholder)' }}>
              暂无复盘数据
            </div>
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
```

- [ ] **Step 2: 修改SummaryCard.tsx**

添加弹窗触发和渲染：

```typescript
import { useState } from 'react'
import { Project, FileRecord } from '../../../types'
import { parseMetadata } from '../../../utils/metadata'
import ProjectSummaryModal from '../ProjectSummaryModal'

interface Props { project: Project; allFiles?: FileRecord[] }

export default function SummaryCard({ project }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const summary = (parseMetadata(project.metadata) as Record<string, unknown>).project_overview as string || ''

  return (
    <>
      <div className="feature-card">
        <div className="fc-header">
          <div className="fc-title-row">
            <div className="fc-icon" style={{background:'#F3E8FF',color:'#8B5CF6'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            </div>
            <span className="fc-title">项目总结</span>
          </div>
          <button className="fc-action" onClick={() => setModalOpen(true)}>查看全部 →</button>
        </div>
        <div className="fc-body">
          {summary ? (
            <div style={{fontSize:13,color:'var(--text-secondary)',lineHeight:1.6,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:expanded?'unset':4,WebkitBoxOrient:'vertical'}}>
              {summary}
            </div>
          ) : (
            <div style={{fontSize:12,color:'var(--text-placeholder)',padding:'8px 0'}}>暂无项目总结</div>
          )}
          {summary && summary.length > 100 && (
            <button className="fc-more" onClick={() => setExpanded(!expanded)}>
              {expanded ? '收起' : '展开全部'}
            </button>
          )}
        </div>
      </div>

      <ProjectSummaryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        project={project}
      />
    </>
  )
}
```

- [ ] **Step 3: 编译验证**

Run: `npm run electron:compile`
Expected: 编译通过

- [ ] **Step 4: 运行测试**

Run: `npm test`
Expected: 426测试全通过

- [ ] **Step 5: Commit**

```bash
git add src/components/ProjectHome/ProjectSummaryModal.tsx src/components/ProjectHome/cards/SummaryCard.tsx
git commit -m "feat(P1): add ProjectSummaryModal with achievements/retrospective tabs and copy"
```

---

### Task 4: P4 - 需求跟踪弹窗行内展开

**Covers:** P4

**Files:**
- Modify: `src/components/ProjectHome/RequirementDetailModal.tsx`

**Interfaces:**
- Consumes: `Requirement` type（需扩展source/solution/timeline字段）
- Produces: 带行内展开的弹窗

- [ ] **Step 1: 修改RequirementDetailModal.tsx**

```typescript
import { memo, useState } from 'react'
import { Modal, Tag, Timeline } from 'antd'
import { DownOutlined, UpOutlined } from '@ant-design/icons'

interface TimelineNode {
  title: string
  date: string
  source?: string
}

interface Requirement {
  name: string
  status: string
  detail?: string
  source?: string
  solution?: string
  result?: string
  timeline?: TimelineNode[]
}

interface RequirementDetailModalProps {
  open: boolean
  onClose: () => void
  requirements: Requirement[]
}

const statusConfig: Record<string, { color: string; label: string }> = {
  pending: { color: 'default', label: '待确认' },
  progress: { color: 'processing', label: '进行中' },
  completed: { color: 'success', label: '已完成' },
  delayed: { color: 'warning', label: '延期' },
  closed: { color: 'default', label: '已关闭' },
}

const RequirementDetailModal = memo(function RequirementDetailModal({
  open,
  onClose,
  requirements,
}: RequirementDetailModalProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null)

  return (
    <Modal
      title="需求管理"
      open={open}
      onCancel={onClose}
      footer={null}
      width={640}
    >
      {requirements.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-placeholder)' }}>
          暂无需求记录
        </div>
      ) : (
        <div>
          {requirements.map((req, index) => {
            const statusInfo = statusConfig[req.status] || statusConfig.pending
            const isExpanded = expandedId === index

            return (
              <div key={index}>
                <div
                  style={{
                    padding: '12px 0',
                    borderBottom: index < requirements.length - 1 ? '1px solid var(--border-light)' : 'none',
                    cursor: 'pointer',
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : index)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>{req.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Tag color={statusInfo.color}>{statusInfo.label}</Tag>
                      <span style={{ fontSize: '12px', color: 'var(--text-placeholder)' }}>
                        {isExpanded ? <UpOutlined /> : <DownOutlined />}
                      </span>
                    </div>
                  </div>
                  {req.detail && (
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      {req.detail}
                    </div>
                  )}
                  {req.source && (
                    <div style={{ fontSize: '12px', color: 'var(--text-placeholder)' }}>
                      来源: {req.source}
                    </div>
                  )}
                </div>

                {isExpanded && (
                  <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '12px 16px', margin: '4px 0 4px 26px' }}>
                    {req.solution && (
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>方案</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{req.solution}</div>
                      </div>
                    )}
                    {req.result && (
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>结果</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{req.result}</div>
                      </div>
                    )}
                    {req.timeline && req.timeline.length > 0 && (
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>时间轴</div>
                        <Timeline
                          size="small"
                          items={req.timeline.map(node => ({
                            content: (
                              <div>
                                <div style={{ fontSize: '13px' }}>{node.title}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-placeholder)' }}>
                                  {node.date} {node.source && `· ${node.source}`}
                                </div>
                              </div>
                            ),
                          }))}
                        />
                      </div>
                    )}
                    {!req.solution && !req.result && (!req.timeline || req.timeline.length === 0) && (
                      <div style={{ fontSize: '12px', color: 'var(--text-placeholder)' }}>
                        暂无详细信息
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Modal>
  )
})

export default RequirementDetailModal
```

- [ ] **Step 2: 编译验证**

Run: `npm run electron:compile`
Expected: 编译通过

- [ ] **Step 3: 运行测试**

Run: `npm test`
Expected: 426测试全通过

- [ ] **Step 4: Commit**

```bash
git add src/components/ProjectHome/RequirementDetailModal.tsx
git commit -m "feat(P4): add inline expand with timeline to RequirementDetailModal"
```

---

### Task 5: P6 - 签字追踪上传按钮

**Covers:** P6

**Files:**
- Modify: `src/components/ProjectHome/SignatureDetailModal.tsx`

**Interfaces:**
- Consumes: `SignatureDoc` type
- Produces: 上传按钮绑定文件选择器

- [ ] **Step 1: 修改SignatureDetailModal.tsx**

在组件中添加ref和上传逻辑：

```typescript
import { memo, useRef } from 'react'
import { Modal, Button, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { SignatureDoc } from '../../types'

interface SignatureDetailModalProps {
  open: boolean
  onClose: () => void
  docs: SignatureDoc[]
  onDocStatusChange?: (docId: string, status: string) => void
}

const SignatureDetailModal = memo(function SignatureDetailModal({
  open,
  onClose,
  docs,
  onDocStatusChange,
}: SignatureDetailModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const activeDocIdRef = useRef<string>('')

  const signedCount = docs.filter(d => d.status === 'signed').length
  const unsignedCount = docs.filter(d => d.status === 'unsigned').length
  const totalCount = docs.length || 1
  const percent = Math.round((signedCount / totalCount) * 100)

  const handleUploadClick = (docId: string) => {
    activeDocIdRef.current = docId
    fileInputRef.current?.click()
  }

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    onDocStatusChange?.(activeDocIdRef.current, 'signed')
    message.success(`${file.name} 已上传`)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Modal
      title="签字文件追踪"
      open={open}
      onCancel={onClose}
      width={640}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button icon={<PlusOutlined />}>手动添加</Button>
          <Button onClick={onClose}>关闭</Button>
        </div>
      }
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.png"
        style={{ display: 'none' }}
        onChange={handleFileSelected}
      />

      {docs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-placeholder)' }}>
          暂无签字文件
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
            <div style={{ textAlign: 'center', padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-success)' }}>{signedCount}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>已签字</div>
            </div>
            <div style={{ textAlign: 'center', padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-error)' }}>{unsignedCount}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>待签字</div>
            </div>
            <div style={{ textAlign: 'center', padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '24px', fontWeight: 700 }}>{percent}%</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>完成率</div>
            </div>
          </div>

          <div style={{ height: '6px', background: 'var(--bg-secondary)', borderRadius: '3px', marginBottom: '16px' }}>
            <div style={{ height: '100%', width: `${percent}%`, background: 'var(--color-success)', borderRadius: '3px' }} />
          </div>

          {docs.map(doc => (
            <div
              key={doc.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 0',
                borderBottom: '1px solid var(--border-light)',
                fontSize: '13px',
              }}
            >
              <span style={{ color: 'var(--text-placeholder)', fontSize: '16px' }}>📄</span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {doc.name}
              </span>
              {doc.category && (
                <span style={{ fontSize: '11px', color: 'var(--text-placeholder)' }}>{doc.category}</span>
              )}
              <span
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: doc.status === 'signed' ? '#D1FAE5' : '#FEE2E2',
                  color: doc.status === 'signed' ? '#065F46' : '#991B1B',
                }}
              >
                {doc.status === 'signed' ? '已签字' : '待签字'}
              </span>
              {doc.status === 'unsigned' && (
                <button
                  onClick={() => handleUploadClick(doc.id)}
                  style={{
                    padding: '3px 8px',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface)',
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  上传
                </button>
              )}
            </div>
          ))}
        </>
      )}
    </Modal>
  )
})

export default SignatureDetailModal
```

- [ ] **Step 2: 编译验证**

Run: `npm run electron:compile`
Expected: 编译通过

- [ ] **Step 3: 运行测试**

Run: `npm test`
Expected: 426测试全通过

- [ ] **Step 4: Commit**

```bash
git add src/components/ProjectHome/SignatureDetailModal.tsx
git commit -m "feat(P6): bind upload button to file selector in SignatureDetailModal"
```

---

### Task 6: P3 - 利润测算弹窗重构

**Covers:** P3

**Files:**
- Modify: `src/components/ProjectHome/ProfitCalculatorModal.tsx`

**Interfaces:**
- Consumes: `INTERNAL_UNIT_PRICES` from `ProfitCalculator.ts`, `calculateProfit` from `ProfitCalculator.ts`, `levelOptions` from current file
- Produces: 完整利润测算弹窗（成员表格+成本明细+进度条+复制）

- [ ] **Step 1: 重写ProfitCalculatorModal.tsx**

完整替换现有文件内容。新增成员表格、实时计算、成本明细、进度条、复制按钮：

```typescript
import { useState, useEffect, useMemo } from 'react'
import { Modal, Input, Select, Button, Divider, message } from 'antd'
import { CopyOutlined, PlusOutlined, CloseOutlined } from '@ant-design/icons'
import { INTERNAL_UNIT_PRICES, calculateProfit, ProfitResult } from './ProfitCalculator'
import { formatAmount, formatPercent } from '../../utils/format'
import { parseMetadata } from '../../utils/metadata'

interface Member {
  id: number
  role: string
  level: string
  days: number
  price: number
}

interface ProfitCalculatorModalProps {
  open: boolean
  onClose: () => void
  projectId?: number
}

let memberIdCounter = 1

const roleOptions = Object.keys(INTERNAL_UNIT_PRICES).map(role => ({
  label: role,
  value: role,
}))

const levelOptions: Record<string, { label: string; value: string }[]> = {
  '实施顾问': [
    { label: 'C1-1 (¥1270)', value: 'C1-1' },
    { label: 'C1-2 (¥1440)', value: 'C1-2' },
    { label: 'C2-1 (¥1560)', value: 'C2-1' },
    { label: 'C2-2 (¥1970)', value: 'C2-2' },
    { label: 'C3-1 (¥2550)', value: 'C3-1' },
    { label: 'C3-2 (¥3030)', value: 'C3-2' },
    { label: 'C4-1 (¥3940)', value: 'C4-1' },
  ],
  '开发工程师': [
    { label: 'C1-1 (¥1270)', value: 'C1-1' },
    { label: 'C1-2 (¥1440)', value: 'C1-2' },
    { label: 'C2-1 (¥1560)', value: 'C2-1' },
    { label: 'C2-2 (¥1970)', value: 'C2-2' },
    { label: 'C3-1 (¥2550)', value: 'C3-1' },
    { label: 'C3-2 (¥3030)', value: 'C3-2' },
    { label: 'C4-1 (¥3940)', value: 'C4-1' },
  ],
  '项目经理': [
    { label: 'C1-1 (¥1270)', value: 'C1-1' },
    { label: 'C1-2 (¥1440)', value: 'C1-2' },
    { label: 'C2-1 (¥1560)', value: 'C2-1' },
    { label: 'C2-2 (¥1970)', value: 'C2-2' },
    { label: 'C3-1 (¥2550)', value: 'C3-1' },
    { label: 'C3-2 (¥3030)', value: 'C3-2' },
    { label: 'C4-1 (¥3940)', value: 'C4-1' },
  ],
  '测试工程师': [
    { label: 'C1-1 (¥1270)', value: 'C1-1' },
    { label: 'C1-2 (¥1440)', value: 'C1-2' },
    { label: 'C2-1 (¥1560)', value: 'C2-1' },
    { label: 'C2-2 (¥1970)', value: 'C2-2' },
    { label: 'C3-1 (¥2550)', value: 'C3-1' },
    { label: 'C3-2 (¥3030)', value: 'C3-2' },
    { label: 'C4-1 (¥3940)', value: 'C4-1' },
  ],
  '运维工程师': [
    { label: '服务1-1 (¥1060)', value: '服务1-1' },
    { label: '服务1-2 (¥1200)', value: '服务1-2' },
  ],
}

function getInternalUnitPrice(role: string, level: string): number {
  return INTERNAL_UNIT_PRICES[role]?.[level] || 0
}

export default function ProfitCalculatorModal({ open, onClose, projectId }: ProfitCalculatorModalProps) {
  const [contractAmount, setContractAmount] = useState<number>(0)
  const [members, setMembers] = useState<Member[]>([
    { id: 0, role: '实施顾问', level: 'C2-1', days: 0, price: 1560 },
  ])
  const [externalDays, setExternalDays] = useState<number>(0)
  const [externalUnitPrice, setExternalUnitPrice] = useState<number>(1200)
  const [internalTravel, setInternalTravel] = useState<number>(0)
  const [externalTravel, setExternalTravel] = useState<number>(0)

  const result = useMemo<ProfitResult | null>(() => {
    const internalDays = members.reduce((sum, m) => sum + m.days, 0)
    const internalUnitPriceAvg = members.length > 0
      ? members.reduce((sum, m) => sum + m.days * m.price, 0) / Math.max(internalDays, 1)
      : 1560

    if (contractAmount <= 0 && internalDays <= 0 && externalDays <= 0) return null

    return calculateProfit({
      contractAmount,
      internalDays,
      externalDays,
      internalUnitPrice: internalUnitPriceAvg,
      internalTravel,
      externalUnitPrice,
      externalTravel,
    })
  }, [contractAmount, members, externalDays, externalUnitPrice, internalTravel, externalTravel])

  useEffect(() => {
    if (result && projectId) {
      const evaluation = {
        contractAmount,
        members,
        externalDays,
        externalUnitPrice,
        internalTravel,
        externalTravel,
        result,
        calculatedAt: new Date().toISOString(),
      }
      window.api.project.get(projectId).then(projectResult => {
        const existingMeta = parseMetadata(projectResult.data?.metadata ?? null)
        const mergedMeta = {
          ...existingMeta,
          evaluation,
          contract_amount: contractAmount,
          cost_estimate: result.totalCost,
          profit_rate: result.internalProfitRate,
          person_days: members.reduce((s, m) => s + m.days, 0) + externalDays,
        }
        window.api.project.update(projectId, { metadata: JSON.stringify(mergedMeta) })
      }).catch(() => {})
    }
  }, [result, projectId, contractAmount, members, externalDays, externalUnitPrice, internalTravel, externalTravel])

  const addMember = () => {
    if (members.length >= 10) return
    const id = memberIdCounter++
    setMembers([...members, { id, role: '', level: '', days: 0, price: 0 }])
  }

  const removeMember = (id: number) => {
    setMembers(members.filter(m => m.id !== id))
  }

  const updateMember = (id: number, field: keyof Member, value: string | number) => {
    setMembers(members.map(m => {
      if (m.id !== id) return m
      const updated = { ...m, [field]: value }
      if (field === 'role' || field === 'level') {
        const role = field === 'role' ? (value as string) : m.role
        const level = field === 'level' ? (value as string) : m.level
        updated.price = getInternalUnitPrice(role, level)
      }
      return updated
    }))
  }

  const handleCopy = () => {
    if (!result) return
    const internalDays = members.reduce((sum, m) => sum + m.days, 0)
    const internalCost = members.reduce((sum, m) => sum + m.days * m.price, 0)
    const internalTotal = internalCost + internalTravel
    const externalCost = externalDays * externalUnitPrice
    const externalTotal = externalCost + externalTravel
    const totalCost = internalTotal + externalTotal

    const txt = `【利润测算】\n合同：${formatAmount(contractAmount)}\n`
      + `内部：${internalDays}人天 ${formatAmount(internalCost)}+差旅${formatAmount(internalTravel)}=${formatAmount(internalTotal)}\n`
      + `外包：${externalDays}人天 ${formatAmount(externalCost)}+差旅${formatAmount(externalTravel)}=${formatAmount(externalTotal)}\n`
      + `总成本：${formatAmount(totalCost)}\n`
      + `内部利润率：${formatPercent(result.internalProfitRate)}  外包利润率：${formatPercent(result.externalProfitRate)}  整体利润率：${formatPercent(result.overallProfitRate)}\n`
      + `利润：${formatAmount(contractAmount - totalCost)}`
    window.api.clipboardWriteText(txt).then(() => message.success('已复制'))
  }

  return (
    <Modal
      title="利润测算"
      open={open}
      onCancel={onClose}
      width={640}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button icon={<CopyOutlined />} onClick={handleCopy} disabled={!result}>复制结果</Button>
          <Button onClick={onClose}>关闭</Button>
        </div>
      }
    >
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
          合同总额（元）
        </label>
        <Input
          type="number"
          value={contractAmount || ''}
          onChange={e => setContractAmount(Number(e.target.value) || 0)}
          placeholder="输入合同总额"
        />
      </div>

      <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>内部团队</div>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '4px', fontSize: '10px', color: 'var(--text-placeholder)', padding: '0 2px' }}>
        <span style={{ flex: 1.2 }}>角色 / 职级</span>
        <span style={{ flex: 0.6, textAlign: 'center' }}>人天</span>
        <span style={{ flex: 0.6, textAlign: 'right' }}>单价</span>
        <span style={{ flex: 0.6, textAlign: 'right' }}>成本</span>
        <span style={{ width: '22px' }}></span>
      </div>
      {members.map(m => (
        <div key={m.id} style={{ display: 'flex', gap: '4px', alignItems: 'center', marginBottom: '4px' }}>
          <Select
            style={{ flex: 1.2, fontSize: '11px' }}
            size="small"
            value={m.role || undefined}
            placeholder="选择角色"
            onChange={v => {
              const [role, level] = v.split(',')
              updateMember(m.id, 'role', role)
              updateMember(m.id, 'level', level)
            }}
            options={roleOptions}
          />
          <Input
            type="number"
            style={{ flex: 0.6 }}
            size="small"
            value={m.days || ''}
            onChange={e => updateMember(m.id, 'days', Number(e.target.value) || 0)}
            min={0}
            placeholder="0"
          />
          <span style={{ flex: 0.6, textAlign: 'right', fontSize: '10px', color: 'var(--text-secondary)' }}>
            {m.price ? `¥${m.price.toLocaleString()}` : '-'}
          </span>
          <span style={{ flex: 0.6, textAlign: 'right', fontSize: '11px', fontWeight: 500 }}>
            {m.days * m.price ? `¥${(m.days * m.price).toLocaleString()}` : '¥0'}
          </span>
          <button
            onClick={() => removeMember(m.id)}
            style={{ width: '22px', height: '22px', border: 'none', background: 'none', color: 'var(--text-placeholder)', cursor: 'pointer', fontSize: '14px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <CloseOutlined />
          </button>
        </div>
      ))}
      <button
        onClick={addMember}
        style={{ width: '100%', height: '26px', border: '1px dashed var(--color-primary)', borderRadius: 'var(--radius-sm)', background: 'var(--color-primary-light)', fontSize: '11px', color: 'var(--color-primary)', cursor: 'pointer', marginTop: '4px', fontWeight: 500 }}
      >
        + 添加成员
      </button>

      <div style={{ marginTop: '12px' }}>
        <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
          内部差旅（元）
        </label>
        <Input type="number" value={internalTravel || ''} onChange={e => setInternalTravel(Number(e.target.value) || 0)} placeholder="0" />
      </div>

      <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '16px', marginBottom: '8px' }}>外包资源</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>人天</label>
          <Input type="number" value={externalDays || ''} onChange={e => setExternalDays(Number(e.target.value) || 0)} min={0} placeholder="0" />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>单价（元/天）</label>
          <Input type="number" value={externalUnitPrice} onChange={e => setExternalUnitPrice(Number(e.target.value) || 1200)} />
        </div>
      </div>
      <div style={{ marginTop: '12px' }}>
        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>外部差旅（元）</label>
        <Input type="number" value={externalTravel || ''} onChange={e => setExternalTravel(Number(e.target.value) || 0)} placeholder="0" />
      </div>

      {result && (
        <>
          <Divider>测算结果</Divider>

          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>成本与分配</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>内部人天成本</span>
            <span style={{ fontWeight: 500 }}>{formatAmount(members.reduce((s, m) => s + m.days * m.price, 0))}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>内部差旅</span>
            <span style={{ fontWeight: 500 }}>{formatAmount(internalTravel)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '12px' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>内部总成本</span>
            <span style={{ fontWeight: 700, fontSize: '13px' }}>{formatAmount(result.internalTotalCost)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>外包人天成本</span>
            <span style={{ fontWeight: 500 }}>{formatAmount(result.externalPersonDayCost)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>外部差旅</span>
            <span style={{ fontWeight: 500 }}>{formatAmount(externalTravel)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '12px' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>外包总成本</span>
            <span style={{ fontWeight: 700, fontSize: '13px' }}>{formatAmount(result.externalTotalCost)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '12px' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>总成本</span>
            <span style={{ fontWeight: 700, fontSize: '13px' }}>{formatAmount(result.totalCost)}</span>
          </div>

          <Divider style={{ margin: '12px 0' }} />

          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>利润率</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            {[
              { label: '内部利润率', value: result.internalProfitRate, warn: result.isInternalRedLine },
              { label: '外包利润率', value: result.externalProfitRate, warn: result.isExternalRedLine },
              { label: '整体利润率', value: result.overallProfitRate, warn: false },
            ].map(item => (
              <div key={item.label} style={{ padding: '8px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '2px' }}>{item.label}</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: item.value >= 0 ? (item.warn ? 'var(--color-warning)' : 'var(--color-success)') : 'var(--color-error)' }}>
                  {formatPercent(item.value)}
                </div>
                <div style={{ height: '5px', background: 'var(--border-default)', borderRadius: '3px', marginTop: '4px', position: 'relative' }}>
                  <div style={{ height: '100%', borderRadius: '3px', width: `${Math.min(Math.max(item.value * 100, 0), 100)}%`, background: item.value >= 0 ? (item.warn ? 'var(--color-warning)' : 'var(--color-success)') : 'var(--color-error)' }} />
                </div>
              </div>
            ))}
          </div>

          {(result.isInternalRedLine || result.isExternalRedLine) && (
            <div style={{ padding: '8px', background: result.isInternalRedLine ? '#FEE2E2' : '#FEF3C7', borderRadius: 'var(--radius-sm)', fontSize: '11px', color: result.isInternalRedLine ? '#991B1B' : '#92400E', marginBottom: '8px' }}>
              ⚠️ {result.isInternalRedLine && '内部利润率 < 0%'}{result.isInternalRedLine && result.isExternalRedLine && '，'}{result.isExternalRedLine && '外包利润率 < 40%'}
            </div>
          )}
          {!result.isInternalRedLine && !result.isExternalRedLine && contractAmount > 0 && (
            <div style={{ padding: '8px', background: '#D1FAE5', borderRadius: 'var(--radius-sm)', fontSize: '11px', color: '#065F46', marginBottom: '8px' }}>
              ✓ 利润率符合公司要求
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-placeholder)', marginTop: '8px' }}>
            <span>总人天 <strong style={{ color: 'var(--text-primary)' }}>{members.reduce((s, m) => s + m.days, 0) + externalDays}</strong></span>
            <span>利润 <strong style={{ color: contractAmount - result.totalCost >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>{formatAmount(contractAmount - result.totalCost)}</strong></span>
          </div>
        </>
      )}
    </Modal>
  )
}
```

- [ ] **Step 2: 编译验证**

Run: `npm run electron:compile`
Expected: 编译通过

- [ ] **Step 3: 运行测试**

Run: `npm test`
Expected: 426测试全通过

- [ ] **Step 4: Commit**

```bash
git add src/components/ProjectHome/ProfitCalculatorModal.tsx
git commit -m "feat(P3): refactor ProfitCalculatorModal with member table, cost breakdown, progress bars, copy"
```

---

### Task 7: P8 - 清理triggerSubcategories

**Covers:** P8

**Files:**
- Modify: `electron/shared/stages.ts:53`

**Interfaces:**
- 无新接口，修改现有常量

- [ ] **Step 1: 修改stages.ts**

将triggerSubcategories从4项改为2项：

```typescript
// 修改前
triggerSubcategories: ['验收报告', '项目总结', '项目归档', '复盘总结'],

// 修改后
triggerSubcategories: ['项目归档', '复盘总结'],
```

- [ ] **Step 2: 编译验证**

Run: `npm run electron:compile`
Expected: 编译通过

- [ ] **Step 3: 运行测试**

Run: `npm test`
Expected: 426测试全通过

- [ ] **Step 4: Commit**

```bash
git add electron/shared/stages.ts
git commit -m "fix(P8): clean up triggerSubcategories to only include effective subcategories"
```

---

### Task 8: P9 - 合同金额校验

**Covers:** P9

**Files:**
- Modify: `electron/ipc/ai-handlers.ts`（ai:analyze handler中的metadata合并逻辑）

**Interfaces:**
- 无新接口，修改现有合并逻辑

- [ ] **Step 1: 修改ai-handlers.ts**

在metadata合并时添加items总和校验。找到`contract_amount`写入的位置，在其后添加：

```typescript
// 合同金额校验：如果items总和与amount偏差>5%且至少2个分项，以items总和为准
const itemsTotal = contractItems.reduce((sum: number, item: any) => sum + (item.amount || 0), 0)
if (contractItems.length >= 2 && itemsTotal > 0 && mergedMeta.contract_amount) {
  const amount = mergedMeta.contract_amount as number
  if (Math.abs(itemsTotal - amount) / amount > 0.05) {
    mergedMeta.contract_amount = itemsTotal
  }
}
```

注意：需要确认`contractItems`变量在该作用域可用。如果不可用，需要从mergedMeta中读取。

- [ ] **Step 2: 编译验证**

Run: `npm run electron:compile`
Expected: 编译通过

- [ ] **Step 3: 运行测试**

Run: `npm test`
Expected: 426测试全通过

- [ ] **Step 4: Commit**

```bash
git add electron/ipc/ai-handlers.ts
git commit -m "fix(P9): validate contract_amount against items total, prefer items sum when mismatch"
```

---

### Task 9: P10 - 需求去重prompt优化

**Covers:** P10

**Files:**
- Modify: `electron/prompts/extract-structured.ts`

**Interfaces:**
- 无新接口，修改现有prompt文本

- [ ] **Step 1: 修改extract-structured.ts**

在prompt的去重规则部分添加语义去重提示：

```
去重规则：
1. 精确匹配：名称完全相同的条目合并为一条
2. 语义去重：如果两条需求描述的是同一件事（如"权限管理"和"权限矩阵设计"、"流程提醒"和"流程增加提醒功能"），合并为一条
3. 合并策略：保留描述更详细的那条，来源字段合并
4. 不要将不同方面的类似主题拆分为多条（如"权限管理"和"数据权限控制"是不同需求，应保留两条）
```

找到现有的去重规则位置，在其后追加上述内容。

- [ ] **Step 2: 编译验证**

Run: `npm run electron:compile`
Expected: 编译通过

- [ ] **Step 3: 运行测试**

Run: `npm test`
Expected: 426测试全通过

- [ ] **Step 4: Commit**

```bash
git add electron/prompts/extract-structured.ts
git commit -m "fix(P10): enhance dedup rules with semantic dedup guidance in extract prompt"
```

---

### Task 10: P7 - 交付物"查看"按钮

**Covers:** P7

**Files:**
- Modify: `src/components/ProjectHome/DeliverableDetailModal.tsx:86-103`

**Interfaces:**
- 无新接口

- [ ] **Step 1: 修改DeliverableDetailModal.tsx**

给"查看"按钮添加onClick，点击时打开文件：

```typescript
// 找到"查看"按钮（约line 90-102），添加onClick
<button
  onClick={() => {
    if (version.fileId) {
      window.api.file.open(Number(version.fileId))
    }
  }}
  style={{
    fontSize: '11px',
    color: 'var(--color-primary)',
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    padding: '2px 6px',
    borderRadius: 'var(--radius-sm)',
  }}
>
  查看
</button>
```

- [ ] **Step 2: 编译验证**

Run: `npm run electron:compile`
Expected: 编译通过

- [ ] **Step 3: 运行测试**

Run: `npm test`
Expected: 426测试全通过

- [ ] **Step 4: Commit**

```bash
git add src/components/ProjectHome/DeliverableDetailModal.tsx
git commit -m "fix(P7): add onClick handler to DeliverableDetailModal view button"
```
