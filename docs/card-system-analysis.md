# PMAer 卡片系统完整分析

> 生成时间：2026-06-23 | 基于 v0.2.0 代码

---

## 一、卡片系统总览

| 卡片 | 文件位置 | 数据来源 | 阶段可见 |
|------|---------|----------|----------|
| SummaryRow（统计行） | `src/components/ProjectHome/SummaryRow.tsx` | project + files | 所有阶段 |
| ProjectInfoPlaceholderCard | `cards/ProjectInfoPlaceholderCard.tsx` | `metadata` | 售前 |
| ContractCard | `cards/ContractCard.tsx` | `files[]` | 售前 |
| EvaluationCard | `cards/EvaluationCard.tsx` | `metadata` | 售前 |
| RequirementCard | `cards/RequirementCard.tsx` | `metadata` | 进行中 |
| IssueCard | `cards/IssueCard.tsx` | `metadata` | 进行中 |
| SignatureCard | `cards/SignatureCard.tsx` | `files[]` | 进行中 |
| OpportunityCard | `cards/OpportunityCard.tsx` | `metadata` | 关闭 |
| DeliverableCard | `cards/DeliverableCard.tsx` | `files[]` | 关闭 |
| SummaryCard | `cards/SummaryCard.tsx` | `metadata` | 关闭 |
| MilestoneModal | `MilestoneModal.tsx` | `project.milestones` | 点击触发 |

---

## 二、SummaryRow — 顶部统计行

**组件**：`SummaryRow.tsx`
**位置**：页面顶部，横向4个卡片

### 4个统计卡片

| # | 卡片 | 数据源 | 显示内容 |
|---|------|--------|----------|
| 1 | 文件数量 | `files.length` | 数字 + "个项目文件" |
| 2 | 里程碑 | `JSON.parse(project.milestones)` | 最近未来里程碑标题 + "下一步 MM-DD" |
| 3 | 待处理 | `files.filter(f => !f.is_analyzed)` | 数字 + "个文件待分析" |
| 4 | AI 摘要 | 无数据（操作按钮） | "查看摘要"/"生成/更新" 按钮 |

### 数据模型

```ts
// project.milestones 解析后
interface Milestone {
  date: string      // YYYY-MM-DD
  title: string     // 里程碑名称
  type: 'milestone' | 'key_node'
}
```

**取值逻辑**：
- 里程碑卡片：`getNextMilestone(milestones)` — 过滤 `date > now`，排序取第一个
- 待处理卡片：`files.filter(f => !f.is_analyzed).length`

### 讨论点
- 里程碑目前只有 `date` 和 `title`，没有"当前进展"字段
- 里程碑判定逻辑：日期 < 当前 = 已完成，日期 > 当前 = 待完成
- **问题**：里程碑数据完全依赖 AI 从文件中提取，用户无法手动添加

---

## 三、FeatureCards — 动态卡片分组

**组件**：`FeatureCards.tsx`
**分组规则**：根据 `project.current_stage` 动态切换

| 阶段 | 项目阶段值 | 显示的3个卡片 |
|------|-----------|--------------|
| **售前** | `售前` | ProjectInfo + Contract + Evaluation |
| **进行中** | `启动/需求/方案/构建/测试/上线/验收/转客户成功` | Requirement + Issue + Signature |
| **关闭** | `关闭` | Opportunity + Deliverable + Summary |

---

## 四、各卡片详细数据源分析

### 4.1 ProjectInfoPlaceholderCard（项目信息）— 售前

**文件**：`cards/ProjectInfoPlaceholderCard.tsx`

| 字段标签 | metadata key | 数据来源 | 当前状态 |
|----------|-------------|---------|---------|
| 项目编号 | `project_code` | AI 提取 | ✅ 有提取 |
| 客户名称 | `customer_name` | — | ❌ **未提取** |
| 联系人 | `contact_person` | AI 提取 | ✅ 有提取 |
| 联系电话 | `contact_phone` | AI 提取 | ✅ 有提取 |
| 客户地址 | `customer_address` | AI 提取 | ✅ 有提取 |
| 项目经理 | `project_manager` | — | ❌ **未提取** |

**数据获取方式**：`JSON.parse(project.metadata)` → 键值对

**问题**：
- `customer_name` 字段 AI 没提取（AI 提取的是 `project_name`）
- `project_manager` 完全没有数据来源
- 所有字段显示 `'-'` 默认值，无编辑入口

---

### 4.2 ContractCard（合同概览）— 售前

**文件**：`cards/ContractCard.tsx`

**数据源**：`allFiles.filter(f => f.category?.includes('合同') || f.category?.includes('售前')).slice(0, 5)`

**显示内容**：
- 文件名 `f.filename`
- 签字状态 `f.signature_status` → "已签字"/"待签字"
- 空态："暂无合同文件"

**数据模型**：
```ts
FileRecord {
  filename: string
  signature_status: 'unsigned' | 'pending' | 'signed' | 'rejected'
  category: string  // 用于筛选
}
```

**讨论点**：
- 合同金额从哪里取？`metadata.contract_amount`？
- 合同签署日期、有效期等信息是否需要展示？

---

### 4.3 EvaluationCard（项目评估）— 售前

**文件**：`cards/EvaluationCard.tsx`

| 字段标签 | metadata key | 当前状态 |
|----------|-------------|---------|
| 预估合同金额 | `contract_amount` | ❌ **未提取** |
| 成本评估 | `cost_estimate` | ❌ **未提取** |
| 预估利润率 | `profit_rate` | ❌ **未提取** |
| 人天预估 | `person_days` | ❌ **未提取** |

**当前状态**：所有字段都显示默认值 `'-'`，因为 AI 提示词中没有提取这些字段。

**讨论点**：
- 这些数据从哪里来？AI 从合同文件中提取？还是用户手动输入？
- 如果是 AI 提取，需要在 `EXTRACT_KEY_INFO_PROMPT` 中添加这些字段
- 如果是手动输入，需要一个编辑 UI

---

### 4.4 RequirementCard（需求跟踪）— 进行中

**文件**：`cards/RequirementCard.tsx`

**数据源**：`metadata.requirements` → 数组

**数据结构**（推断）：
```ts
interface Requirement {
  name: string
  detail?: string
  status?: 'done' | 'progress' | 'delayed' | 'pending'
  statusText?: string
}
```

**显示内容**：状态圆点 + 名称 + 详情 + 状态标签，最多3项

**当前状态**：❌ **metadata 中无此字段**，AI 提示词未提取，显示空态

**讨论点**：
- 需求列表从哪里来？
  - 方案A：AI 从需求文档中提取
  - 方案B：用户手动录入
  - 方案C：从文件分类中派生（如"需求文档"阶段的文件）
- 需求状态如何判定？AI 分析？用户标记？

---

### 4.5 IssueCard（关键问题）— 进行中

**文件**：`cards/IssueCard.tsx`

**数据源**：`metadata.key_issues` → 数组

**数据结构**（推断）：
```ts
interface KeyIssue {
  text?: string
  priority?: 'high' | 'medium' | 'low'
  status?: 'resolved' | string
}
```

**显示内容**：优先级圆点 + 问题文本 + 解决状态标签，最多3项

**当前状态**：❌ **metadata 中无此字段**，显示空态

**讨论点**：
- 问题列表从哪里来？
  - AI 从会议纪要/测试报告中提取？
  - 用户手动录入？
- 问题优先级和状态如何维护？

---

### 4.6 SignatureCard（签字追踪）— 进行中

**文件**：`cards/SignatureCard.tsx`

**数据源**：`allFiles.filter(f => f.signature_status && f.signature_status !== 'unsigned')`

**数据模型**：
```ts
// 统计
signed = files.filter(f => f.signature_status === 'signed').length
total = files.filter(f => f.signature_status !== 'unsigned').length
percent = signed / total * 100
```

**显示内容**：
- 统计行：已签(N) / 待签(N) / 百分比 + 进度条
- 文件列表（最多3个）：文件名 + 签字状态标签

**当前状态**：✅ 数据完整，来自 `FileRecord.signature_status`

**讨论点**：
- 签字追踪只看文件级别的 `signature_status`，没有"签字里程碑"概念
- 是否需要区分不同类型的签字（合同签字、验收签字、变更签字）？

---

### 4.7 OpportunityCard（拓展商机）— 关闭

**文件**：`cards/OpportunityCard.tsx`

**数据源**：`metadata.opportunities` → 数组

**数据结构**（推断）：
```ts
interface Opportunity {
  name: string
  description?: string
  status?: 'planned' | 'confirmed' | 'in-progress'
  statusText?: string
}
```

**显示内容**：💡 图标 + 名称 + 描述 + 状态标签，最多3项

**当前状态**：❌ **metadata 中无此字段**，显示空态

**讨论点**：
- 商机数据从哪里来？AI 从客户沟通记录中提取？还是用户手动录入？
- 商机状态如何维护？

---

### 4.8 DeliverableCard（交付物清单）— 关闭

**文件**：`cards/DeliverableCard.tsx`

**数据源**：`allFiles.filter(f => f.category?.includes('交付') || f.category?.includes('验收')).slice(0, 5)`

**显示内容**：勾选标记(✓/○) + 文件名 + 签字状态标签

**当前状态**：✅ 数据来自文件分类筛选

**讨论点**：
- 交付物清单是基于文件分类筛选，不是独立的数据模型
- 是否需要标记"已交付/未交付"状态？

---

### 4.9 SummaryCard（项目总结）— 关闭

**文件**：`cards/SummaryCard.tsx`

**数据源**：`JSON.parse(project.metadata).project_overview` → 纯文本

**显示内容**：
- 文本内容，默认截断4行，可展开/收起
- 超过100字符时显示 "展开全部"/"收起" 按钮

**当前状态**：❌ **metadata 中无此字段**，显示空态

**讨论点**：
- 项目总结从哪里来？
  - AI 从所有文件中综合分析生成？
  - 用户手动填写？
- 总结的粒度？一段话 vs 结构化（做得好的/待改进的/经验教训）

---

## 五、MilestoneModal — 里程碑时间轴

**组件**：`MilestoneModal.tsx`

### 数据模型

```ts
// src/types/index.ts
interface Milestone {
  date: string      // YYYY-MM-DD
  title: string     // 里程碑名称
  type: 'milestone' | 'key_node'
}
```

### 里程碑状态计算

| 状态 | 条件 | 颜色 | 样式 |
|------|------|------|------|
| done | `date < now` | 靛蓝 #4F46E5 | 划线 |
| next | 第一个未来里程碑 | 琥珀 #F59E0B | 粗体 + "下一步" Tag |
| pending | 未来非最近 | 灰色 #D1D5DB | 默认 |
| overdue | 逾期但非 done | 红色 #EF4444 | 默认 |

### 关键里程碑判定

标题包含 "合同"、"上线"、"验收" → 显示 ⭐ 星标

### 当前数据来源

- **AI 提取**：`EXTRACT_MILESTONES_PROMPT` 从文件内容中提取里程碑
- **合并逻辑**：新里程碑按 `date + title` 去重后追加到已有列表

### 讨论点

1. **里程碑类型**：目前只有 `milestone` 和 `key_node` 两种，是否需要更多？
2. **里程碑状态**：目前只靠日期判定，没有"进行中"状态
3. **里程碑关联**：里程碑和项目阶段的关系是什么？
4. **里程碑输入**：用户能否手动添加/编辑里程碑？
5. **里程碑提醒**：是否需要到期提醒？

---

## 六、AI 提取字段汇总

### 当前 AI 提取的字段

| 提示词 | 提取字段 | 存储位置 |
|--------|---------|---------|
| `EXTRACT_KEY_INFO_PROMPT` | `project_code`, `contract_no`, `contact_person`, `contact_phone`, `customer_address`, `project_name` | `project.metadata` |
| `EXTRACT_MILESTONES_PROMPT` | `date`, `title`, `type` | `project.milestones` |

### 卡片需要但未提取的字段

| 卡片 | 缺失字段 | 优先级 |
|------|---------|--------|
| ProjectInfoPlaceholderCard | `customer_name`, `project_manager` | P1 |
| EvaluationCard | `contract_amount`, `cost_estimate`, `profit_rate`, `person_days` | P1 |
| RequirementCard | `requirements[]` | P1 |
| IssueCard | `key_issues[]` | P1 |
| OpportunityCard | `opportunities[]` | P2 |
| SummaryCard | `project_overview` | P2 |

---

## 七、CSS 样式定义

### 主要样式文件

| 文件 | 路径 | 内容 |
|------|------|------|
| 设计系统变量 | `src/index.css` | `:root` CSS 变量 |
| 卡片样式 | `src/styles/overrides.css` | 行 432-1006 |
| JS 样式常量 | `projectHome.styles.ts` | 阶段颜色、文件类型颜色 |
| Markdown 预览 | `src/styles/markdown-preview.css` | AI 摘要弹窗 |

### CSS 类名索引

| CSS 类 | 行号 | 用途 |
|--------|------|------|
| `.summary-row`, `.summary-card*` | 432-535 | 顶部统计行 |
| `.feature-row`, `.feature-card` | 538-557 | 功能卡片网格 |
| `.fc-header`, `.fc-title-row`, `.fc-icon`, `.fc-title`, `.fc-body` | 559-611 | 卡片头部结构 |
| `.req-*` | 706-765 | 需求跟踪行 |
| `.issue-*` | 768-807 | 问题行 |
| `.sig-*` | 827-885 | 签字追踪 |
| `.info-grid`, `.info-item` | 888-904 | 项目信息网格 |
| `.eval-*` | 907-932 | 评估行 |
| `.opp-*` | 935-980 | 商机行 |
| `.deliverable-*`, `.del-*` | 983-1006 | 交付物行 |
| `.ms-*` | 623-703 | 里程碑紧凑视图 |

---

## 八、数据流图

```
文件上传 → AI 分类 → 提取 stage/category/subcategory
         → AI 分析 → 提取 metadata (6个字段) → 合并到 project.metadata
                   → 提取 milestones → 合并到 project.milestones
         → signature_status 检测

卡片数据来源：
├── project.metadata (JSON) → ProjectInfo/Evaluation/Requirement/Issue/Opportunity/Summary
├── project.milestones (JSON) → SummaryRow里程碑 / MilestoneModal
└── files[] (FileRecord[]) → Contract/Signature/Deliverable (按category筛选)
```

---

## 九、需要讨论的问题

### 1. 里程碑如何界定？

**当前实现**：
- AI 从文件中提取日期 + 标题
- 判定逻辑：日期 < 当前 = 已完成，日期 > 当前 = 待完成
- 关键词判定：标题含"合同/上线/验收" = 关键里程碑

**需要讨论**：
- 里程碑是固定模板（合同签署、上线、验收）还是完全由 AI 提取？
- 里程碑是否需要关联项目阶段？
- 用户能否手动添加/编辑里程碑？
- 里程碑状态除了日期判定，是否需要"进行中"状态？

### 2. 卡片数据输入方式

| 方式 | 适用场景 | 优缺点 |
|------|---------|--------|
| AI 自动提取 | 有文件内容可分析 | 自动化，但依赖文件质量 |
| 用户手动输入 | AI 无法提取的字段 | 精准，但增加用户负担 |
| 从文件分类派生 | SignatureCard/DeliverableCard | 已实现，数据来自文件筛选 |
| 混合模式 | 大多数卡片 | AI 提取 + 用户补充/修正 |

### 3. 优先级建议

**P1 — 核心数据模型**：
1. `metadata.customer_name` — 项目信息卡片缺失
2. `metadata.project_manager` — 项目信息卡片缺失
3. `metadata.contract_amount` 等 — 评估卡片缺失
4. `metadata.requirements[]` — 需求跟踪卡片
5. `metadata.key_issues[]` — 问题卡片

**P2 — 扩展数据模型**：
6. `metadata.opportunities[]` — 商机卡片
7. `metadata.project_overview` — 项目总结卡片
8. 里程碑手动编辑 UI
