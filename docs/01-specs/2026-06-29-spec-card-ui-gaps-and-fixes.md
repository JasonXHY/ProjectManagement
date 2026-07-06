# 卡片UI差距与修复方案（详细版）

> 2026-06-29 | 审查范围：mockup设计 vs 实际实现 + 测试项目0629数据验证
> 状态：待Qoder审核
> 参考：09-card-details.html、07-eval-card-card.html

---

## P1 - 项目总结卡片（SummaryCard）

### 现状
- 文件：`src/components/ProjectHome/cards/SummaryCard.tsx`（37行）
- 仅显示`project_overview`文本，CSS line-clamp 4行
- 展开/收起按钮（文本>100字符时）
- 无弹窗、无Tab、无复制功能

### Mockup设计（09-card-details.html:414-435）
- 640px弹窗，标题"项目总结"
- 头部按钮："复制为汇报格式"、"复制为PPT大纲"
- 双Tab：项目成果 / 项目复盘
- 项目成果Tab：成就行列表（图标+标题+描述+分类标签）
- 项目复盘Tab：分组章节（做得好/待改进/经验教训）

### 修复方案

**新增文件**：`src/components/ProjectHome/ProjectSummaryModal.tsx`

**技术选型**：Ant Design `Modal` + `Tabs` + `message`

**组件结构**：
```tsx
import { Modal, Tabs, Button, message } from 'antd'
import { CopyOutlined } from '@ant-design/icons'

interface Achievement {
  title: string
  description: string
  category: '功能亮点' | '量化指标' | '团队经验'
}

interface Retrospective {
  good: string[]        // 做得好
  improve: string[]     // 待改进
  lessons: string[]     // 经验教训
}

interface Props {
  open: boolean
  onClose: () => void
  project: Project
}
```

**Tab 1 - 项目成果**：
- 遍历`meta.achievements`数组
- 每行渲染：星形图标 + 标题 + 描述 + 分类Tag
- 空态：显示"暂无项目成果，请先生成分析"

**Tab 2 - 项目复盘**：
- 从`meta.retrospective`读取三组数据
- 每组一个section：标题 + 列表项（带圆点前缀）
- 三组：做得好（绿色图标）、待改进（橙色图标）、经验教训（蓝色图标）

**复制功能**：
- "复制为汇报格式"：生成纯文本，格式为`【项目成果】\n1. xxx\n...\n【项目复盘】\n做得好：\n- xxx`
- "复制为PPT大纲"：生成Markdown格式，带## 标题和- 列表
- 使用Electron IPC桥接复制（navigator.clipboard在Electron renderer中已废弃）：
  1. preload.ts新增：`clipboardWriteText: (text: string) => ipcRenderer.invoke('clipboard:writeText', text)`
  2. 主进程新增handler：`ipcMain.handle('clipboard:writeText', (_, text) => clipboard.writeText(text))`
  3. 调用：`window.api.clipboardWriteText(txt).then(() => message.success('已复制'))`

**数据来源**：
- v0.2.x只做fallback，从现有字段推导：
  - 成就：从contract_amount（合同金额）、requirements.length（需求数）、key_issues.filter(resolved).length（已解决问题数）推导
  - 复盘：从key_issues（问题列表）、opportunities（商机）推导
- `meta.achievements`和`meta.retrospective`字段留到v0.3再由AI生成

**SummaryCard.tsx改动**：
- 添加`useState(false)`控制modalOpen
- 卡片body区域添加"查看全部 →"按钮
- 渲染`<ProjectSummaryModal open={modalOpen} onClose={...} project={project} />`

---

## P2 - 拓展商机卡片（OpportunityCard）

### 现状
- 文件：`src/components/ProjectHome/cards/OpportunityCard.tsx`（38行）
- 纯静态卡片，无onClick
- 最多显示3条（slice(0,3)），每条：名称+描述+状态Tag
- 无弹窗、无方案字段

### Mockup设计（09-card-details.html:360-384）
- 点击触发640px弹窗
- 完整列表，每行：星形图标 + 名称 + 描述 + 方案建议 + 状态Tag（已确认/规划中）

### 修复方案

**新增文件**：`src/components/ProjectHome/OpportunityDetailModal.tsx`

**技术选型**：Ant Design `Modal`

**组件结构**：
```tsx
interface Opportunity {
  name: string
  description?: string
  solution?: string    // 新增字段
  status?: 'planned' | 'confirmed' | 'in-progress'
  statusText?: string
}

// Modal渲染：遍历opportunities，每行显示名称、描述、方案、状态Tag
// 空态："暂无拓展商机"
```

**OpportunityCard.tsx改动**：
- 添加`useState(false)`控制modalOpen
- 卡片fc-header添加`<button className="fc-action" onClick={() => setModalOpen(true)}>查看全部 →</button>`
- 渲染`<OpportunityDetailModal open={modalOpen} onClose={...} opportunities={opportunities} />`

**数据增强**：
- extract-structured prompt补充：从文档中提取商机的`solution`字段（方案建议）
- 现有数据无solution字段时显示"待评估"

---

## P3 - 利润测算弹窗（ProfitCalculatorModal）

### 现状
- 文件：`src/components/ProjectHome/ProfitCalculatorModal.tsx`（281行）
- Ant Design弹窗640px
- 8个Input：合同总额、内部人天、外包人天、外包单价、内部角色Select、职级Select、内部差旅、外部差旅
- 点击"测算"按钮计算
- 结果4格：总成本、整体利润率、内部利润率、外包利润率

### Mockup设计（07-eval-card-card.html全253行）
- 嵌入式卡片（560px），非弹窗
- **成员表格**：动态增删行，每行Select角色+职级+Input人天，自动显示单价和人天成本
- **实时计算**：输入即算
- **成本分配明细**：内部人天成本、内部差旅、内部总成本、外包人天成本、外部差旅、外包总成本、总成本、内部占比、内部分配合同、外部分配合同、自身交付成本占比
- **利润率三栏**：内部/外包/整体利润率，各带进度条和红线标记
- **红线警告**：内部<0%报红、外包<40%报黄、符合要求报绿
- **复制结果按钮** + **Toast提示**

### 修复方案

**改造文件**：`src/components/ProjectHome/ProfitCalculatorModal.tsx`

**方案选择**：保持弹窗形式但补齐mockup全部功能（嵌入式卡片需要改动FeatureCards布局，风险较大）

**注意**：INTERNAL_UNIT_PRICES在`electron/shared/ProfitCalculator.ts`（后端计算模块），levelOptions在`ProfitCalculatorModal.tsx`（前端），需分别引用。calculateProfit返回的ProfitResult已包含17个字段（internalPersonDayCost、internalTotalCost、externalPersonDayCost、externalTotalCost、totalCost、各利润率、红线标记等），成本明细所需数据全部可用。

**改动1 - 成员表格**：
```tsx
// 新增state
const [members, setMembers] = useState<Member[]>([
  { id: 0, role: '实施顾问', level: 'C2-1', days: 0, price: 1560 }
])

// Member类型
interface Member {
  id: number
  role: string
  level: string
  days: number
  price: number
}

// 渲染：表头（角色/职级 | 人天 | 单价 | 人天成本 | 删除按钮）
// 每行：Select角色 → Select职级（联动）→ InputNumber人天 → 显示单价 → 显示人天成本 → ×删除
// 底部："+ 添加成员"按钮（dashed style）
// 复用现有INTERNAL_UNIT_PRICES和levelOptions数据
```

**改动2 - 实时计算**：
```tsx
// 移除"测算"按钮
// 使用useEffect监听所有输入变化，自动触发calcResult = calculateProfit({...})
// calculateProfit函数已存在于ProfitCalculator.ts，直接复用
```

**改动3 - 成本分配明细**：
```tsx
// calculateProfit返回的ProfitResult已包含所有字段，直接从result中读取：
// result.internalPersonDayCost, result.internalTotalCost
// result.externalPersonDayCost, result.externalTotalCost
// result.totalCost, result.internalAlloc, result.externalAlloc
// 无需新增计算逻辑，只需在UI中渲染这些字段

<div style={{borderTop: '1px solid var(--border-light)', paddingTop: 12, marginTop: 12}}>
  <div className="eval-row"><span>内部人天成本</span><span>{formatAmount(result.internalPersonDayCost)}</span></div>
  <div className="eval-row"><span>内部差旅</span><span>{formatAmount(internalTravel)}</span></div>
  <div className="eval-row" style={{fontWeight:600}}><span>内部总成本</span><span>{formatAmount(result.internalTotalCost)}</span></div>
  <div className="eval-row"><span>外包人天成本</span><span>{formatAmount(result.externalPersonDayCost)}</span></div>
  <div className="eval-row"><span>外部差旅</span><span>{formatAmount(externalTravel)}</span></div>
  <div className="eval-row" style={{fontWeight:600}}><span>外包总成本</span><span>{formatAmount(result.externalTotalCost)}</span></div>
  <div className="eval-row"><span>总成本</span><span>{formatAmount(result.totalCost)}</span></div>
  <div className="eval-row"><span>内部占比</span><span>{pct(result.internalRatio * 100)}</span></div>
  <div className="eval-row"><span>内部分配合同</span><span>{formatAmount(result.internalAlloc)}</span></div>
  <div className="eval-row"><span>外部分配合同</span><span>{formatAmount(result.externalAlloc)}</span></div>
</div>
```

**改动4 - 利润率进度条**：
```tsx
// 三栏grid：内部利润率 | 外包利润率 | 整体利润率
// 每栏：标题 + 数值 + 进度条（div套div，width=rate*100%）
// 红线标记：外包利润率栏添加40%位置的竖线标记
// 进度条颜色：>=0绿色，<0红色；外包<40%橙色

// 复用mockup中的CSS变量：--color-success, --color-error, --color-warning
```

**改动5 - 红线警告框**：
```tsx
// 现有代码已有警告逻辑（line 266-276），但样式需对齐mockup
// mockup样式：绿色底=符合要求，黄色底=外包<40%，红色底=内部<0%
// 改为三态：ok(绿) / warning(黄) / error(红)
```

**改动6 - 复制按钮**：
```tsx
// Modal header extra区域添加按钮
<Button icon={<CopyOutlined />} onClick={handleCopy}>复制结果</Button>

const handleCopy = () => {
  const txt = `【利润测算】\n合同：${formatAmount(contractAmount)}\n`
    + `内部：${internalDays}人天 ${formatAmount(internalCost)}+差旅${formatAmount(internalTravel)}=${formatAmount(internalTotal)}\n`
    + `外包：${externalDays}人天 ${formatAmount(externalCost)}+差旅${formatAmount(externalTravel)}=${formatAmount(externalTotal)}\n`
    + `总成本：${formatAmount(totalCost)}\n`
    + `内部利润率：${pct(internalRate)}  外包利润率：${pct(externalRate)}  整体利润率：${pct(overallRate)}\n`
    + `利润：${formatAmount(contractAmount - totalCost)}`
window.api.clipboardWriteText(txt).then(() => message.success('已复制'))
}
```

**改动7 - 数据持久化**：
- 现有代码（line 86-119）已将测算结果保存到metadata的`evaluation`字段
- 需额外保存members数组到`evaluation.members`，以便重新打开时恢复

---

## P4 - 需求跟踪弹窗（RequirementDetailModal）

### 现状
- 文件：`src/components/ProjectHome/RequirementDetailModal.tsx`（77行）
- 640px弹窗，列表显示：名称、详情、来源、状态Tag
- 无行内展开、无时间轴、无新增按钮

### Mockup设计（09-card-details.html:265-315）
- 三层结构：卡片 → 弹窗 → 行内展开
- 展开区：方案、结果、时间轴（各节点含标题+日期+来源文档）
- 状态点颜色区分
- "+ 新增需求"按钮

### 修复方案

**改造文件**：`src/components/ProjectHome/RequirementDetailModal.tsx`

**技术选型**：复用`DeliverableDetailModal.tsx`的展开行模式（`expandedId` state）

**改动1 - 行内展开**：
```tsx
// 新增state
const [expandedId, setExpandedId] = useState<number | null>(null)

// 每行添加onClick展开
// 展开区复用DeliverableDetailModal的样式：
//   背景var(--bg-secondary), 圆角var(--radius-md), padding 12px 16px, margin-left 26px
// 展开内容：
//   - 方案：req.solution || '待补充'
//   - 结果：req.result || '待完成'
//   - 时间轴：用Ant Design Timeline组件
```

**改动2 - 时间轴**：
```tsx
import { Timeline } from 'antd'

// req.timeline数组结构
interface TimelineNode {
  title: string
  date: string
  source?: string
}

// 渲染（v6 API用content不用children）
<Timeline items={req.timeline.map(node => ({
  content: (
    <div>
      <div style={{fontSize:14}}>{node.title}</div>
      <div style={{fontSize:12, color:'var(--text-placeholder)'}}>
        {node.date} {node.source && `· ${node.source}`}
      </div>
    </div>
  )
}))} />
```

**改动3 - 新增按钮**：
```tsx
// Modal header extra区域
<Button size="small">+ 新增需求</Button>
// v0.2.x仅做UI占位，点击弹出message.info('功能开发中')
// v0.3实现表单输入保存
```

**数据增强**：
- extract-structured prompt补充：提取`source`、`solution`、`result`、`timeline`字段
- timeline从文档的会议纪要、周报等时间线文档中提取

---

## P5 - 关键问题弹窗（IssueCard + ListDetailModal）

### 现状
- 文件：`src/components/ProjectHome/ListDetailModal.tsx`（52行）、`IssueCard.tsx`（82行）
- 弹窗640px，每行：文本、优先级文字标签、状态Tag
- 无checkbox、无新增按钮

### Mockup设计（09-card-details.html:317-334）
- Checkbox列表：可勾选标记已解决
- 优先级圆点（高红/中黄/低蓝）
- 来源标签
- "+ 新增问题"按钮

### 修复方案

**方案选择**：自定义弹窗替代ListDetailModal（方案B），避免污染通用泛型组件

**新增文件**：`src/components/ProjectHome/IssueDetailModal.tsx`

**改动1 - 独立Modal组件**：
```tsx
import { memo, useState } from 'react'
import { Modal, Checkbox, Button } from 'antd'
import { Issue } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
  issues: Issue[]
  onIssuesChange: (issues: Issue[]) => void
}

const priorityColors: Record<string, string> = {
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#3B82F6',
}

const IssueDetailModal = memo(function IssueDetailModal({
  open, onClose, issues, onIssuesChange
}: Props) {
  const [localIssues, setLocalIssues] = useState<Issue[]>(issues)

  const handleToggle = (index: number) => {
    const updated = [...localIssues]
    updated[index] = {
      ...updated[index],
      status: updated[index].status === 'resolved' ? 'open' : 'resolved'
    }
    setLocalIssues(updated)
    onIssuesChange(updated)
  }

  return (
    <Modal
      title="关键问题"
      open={open}
      onCancel={onClose}
      footer={<Button onClick={onClose}>关闭</Button>}
      width={640}
    >
      {localIssues.map((issue, i) => (
        <div key={i} style={{display:'flex', alignItems:'center', gap:12, padding:'12px 0',
          borderBottom: i < localIssues.length-1 ? '1px solid var(--border-light)' : 'none'}}>
          <Checkbox checked={issue.status === 'resolved'} onChange={() => handleToggle(i)} />
          <span style={{flex:1, fontSize:14,
            textDecoration: issue.status === 'resolved' ? 'line-through' : 'none',
            color: issue.status === 'resolved' ? 'var(--text-placeholder)' : 'var(--text-primary)'}}>
            {issue.text}
          </span>
          <div style={{width:6, height:6, borderRadius:'50%', background: priorityColors[issue.priority || 'medium']}} />
          {issue.source && <span style={{fontSize:11, color:'var(--text-placeholder)'}}>{issue.source}</span>}
        </div>
      ))}
    </Modal>
  )
})
```

**改动2 - IssueCard替换弹窗**：
```tsx
// IssueCard.tsx中将ListDetailModal替换为IssueDetailModal
import IssueDetailModal from '../IssueDetailModal'

// onIssuesChange回调：保存到metadata
const handleIssuesChange = (updatedIssues: Issue[]) => {
  const meta = parseMetadata(project.metadata)
  meta.key_issues = updatedIssues
  window.api.project.update(project.id, { metadata: JSON.stringify(meta) })
}
```

---

## P6 - 签字追踪（SignatureCard + SignatureDetailModal）

### 现状
- `SignatureDetailModal.tsx`（113行）：完整弹窗，统计网格+进度条+文件列表
- "手动添加"和"上传"按钮存在但无逻辑

### Mockup设计（09-card-details.html:336-358）
- 与实现基本一致，差异在"上传"按钮需绑定文件选择

### 修复方案

**改造文件**：`src/components/ProjectHome/SignatureDetailModal.tsx`

**改动 - 上传按钮绑定**：
```tsx
// 使用HTML input[type=file]隐藏触发
const fileInputRef = useRef<HTMLInputElement>(null)

// 上传按钮onClick
const handleUpload = (docId: string) => {
  fileInputRef.current?.click()
  // 存储当前操作的docId到ref
}

// input onChange
const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return
  // 调用fileService.upload或直接更新signature_status
  // 更新metadata中的signature_docs对应项的status为'signed'
  message.success('签字文件已上传')
}

// 渲染
<input ref={fileInputRef} type="file" accept=".pdf,.jpg,.png" style={{display:'none'}}
  onChange={handleFileSelected} />
```

**"手动添加"按钮**：v0.2.x仅UI占位，v0.3实现表单

---

## P7 - 交付物弹窗（DeliverableDetailModal）

### 现状
- `DeliverableDetailModal.tsx`（116行）：**已实现展开行功能**
- `expandedId` state控制展开/收起
- 展开区显示versions数组

### Mockup设计（09-card-details.html:386-412）
- 与实现基本一致

### 结论
**大部分已实现**，但"查看"按钮（lines 86-103）没有onClick处理器，点击无反应，需补充。

---

## P8 - 阶段推进

### 分析结论
**不是bug**。完整链路已存在：
1. `electron/ipc/handlers/upload.ts:214-225`：分类后调用`checkStageProgression`，匹配时发送IPC事件
2. `electron/preload.ts:18-23`：IPC桥接暴露`onStageProgressionNeeded`
3. `src/components/ProjectHome/projectHome.hooks.ts:41-54`：监听事件，弹出确认Modal
4. `projectHome.hooks.ts:374-396`：确认后调用`projectService.update()`更新阶段

项目0629不推进的原因：2个关闭阶段文件的subcategory是"验收材料待签"，不在触发列表中。

### 修复方案

**改动文件**：`electron/shared/stages.ts`

**方案**：清理triggerSubcategories，移除不会生效的子分类

现有定义：
```tsx
triggerSubcategories: ['验收报告', '项目总结', '项目归档', '复盘总结']
```

问题："验收报告"和"项目总结"属于验收阶段（stage=验收），但推进规则要求stage=关闭才能触发。AI分类时验收报告会被分到stage=验收，永远不匹配。

修正为：
```tsx
triggerSubcategories: ['项目归档', '复盘总结']
```

只保留属于关闭阶段的子分类。验收报告不触发项目关闭是合理的——验收是流程中的一步，不代表项目可以关闭。

---

## P9 - 合同金额不一致

### 数据
- `contract_amount`: 143000
- `contract_items`总和: 152654.11

### 修复方案

**改动文件**：`electron/ipc/ai-handlers.ts`（ai:analyze handler）

**方案**：AI提取后校验，items总和优先（前提：contract_items至少2项才做校验）
```tsx
// 在metadata合并时
const itemsTotal = contractItems.reduce((sum, item) => sum + (item.amount || 0), 0)
if (contractItems.length >= 2 && itemsTotal > 0 && Math.abs(itemsTotal - contractAmount) / contractAmount > 0.05) {
  // 偏差>5%且至少2个分项，以items总和为准
  mergedMeta.contract_amount = itemsTotal
}
```

**背景**：classify.ts已有first-write-wins保护（line 66-69），当前不一致可能是合同金额先被非合同文件写入，正确数据被挡住了。

---

## P10 - 需求重复项

### 数据
- "权限管理与角色配置" ≈ "设计并实现权限矩阵"
- "流程提醒功能" ≈ "流程增加提醒功能以确保闭环"

### 修复方案

**改动文件**：`electron/prompts/extract-structured.ts`

**方案**：在prompt去重规则中增加语义去重提示
```
去重规则：
1. 精确匹配：名称完全相同则合并
2. 语义去重：如果两条需求描述的是同一件事（如"权限管理"和"权限矩阵设计"），合并为一条
3. 合并策略：保留描述更详细的那条，来源字段合并
```

**注意**：不调整fuzzyNameMatch阈值。当前算法是字符级无序匹配，降阈值可能增加误合并。prompt层去重在v0.2.x够用，更可靠的语义去重（Levenshtein/Jaro-Winkler或轻量AI判断）留到后续版本。

---

## 实施优先级

| 阶段 | 问题 | 工作量 | 复用 |
|------|------|--------|------|
| Phase 1 | P2（商机弹窗） | 0.5天 | Modal模式（同ContractDetailModal） |
| Phase 1 | P5（问题checkbox） | 0.5天 | Checkbox组件 |
| Phase 2 | P1（项目总结弹窗） | 1.5天 | Modal+Tabs+Clipboard |
| Phase 2 | P4（需求行内展开） | 1天 | 复用DeliverableDetailModal展开模式+Timeline |
| Phase 3 | P3（利润测算重构） | 2天 | 复用INTERNAL_UNIT_PRICES+calculateProfit |
| Phase 4 | P6（签字上传） | 0.5天 | input[type=file]+signature更新 |
| Phase 5 | P9（金额校验）+P10（去重） | 0.5天 | 校验逻辑+prompt调整 |
| - | P7（交付物展开） | 0天 | 已实现 |
| - | P8（阶段推进） | 0天 | 已实现，非bug |

---

## 审查意见（2026-06-29 代码验证 + 网络搜索验证）

### 代码验证总结

所有文件行数声明均已验证，误差在 0-1 行以内，基本准确。以下只列出需要修正或补充的点。

---

### P1 审查

**方案可行**，补充一点：

`project_overview` 由 `ai-handlers.ts` line 208 写入 metadata，是 AI analyze 的产物。文档提到的 `meta.achievements` 和 `meta.retrospective` 目前**不存在于 metadata 中**——extract-structured prompt 只提取 `requirements`、`key_issues`、`opportunities` 三个字段。如果要支持 Tab 1/Tab 2 的结构化展示，需要同步修改 `electron/prompts/extract-structured.ts` 增加 `achievements` 和 `retrospective` 的提取指令，或者用短期 fallback 方案从现有字段推导。文档已提到 fallback，但建议**明确 v0.2.x 只做 fallback**，不依赖 AI 新字段。

---

### P3 审查

**方案可行**，有一个事实纠正：

文档说"复用现有 `INTERNAL_UNIT_PRICES` 和 `levelOptions` 数据"。实际 `INTERNAL_UNIT_PRICES` 在 `ProfitCalculator.ts` line 1（后端计算模块），`levelOptions` 在 `ProfitCalculatorModal.tsx` lines 18-59（前端弹窗组件）。两者不在同一个文件，import 路径不同。方案中需要分别从两个位置引用。

另外 `calculateProfit` 返回的 `ProfitResult` 已经包含 17 个字段（包括 `internalPersonDayCost`、`internalTotalCost`、`externalPersonDayCost`、`externalTotalCost`、`totalCost`、各利润率、红线标记等），**改动3 中的"成本分配明细"所需数据已全部可用**，不需要新增计算逻辑。

---

### P4 审查

**方案可行**，Timeline API 需要修正：

文档中 P4 改动2 使用了 `<Timeline items={...}>` 语法。搜索验证 [Ant Design v6 迁移指南](https://ant.design/docs/react/migration-v6/) 确认：v6 中 `Timeline.Item` 已废弃，改用 `items` 数组。但 `items` 中每项的属性名是 **`content`** 而非 `children`：

```tsx
// 文档写法（children 已废弃）
<Timeline items={req.timeline.map(node => ({
  children: (<div>...</div>)
}))} />

// 正确写法（v6 API）
<Timeline items={req.timeline.map(node => ({
  content: (
    <div>
      <div style={{fontSize:14}}>{node.title}</div>
      <div style={{fontSize:12, color:'var(--text-placeholder)'}}>
        {node.date} {node.source && `· ${node.source}`}
      </div>
    </div>
  )
}))} />
```

来源：[Ant Design Timeline 文档](https://ant.design/components/timeline/)、[v6 迁移指南](https://ant.design/docs/react/migration-v6/)

---

### P5 审查

**方案可行**，补充一点：

`ListDetailModal` 是一个泛型组件（`<T>`），通过 `renderItem` 回调渲染每行内容。添加 Checkbox 不需要修改 `ListDetailModal` 本身——只需在 `IssueCard` 的 `renderItem` 回调中渲染 Checkbox 即可。但**状态持久化**（改动2）需要新增 `onItemUpdate` prop，这需要修改 `ListDetailModal` 的接口。建议确认这个泛型组件是否值得为单个场景增加复杂度，或者直接在 `IssueCard` 中用自定义弹窗替代。

---

### P6 审查

**方案可行**，但 clipboard 方案需要修正：

文档使用 `navigator.clipboard.writeText()`。搜索验证发现 [Electron 官方文档](https://github.com/electron/electron/blob/master/docs/api/clipboard.md)明确说明：**renderer 进程中使用 clipboard API 已被废弃**，推荐通过 preload 脚本暴露 IPC 桥接。

项目中已有 IPC 桥接模式（`electron/preload.ts`），建议：
1. 在 preload 中添加 `clipboardWriteText: (text: string) => void` 方法
2. 在主进程使用 `clipboard.writeText(text)`（[Electron clipboard 模块](https://electronjs.org/zh/docs/latest/api/clipboard)）
3. 渲染进程通过 `window.api.clipboard.writeText(text)` 调用

这样比 `navigator.clipboard.writeText()` 更可靠，不会出现权限问题。来源：[Electron clipboard API](https://electronjs.org/zh/docs/latest/api/clipboard)

**注意**：P1 的复制功能也有同样问题，应统一使用 Electron clipboard 方案。

---

### P7 审查

**"无需修复"结论需要修正**：

代码验证发现 DeliverableDetailModal 的"查看"按钮（lines 86-103）**没有 `onClick` 处理器**——它只是纯 UI 展示，点击无反应。这是一个未实现的功能点，应该在方案中标注。

---

### P8 审查

**完整链路确认正确**，但发现一个逻辑不一致：

`triggerSubcategories` 包含 `['验收报告', '项目总结', '项目归档', '复盘总结']`，但 `STAGE_DEFINITIONS` 中：
- "验收报告"和"项目总结"属于**"验收"阶段**（stages.ts line 28）
- "项目归档"和"复盘总结"属于**"关闭"阶段**（stages.ts line 30）

而 `checkStageProgression` 检查的是 `rule.stages.includes(fileStage)`，即文件的 `stage`（项目阶段：售前/进行中/关闭）必须在 `['关闭']` 中。这意味着：
- AI 分类为 `stage=关闭, subcategory=项目归档` → 触发（正确）
- AI 分类为 `stage=验收, subcategory=验收报告` → **不触发**（因为 stage 不是"关闭"）
- AI 分类为 `stage=关闭, subcategory=验收报告` → 触发（但验收报告的 stage 通常是"验收"不是"关闭"）

**结论**：`triggerSubcategories` 中的"验收报告"和"项目总结"在实际运行中几乎不可能被匹配到，因为它们的自然 stage 是"验收"而非"关闭"。只有"项目归档"和"复盘总结"能正常触发。这不是 bug（文档说"不是 bug"是正确的），但 triggerSubcategories 列表有误导性——看起来覆盖了 4 种子分类，实际只有 2 种生效。

---

### P9 审查

**方案方向正确**，补充发现：

`classify.ts` lines 66-69 **已经有** `contract_amount` 的 first-write-wins 保护：
```typescript
if (key === 'contract_amount' && mergedMetadata[key] && (mergedMetadata[key] as number) > 0) {
  continue
}
```
这说明之前已经修过"后写入覆盖先写入"的问题。当前 143000 vs 152654.11 的不一致，可能是 `contract_amount` 先被一个非合同文件（如 0126.xlsx）写入，然后正确的合同文件被 first-write-wins 挡住了。

文档提出的"items 总和优先"方案需要注意：`contract_items` 也可能被错误提取。建议增加一个前提条件——只有当 `contract_items` 至少有 2 项时才做校验，避免单条 items 的偶然匹配。

---

### P10 审查

**方案方向正确**，但 `fuzzyNameMatch` 算法有问题：

代码验证发现 `fuzzyNameMatch`（structured-merge.ts lines 9-23）使用的**不是标准相似度算法**。它的逻辑是：统计短字符串中每个字符是否在长字符串中出现，然后除以长字符串长度。这是**字符级别的无序匹配**，不考虑字符顺序：

```
"权限管理与角色配置" vs "设计并实现权限矩阵"
→ 短串每个字符在长串中查找 → 匹配率可能很高
→ 但这两个需求的语义可能完全不同
```

降低阈值到 0.6 **可能反而增加误合并**（把不同需求合并在一起）。

**更好的方案**：
1. 搜索验证发现，LLM 辅助的语义去重比字符串相似度更可靠。可以在 `mergeStructuredData` 中，对新条目调用一次轻量 AI 判断是否与已有条目重复
2. 短期方案：改用标准的 Levenshtein 距离或 Jaro-Winkler 相似度，而不是当前的字符计数算法
3. 或者在 prompt 层面加强去重指令（文档已提到），但根据之前的搜索验证，prompt 约束效果有限，代码层面的改进更可靠

---

### 网络验证来源汇总

| 结论 | 验证方式 | 来源 |
|------|---------|------|
| Timeline v6 用 items + content | 网络搜索 | [Ant Design v6 迁移指南](https://ant.design/docs/react/migration-v6/) |
| Electron clipboard 应用 IPC 桥接 | 网络搜索 | [Electron clipboard API](https://electronjs.org/zh/docs/latest/api/clipboard) |
| calculateProfit 返回 17 字段 | 代码验证 | `ProfitCalculator.ts` line 39 |
| DeliverableDetailModal "查看"无 onClick | 代码验证 | `DeliverableDetailModal.tsx` lines 86-103 |
| classify.ts 已有 contract_amount first-write-wins | 代码验证 | `classify.ts` lines 66-69 |
| fuzzyNameMatch 是非标准算法 | 代码验证 | `structured-merge.ts` lines 9-23 |
| triggerSubcategories 逻辑不一致 | 代码验证 | `stages.ts` lines 20-30, 48-54, 58-81 |

---

## 复审意见（2026-06-29 第二轮）

> 基于 mimo 根据第一轮审查意见更新后的文档进行复审

### 总体评价

mimo 对第一轮审查意见的响应质量较高，10 个问题中有 8 个已正确修正。剩余 2 处遗漏集中在 P3 利润测算弹窗，其中 1 处是已知模式的重复遗漏（clipboard），另 1 处是文件名笔误。

### 逐项复审

| 问题 | 第一轮状态 | 修正状态 | 说明 |
|------|-----------|---------|------|
| P1 项目总结 | 需修正 clipboard + 明确 fallback | ✅ 已修正 | lines 67-70 改为 Electron IPC 桥接，lines 73-76 明确 v0.2.x 只做 fallback |
| P2 拓展商机 | 无需修正 | — | 无变化 |
| P3 利润测算 | 需修正文件路径 + clipboard | ⚠️ 部分修正 | 见下方详细说明 |
| P4 需求跟踪 | 需修正 Timeline API | ✅ 已修正 | lines 288-298 正确使用 `content` 而非 `children` |
| P5 关键问题 | 建议自定义弹窗 | ✅ 已修正 | lines 330-405 重写为独立 IssueDetailModal，不污染泛型组件 |
| P6 签字追踪 | 需绑定上传按钮 | ✅ 无变化 | 方案本身正确 |
| P7 交付物 | 需补充"查看"onClick | ✅ 已修正 | line 462 明确标注"查看"按钮无 onClick，需补充 |
| P8 阶段推进 | 需清理 triggerSubcategories | ✅ 已修正 | lines 477-495 修正为只保留 ['项目归档', '复盘总结'] |
| P9 合同金额 | 需加 items 数量前提 | ✅ 已修正 | line 513 增加 `contractItems.length >= 2` 前提条件 |
| P10 需求去重 | 需说明不调整阈值 | ✅ 已修正 | line 541 明确不调整 fuzzyNameMatch 阈值 |

### P3 剩余问题（2 处）

**问题 1：clipboard 仍使用 navigator.clipboard（line 234）**

P1 已正确改为 Electron IPC 桥接（`window.api.clipboardWriteText`），但 P3 的复制按钮代码（line 234）仍然使用 `navigator.clipboard.writeText(txt)`。这在 Electron renderer 进程中是废弃 API，应改为与 P1 一致的 IPC 桥接方案：

```tsx
// line 234 当前写法（错误）
navigator.clipboard.writeText(txt).then(() => message.success('已复制'))

// 应改为（与 P1 一致）
window.api.clipboardWriteText(txt).then(() => message.success('已复制'))
```

**问题 2：文件名笔误（line 180）**

line 180 提到"复用现有 `INTERNAL_UNIT_PRICES` 和 `levelOptions` 数据"时引用了 `ProfitCalculator.tsx`，但实际文件名是 `ProfitCalculator.ts`（无 tsx 后缀）。这是纯文本笔误，不影响实现但应修正以避免混淆。

### 结论

文档整体质量已达标，修正 P3 的 2 处遗漏后即可交付实现。
