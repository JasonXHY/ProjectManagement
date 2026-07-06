# PMAer v0.2.0 全面审查报告

> 审查时间：2026-06-27 | 审查范围：需求实现、代码质量、Bug、架构设计、业务体验、金蝶版适配方案
> **二次验证**：2026-06-27 已对照源码逐项确认，标注"已验证"的问题均为实际存在

---

## 第一部分：需求实现审查

### 1.1 卡片系统实现状态

| 卡片 | 设计要求 | 实现状态 | 问题 |
|------|----------|----------|------|
| 项目信息 | AI 提取 6 字段 + 手动填写 | 已实现 | 手动字段未标注"待填写" |
| 合同概览 | 分项明细 + 付款里程碑 + 已确认收入 | 已实现 | 分项数据来源未验证 |
| 项目评估 | 利润测算工具（web + 卡片版） | 已实现 | 阈值已修正为小数 |
| 需求跟踪 | AI 提取 + 时间轴 + 手动录入 | 已实现 | 时间轴 content 格式未约束 |
| 关键问题 | AI 识别 + 优先级 + 手动调整 | 已实现 | 无 |
| 签字追踪 | 金额档位 + 文件清单 + 上传 | 已实现 | 文件关联逻辑待验证 |
| 拓展商机 | AI 识别关键词 + 状态管理 | 已实现 | 无 |
| 交付物清单 | 自动统计 + 版本号 | 部分实现 | 自动统计未对接文件分类 |
| 项目总结 | AI 生成初稿 + 用户编辑 | 已实现 | 无 |
| AI 摘要 | Markdown 渲染 | 已实现 | 弹窗尺寸需确认 800px |

### 1.2 阶段-卡片映射

| 分组 | 阶段 | 卡片 | 状态 |
|------|------|------|------|
| presale | 售前 | 项目信息 + 合同概览 + 项目评估 | 正确 |
| progress | 启动/需求/方案/构建/测试/上线/验收 | 需求跟踪 + 关键问题 + 签字追踪 | 正确 |
| handover | 转客户成功 | 签字追踪 + 拓展商机 + 交付物清单 | 已实现 |
| closed | 关闭 | 拓展商机 + 交付物清单 + 项目总结 | 正确 |

### 1.3 统计行

| 卡片 | 设计要求 | 实现状态 |
|------|----------|----------|
| 文件数量 | COUNT(files) | 正确 |
| 里程碑 | 下一步里程碑 + 弹窗时间轴 | 正确 |
| 待处理 | COUNT(files WHERE ai_analyzed = 0) | 正确 |
| AI 摘要 | Markdown 渲染 | 正确 |

---

## 第二部分：Bug 与代码质量问题

> 以下所有问题均已对照源码逐项验证（2026-06-27），确认为当前代码中真实存在的缺陷。

### 2.1 Critical（必须修复）

#### C1: ai:analyze 内部 metadata 自覆盖

**文件**：`electron/ipc/ai-handlers.ts`
**行号**：140、184-188、203-216
**问题**：第 140 行 `project = projectDb.getProject(projectId)` 只读取一次。第 184-188 行基于这份旧数据写入 `project_overview`，第 203-216 行又基于**同一份旧数据**写入 `key_info`。第二次写入必然覆盖第一次的 `project_overview`。
**触发条件**：每次 `ai:analyze` 调用，不需要并发。
**修复**：在第 203 行前重新读取 `project = projectDb.getProject(projectId)`，或累积所有变更后统一写入一次。

#### C2: 6 个卡片组件 JSON.parse 无 try-catch 保护

**问题**：`project.metadata ? JSON.parse(project.metadata) : {}` 只防了 null，不防损坏的 JSON。metadata 损坏时整个 React 树崩溃。
**注意**：项目中尚不存在 `parseMetadata()` 工具函数，需要新建。

受影响文件：

| 文件 | 行号 |
|------|------|
| ContractCard.tsx | 10 |
| EvaluationCard.tsx | 10 |
| IssueCard.tsx | 15 |
| OpportunityCard.tsx | 6 |
| RequirementCard.tsx | 9 |
| ProjectInfoPlaceholderCard.tsx | 6 |

**修复**：新建 `src/utils/parseMetadata.ts`（wrap JSON.parse + try-catch），替换上述 6 处调用。

### 2.2 High（应该修复）

#### H1: AI 分类结果未校验阶段合法性

**问题**：存在两条分类路径，校验情况不同：

| 路径 | 文件 | category 校验 | stage 校验 |
|------|------|--------------|-----------|
| 手动/重分类 | `classify.ts` | 无 | 无 |
| 上传时分类 | `upload.ts` | `sanitizeCategory`（只清理字符，不拒绝非法值） | 无 |

**修复**：两条路径统一校验 `category ∈ FILE_CLASSIFICATION_STAGES`，不合法降级为"未分类"；校验 `stage ∈ DEFAULT_STAGES`，不合法降级为 null。

#### H2: classify.ts 未调用 sanitizeCategory

**文件**：`electron/ipc/handlers/classify.ts`
**问题**：`sanitizeCategory()` 只定义在 `upload.ts` 中。`classify.ts` 的分类路径（手动重分类）完全不做字符清理，AI 返回的 category 值直接用于文件路径拼接。

#### H3: StageSidebar 硬编码阶段列表

**文件**：`src/components/ProjectHome/StageSidebar.tsx:26-37`
**问题**：自定义 10 阶段数组，不导入 `STAGE_DEFINITIONS`。如果阶段定义变更，侧边栏不会同步。（`stage-menu.ts` 已正确使用共享数据源。）

#### H4: 数据库无 Schema 版本管理

**文件**：`electron/database/index.ts`
**问题**：9 个 `try { ALTER TABLE } catch {}` 迁移块，每次启动都重新执行，依赖空 catch 忽略"列已存在"错误。无版本号、无迁移记录。

### 2.3 Medium（影响体验）

#### M1: Milestone 与 MilestoneExtended 类型不匹配

**文件**：`src/types/index.ts`（两个接口定义）、ContractCard.tsx、ContractDetailModal.tsx
**问题**：组件导入 `Milestone` 类型（只有 date/title/type），但代码中访问 `type === 'payment'`、`.confirmed`、`.amount` 等 `MilestoneExtended` 才有的字段。TypeScript 编译通过是因为 JSON.parse 返回 any，运行时可能 undefined。
**修复**：统一使用 `MilestoneExtended` 类型。

#### M2: Handover 导出使用 filename 而非 stored_path

**文件**：`electron/services/handover-service.ts:113`
**问题**：`path.join(projectPath, file.filename)` — 文件分类后移动到子目录，`filename` 只是原始文件名，找不到文件，导致导出 zip 为空。
**修复**：改用 `file.stored_path`。

#### M3: classify.ts 文件读取失败返回空字符串

**文件**：`electron/ipc/handlers/classify.ts:219`
**问题**：`.catch(() => '')` — 文件读取失败时返回空字符串送入 AI 分类，产生无意义结果。
**修复**：返回 null，调用方检查后跳过分类。

#### M4: 3 个卡片组件 render 回调使用 any

**文件**：
- IssueCard.tsx:34 `(issue: any, i: number)`
- OpportunityCard.tsx:22 `(opp: any, i: number)`
- RequirementCard.tsx:27 `(r: any, i: number)`

**注意**：Props 接口本身已使用 `Project` 类型，问题在 `.map()` 回调的参数类型。

#### M5: 数据库迁移 catch 块过于宽泛

**文件**：`electron/database/index.ts`（9 处）
**问题**：`try { ALTER TABLE } catch {}` 设计用于忽略"列已存在"，但也会吞掉 I/O 错误、权限错误等。建议至少加 `console.debug` 或缩小 catch 范围。

### 2.4 后续版本优化

| 编号 | 优化项 | 说明 |
|------|--------|------|
| OPT-1 | StageSidebar 读取 custom_stages | 支持用户自定义阶段 |
| OPT-2 | 交付物自动统计 | 基于文件分类自动识别交付物 |
| OPT-3 | 金蝶版分类方案 | 项目级 classification_profile |
| OPT-4 | Metadata 拆子表 | 解决并发读写和性能问题 |
| OPT-5 | 全局错误反馈 | Toast 通知 + 统一错误格式 |
| OPT-6 | 加载状态 | 骨架屏 + AI 分析中状态 |
| OPT-7 | 集中状态管理 | Context 或 Zustand 统一管理 |
| OPT-8 | AI 分类置信度 | 低置信度标记为"待确认" |

---

## 第三部分：架构与设计审查

### 3.1 项目生命周期阶段 vs 文件分类阶段概念混淆

**问题**：系统中有两套"阶段"概念：
- **项目阶段**（3 个）：售前、进行中、关闭 — 用于驱动特色卡片切换
- **文件分类阶段**（10 个）：售前、启动、需求、方案、构建、测试、上线、验收、转客户成功、关闭 — 用于文件导航

两者使用重叠的中文名称（"售前"、"关闭"），AI 分类 prompt 在同一个响应中要求返回两种阶段，但验证和传播走完全不同的代码路径，没有交叉校验。

**建议**：
- 重命名文件分类阶段为"文件生命周期阶段"或"文件归档阶段"，避免与项目阶段混淆
- 在 AI prompt 中明确区分两个概念，使用不同的字段名
- 考虑在类型定义中用不同的接口名（如 `ProjectStage` vs `FileLifecycleStage`）

### 3.2 Metadata JSON 大字段问题

**问题**：所有卡片数据（requirements、issues、evaluation、signatures、opportunities、deliverables、summary）都塞在一个 `metadata` JSON 字段里。每次读取都要全量解析，每次写入都要全量序列化。随着数据增长，性能会下降，且并发写入必然丢数据。

**建议（后续版本大改）**：
- 将 metadata 拆分为独立子表：`project_requirements`、`project_issues`、`project_evaluation`、`project_signatures`、`project_opportunities`、`project_deliverables`、`project_summary`
- 每个子表有独立的 CRUD 操作，避免全量读写
- 保留 `metadata` 字段仅用于轻量级扩展字段

### 3.3 状态管理分散

**问题**：每个卡片组件独立解析 `project.metadata`，没有集中状态管理。同一个 JSON 字符串在页面上被解析 9 次（9 个卡片各一次），浪费计算。

**建议**：
- 在 ProjectHome 层解析一次 metadata，通过 Context 或 props 传递给子卡片
- 或者引入轻量状态管理（如 Zustand），各卡片订阅自己关心的字段

### 3.4 AI 分类 Pipeline 缺乏反馈机制

**问题**：AI 分类结果直接写入数据库，用户无法看到分类的置信度或理由。分类错误时，用户只能手动修改，系统不会学习。

**建议（后续版本）**：
- 分类结果增加 `confidence` 字段
- 低置信度结果标记为"待确认"
- 用户手动修改后，记录修正日志，未来用于 fine-tune 或 few-shot 示例

---

## 第四部分：业务用户体验审查

### 4.1 错误反馈缺失

**问题**：所有后端错误只输出到 console，用户界面没有任何反馈。文件上传失败、AI 分类失败、数据库写入失败，用户看到的就是"什么都没发生"。

**修复**：
- 添加全局 Toast 通知组件
- IPC handler 返回统一的 `{ success, error? }` 格式
- 前端根据 success 字段显示成功/失败提示

### 4.2 加载状态缺失

**问题**：AI 分类、结构化提取、签字检测等异步操作没有 loading 指示器。用户不知道系统是在工作还是卡住了。

**修复**：
- 文件上传后显示"AI 分析中..."状态
- 卡片数据加载时显示骨架屏
- 异步操作完成后自动刷新相关卡片

### 4.3 交付物清单未自动统计

**问题**：设计文档要求交付物清单自动从文件分类中识别交付物（蓝图、操作手册、测试脚本等），但当前实现只从 `project.metadata.deliverables` 读取，没有自动统计。

**修复**：参考 `card-system-design-decisions.md` §10，基于文件分类阶段和子分类自动识别交付物。

### 4.4 签字追踪文件关联待验证

**问题**：签字文件通过 `files.category` 关联，但上传时 category 由 AI 判断，准确性无法保证。

**修复**：AI 判断优先 + 用户可手动修改 category，已在数据源确认中约定，需验证实现。

---

## 第五部分：金蝶版差异化适配方案

### 5.1 背景

金蝶集团实施方法论 V10.0 定义了 8 个阶段、83 个标准交付物模板。当前 PMAer 的通用版本使用 10 个文件分类阶段，子分类较为粗略。需要在设置中提供"金蝶版"分类配置，切换后针对金蝶员工进行特异化适配。

### 5.2 金蝶方法论阶段结构

| 阶段编号 | 阶段名称 | 文件数量 | 核心交付物 |
|----------|----------|----------|------------|
| 0 | 项目管理（贯穿全程） | 10 | 风险跟踪表、会议纪要、周报、总体计划、变更申请单 |
| 1 | 启动阶段 | 10 | 通讯录、任命书、交接单、干系人分析、启动会、章程、计划 |
| 2 | 需求阶段 | 8 | 调研计划、问卷、调研纪要、技术调研、需求跟踪矩阵、调研报告 |
| 3 | 方案阶段 | 13 | 培训方案、蓝图（总册/分册）、需求规格说明书、配置文档、确认单 |
| 4 | 构建阶段 | 8 | 数据收集计划/表、开通函件、技术设计说明书、开发跟踪表 |
| 5 | 测试阶段 | 10 | 测试计划/用例/报告、操作手册、培训材料、UAT 方案/确认单 |
| 6 | 上线阶段 | 9 | 切换方案、权限配置、初始化清单、检查表、确认单、运维方案 |
| 7 | 验收阶段 | 8 | 文档清单、验收报告、确认单（实施/开发）、交接确认单 |

### 5.3 金蝶版文件分类阶段映射

**通用版 → 金蝶版映射关系**：

| 通用版阶段 | 金蝶版阶段 | 差异说明 |
|------------|------------|----------|
| 售前 | 售前（保持不变） | 金蝶版不在此范围 |
| 启动 | 0项目管理 + 1启动阶段 | 合并为两层：贯穿项 + 启动 |
| 需求 | 2需求阶段 | 子分类扩展 |
| 方案 | 3方案阶段 | 子分类大幅扩展 |
| 构建 | 4构建阶段 | 子分类扩展 |
| 测试 | 5测试阶段 | 子分类扩展 |
| 上线 | 6上线阶段 | 子分类扩展 |
| 验收 | 7验收阶段 | 子分类扩展 |

### 5.4 金蝶版子分类详细定义

```typescript
// 金蝶版文件分类阶段定义
export const KINGDEE_STAGE_DEFINITIONS: StageDef[] = [
  {
    name: '售前',
    subcategories: ['销售方案', '报价单', '合同原件', '客户沟通', '成本评估', 'POC材料']
    // 与通用版一致，不修改
  },
  {
    name: '0项目管理',
    subcategories: [
      '风险跟踪记录',    // 01风险跟踪记录表
      '会议纪要',        // 02会议纪要
      '培训签到',        // 03培训签到表（贯穿）
      '周报与汇报',      // 04双周滚动周报 + 05周工作汇报
      '总体计划',        // 06总体计划
      '暂停申请',        // 07客户发起项目暂停申请单
      '问题跟踪',        // 08问题跟踪记录表
      '变更申请',        // 09项目变更申请单
      '催促与告知函',    // 10催促确认函 + 推进告知函
    ]
  },
  {
    name: '1启动阶段',
    subcategories: [
      '通讯录',          // 01项目通讯录
      '任命书',          // 02项目经理任命书（金蝶方）
      '售前交接',        // 03售前交接会纪要 + 销售转实施交接单
      '干系人分析',      // 04干系人分析表
      '启动会',          // 05启动会
      '项目章程',        // 06客户方任命书 + 07项目章程
      '欢迎会',          // 08关键用户欢迎会
      '项目计划',        // 09总体计划
      '人天投入',        // 10人天投入表
    ]
  },
  {
    name: '2需求阶段',
    subcategories: [
      '调研计划',        // 01项目调研计划
      '调研问卷',        // 02调研问卷
      '调研纪要',        // 03业务调研纪要 + 高层访谈纪要
      '技术调研',        // 04技术调研纪要
      '需求跟踪',        // 05需求跟踪矩阵
      '调研报告',        // 06调研报告
      '调研汇报',        // 07调研汇报
      '培训需求',        // 08培训需求
    ]
  },
  {
    name: '3方案阶段',
    subcategories: [
      '培训方案与签到',  // 01培训方案 + 01培训签到表
      '会议纪要',        // 02会议纪要 + 02流程模拟结果纪要
      '业务蓝图',        // 03业务蓝图-总册/分册
      '系统部署与需求',  // 03系统部署清单 + 03需求开发清单
      '需求规格与评审',  // 04定制化需求规格说明书 + 04需求变更申请单 + 04需求评审记录
      '系统配置',        // 06系统配置文档
      '蓝图确认',        // 07业务蓝图汇报 + 07业务蓝图确认单 + 07开发需求设计确认单
    ]
  },
  {
    name: '4构建阶段',
    subcategories: [
      '基础数据收集',    // 01基础数据收集计划 + 02基础数据收集表
      '软件开通',        // 03软件开通函件 + 04软件开通确认单
      '技术设计',        // 05定制化技术设计说明书
      '开发跟踪',        // 06需求开发跟踪表
      'UAT培训',         // 07UAT测试培训 + 08培训签到表
    ]
  },
  {
    name: '5测试阶段',
    subcategories: [
      '测试计划',        // 01测试计划
      '测试用例',        // 02测试用例（功能）+ 02测试用例（流程）
      '测试跟踪与报告',  // 03测试进度跟踪表 + 04测试报告
      '操作手册',        // 05用户操作手册
      '培训',            // 06培训材料 + 07培训签到表 + 08培训考核表
      'UAT测试',         // 09UAT测试方案 + 10UAT测试确认单
    ]
  },
  {
    name: '6上线阶段',
    subcategories: [
      '上线切换方案',    // 01上线切换方案
      '权限与初始化',    // 02系统用户与权限 + 03系统初始化模板清单
      '上线检查',        // 04上线工作检查表
      '上线动员',        // 05上线动员会PPT + 06上线动员会会议纪要
      '问题跟踪',        // 07问题跟踪表
      '上线确认',        // 08系统上线完成确认单
      '运维方案',        // 09系统上线运维方案
    ]
  },
  {
    name: '7验收阶段',
    subcategories: [
      '文档清单',        // 01项目文档清单
      '项目案例与报告',  // 02项目案例PPT + 03项目验收报告PPT
      '验收会议',        // 04验收会议纪要
      '实施确认',        // 05实施完成确认单
      '开发确认',        // 06开发完成确认单
      '交接',            // 07交接文档清单 + 08实施转客户成功交接确认单
    ]
  },
]
```

### 5.5 金蝶版文件识别规则

金蝶方法论文件有高度标准化的命名规范：`{NN}{名称}_模板（for V10.0）.{ext}`。可以利用这个规律实现高精度文件名启发式分类。

**文件名匹配规则**：

```typescript
// 金蝶版文件名启发式规则
export const KINGDEE_FILENAME_HEURISTICS: Record<string, { stage: string; subcategory: string; keywords: string[] }> = {
  // 0项目管理 - 贯穿全程
  '风险跟踪': { stage: '0项目管理', subcategory: '风险跟踪记录', keywords: ['风险', '跟踪', 'risk'] },
  '会议纪要': { stage: '0项目管理', subcategory: '会议纪要', keywords: ['会议纪要'] },
  '双周滚动': { stage: '0项目管理', subcategory: '周报与汇报', keywords: ['周报', '双周', '滚动'] },
  '工作汇报': { stage: '0项目管理', subcategory: '周报与汇报', keywords: ['汇报', '周报'] },
  '总体计划': { stage: '0项目管理', subcategory: '总体计划', keywords: ['总体计划', '项目计划'] },
  '暂停申请': { stage: '0项目管理', subcategory: '暂停申请', keywords: ['暂停', '申请'] },
  '问题跟踪': { stage: '0项目管理', subcategory: '问题跟踪', keywords: ['问题', '跟踪', 'issue'] },
  '变更申请': { stage: '0项目管理', subcategory: '变更申请', keywords: ['变更', '申请', 'change'] },
  '催促确认函': { stage: '0项目管理', subcategory: '催促与告知函', keywords: ['催促', '确认函', '告知函'] },

  // 1启动阶段
  '通讯录': { stage: '1启动阶段', subcategory: '通讯录', keywords: ['通讯录', '联系人'] },
  '任命书': { stage: '1启动阶段', subcategory: '任命书', keywords: ['任命', '项目经理'] },
  '交接会': { stage: '1启动阶段', subcategory: '售前交接', keywords: ['交接', '售前', '销售转实施'] },
  '干系人': { stage: '1启动阶段', subcategory: '干系人分析', keywords: ['干系人', 'stakeholder'] },
  '启动会': { stage: '1启动阶段', subcategory: '启动会', keywords: ['启动会', 'kickoff'] },
  '项目章程': { stage: '1启动阶段', subcategory: '项目章程', keywords: ['章程', 'charter'] },
  '欢迎会': { stage: '1启动阶段', subcategory: '欢迎会', keywords: ['欢迎', '关键用户'] },
  '人天投入': { stage: '1启动阶段', subcategory: '人天投入', keywords: ['人天', '投入'] },

  // 2需求阶段
  '调研计划': { stage: '2需求阶段', subcategory: '调研计划', keywords: ['调研计划'] },
  '调研问卷': { stage: '2需求阶段', subcategory: '调研问卷', keywords: ['问卷', '调研问卷'] },
  '调研纪要': { stage: '2需求阶段', subcategory: '调研纪要', keywords: ['调研纪要', '访谈纪要', '业务调研'] },
  '技术调研': { stage: '2需求阶段', subcategory: '技术调研', keywords: ['技术调研'] },
  '需求跟踪': { stage: '2需求阶段', subcategory: '需求跟踪', keywords: ['需求跟踪', '需求矩阵'] },
  '调研报告': { stage: '2需求阶段', subcategory: '调研报告', keywords: ['调研报告'] },
  '调研汇报': { stage: '2需求阶段', subcategory: '调研汇报', keywords: ['调研汇报'] },

  // 3方案阶段
  '培训方案': { stage: '3方案阶段', subcategory: '培训方案与签到', keywords: ['培训方案'] },
  '蓝图': { stage: '3方案阶段', subcategory: '业务蓝图', keywords: ['蓝图', '业务蓝图', 'blueprint'] },
  '需求规格': { stage: '3方案阶段', subcategory: '需求规格与评审', keywords: ['规格说明', '需求评审', '需求变更'] },
  '系统配置': { stage: '3方案阶段', subcategory: '系统配置', keywords: ['配置文档', '系统配置'] },
  '蓝图确认': { stage: '3方案阶段', subcategory: '蓝图确认', keywords: ['蓝图确认', '蓝图汇报', '设计确认'] },
  '部署清单': { stage: '3方案阶段', subcategory: '系统部署与需求', keywords: ['部署清单', '开发清单'] },

  // 4构建阶段
  '数据收集': { stage: '4构建阶段', subcategory: '基础数据收集', keywords: ['数据收集', '基础数据'] },
  '软件开通': { stage: '4构建阶段', subcategory: '软件开通', keywords: ['开通函', '开通确认'] },
  '技术设计': { stage: '4构建阶段', subcategory: '技术设计', keywords: ['技术设计', '设计说明'] },
  '开发跟踪': { stage: '4构建阶段', subcategory: '开发跟踪', keywords: ['开发跟踪', '开发进度'] },

  // 5测试阶段
  '测试计划': { stage: '5测试阶段', subcategory: '测试计划', keywords: ['测试计划'] },
  '测试用例': { stage: '5测试阶段', subcategory: '测试用例', keywords: ['测试用例', '用例'] },
  '测试报告': { stage: '5测试阶段', subcategory: '测试跟踪与报告', keywords: ['测试报告', '测试进度'] },
  '操作手册': { stage: '5测试阶段', subcategory: '操作手册', keywords: ['操作手册', '用户手册'] },
  'UAT': { stage: '5测试阶段', subcategory: 'UAT测试', keywords: ['UAT', '用户验收'] },

  // 6上线阶段
  '切换方案': { stage: '6上线阶段', subcategory: '上线切换方案', keywords: ['切换', '上线切换'] },
  '权限': { stage: '6上线阶段', subcategory: '权限与初始化', keywords: ['权限', '初始化', '用户权限'] },
  '上线检查': { stage: '6上线阶段', subcategory: '上线检查', keywords: ['检查表', '上线工作'] },
  '上线动员': { stage: '6上线阶段', subcategory: '上线动员', keywords: ['动员会', '上线动员'] },
  '上线确认': { stage: '6上线阶段', subcategory: '上线确认', keywords: ['上线完成', '上线确认'] },
  '运维方案': { stage: '6上线阶段', subcategory: '运维方案', keywords: ['运维', '运维方案'] },

  // 7验收阶段
  '文档清单': { stage: '7验收阶段', subcategory: '文档清单', keywords: ['文档清单', '项目文档'] },
  '验收报告': { stage: '7验收阶段', subcategory: '项目案例与报告', keywords: ['验收报告', '案例', '验收PPT'] },
  '实施确认': { stage: '7验收阶段', subcategory: '实施确认', keywords: ['实施完成', '实施确认'] },
  '开发确认': { stage: '7验收阶段', subcategory: '开发确认', keywords: ['开发完成', '开发确认'] },
  '交接确认': { stage: '7验收阶段', subcategory: '交接', keywords: ['交接文档', '交接确认', '客户成功'] },
}
```

### 5.6 金蝶版 AI 分类 Prompt 增强

金蝶版 prompt 需要在通用版基础上增加以下内容：

```
你正在为金蝶集团实施项目分类文件。金蝶实施方法论 V10.0 定义了 8 个阶段（0项目管理-7验收阶段）。

分类规则：
1. 文件名包含"蓝图" → 阶段：3方案阶段，子分类：业务蓝图
2. 文件名包含"确认单" → 根据内容判断具体确认类型（蓝图确认/软件开通/上线确认/实施确认/开发确认）
3. 文件名包含"签到表" → 根据阶段判断归属（方案阶段/构建阶段/测试阶段都有培训签到）
4. 文件名包含"纪要" → 根据内容判断（调研纪要→2需求阶段，会议纪要→看上下文决定阶段）
5. 文件名以数字编号开头（如"03"）→ 参考编号对应的标准交付物

注意区分：
- "业务蓝图"（3方案阶段）vs "技术设计说明书"（4构建阶段）
- "实施完成确认单"（7验收阶段）vs "系统上线完成确认单"（6上线阶段）
- "需求开发清单"（3方案阶段）vs "需求开发跟踪表"（4构建阶段）
```

### 5.7 分类方案架构：项目级配置（替代全局设置方案）

**用户关切**：如果放在全局设置中，切换后所有已有项目的文件分类映射都会出问题。分类方案应该在新建项目时选择，确保每个项目独立。

**最终方案：项目级 classification_profile**

#### 5.7.1 数据模型变更

```typescript
// projects 表新增字段
ALTER TABLE projects ADD COLUMN classification_profile TEXT DEFAULT 'generic';
// 可选值：'generic'（通用版） | 'kingdee'（金蝶版）
```

#### 5.7.2 新建项目流程

```
新建项目弹窗
┌──────────────────────────────────────────┐
│  项目名称：[              ]               │
│  客户名称：[              ]               │
│  合同金额：[              ]               │
│                                          │
│  分类方案：                               │
│  ○ 通用版（10 阶段，适用于各类项目）       │
│  ○ 金蝶版（9 阶段，适配实施方法论V10.0）   │
│                                          │
│  [取消]  [创建项目]                       │
└──────────────────────────────────────────┘
```

- 创建时选定，写入 `project.classification_profile`
- 项目详情页根据该字段决定：
  - 侧边栏显示哪些阶段
  - AI 分类使用哪套 prompt 和启发式规则
  - 签字文件清单使用哪套规则
- 创建后不可修改（避免已分类文件混乱），但可以提供"重新分类全部文件"功能

#### 5.7.3 Prompt 与设置的分离方案

**用户关切**：很多 prompt 配置在通用设置中，金蝶版如何与之协调？

**方案：通用设置保留，项目级覆盖**

```
全局设置（settings 表）
├── AI 模型配置（模型选择、API Key、温度等）  ← 所有项目共享
├── 通用分类 prompt 模板                      ← 所有项目共享的底层 prompt
├── 通用阶段定义（STAGE_DEFINITIONS）         ← 代码级默认值
└── 自定义阶段/子分类（custom_stages）        ← 通用版用户自定义

项目级配置（projects 表）
├── classification_profile                    ← 决定用哪套阶段/prompt/规则
├── custom_stages（可选覆盖）                 ← 如果用户在这个项目中自定义了阶段
└── custom_prompt_additions（可选覆盖）       ← 如果用户想追加特定规则
```

**运行时逻辑**：
1. 读取 `project.classification_profile`
2. 根据 profile 选择阶段定义：
   - `generic` → `STAGE_DEFINITIONS`（代码默认）+ `custom_stages`（用户自定义）
   - `kingdee` → `KINGDEE_STAGE_DEFINITIONS`（代码内置）
3. 根据 profile 选择分类 prompt：
   - `generic` → 通用 prompt 模板
   - `kingdee` → 金蝶专用 prompt（包含方法论术语和区分规则）
4. 根据 profile 选择文件名启发式规则：
   - `generic` → 通用启发式
   - `kingdee` → 金蝶方法论 83 个模板的精确匹配规则
5. AI 模型配置（模型、API Key）始终从全局设置读取，不受 profile 影响

#### 5.7.4 设置界面调整

设置页的"文件分类管理"保持不变，但标注作用范围：

```
设置 → 文件分类管理
┌─────────────────────────────────────────────────┐
│  ⚠ 以下配置为全局默认值，适用于"通用版"项目。   │
│    金蝶版项目的分类规则由项目级配置决定。         │
│                                                  │
│  阶段列表：[售前] [启动] [需求] [方案] ...       │
│  子分类管理：...                                 │
│  [恢复默认]                                      │
└─────────────────────────────────────────────────┘
```

#### 5.7.5 代码实现要点

```typescript
// electron/shared/stages.ts — 新增导出
export const CLASSIFICATION_PROFILES = {
  generic: {
    name: '通用版',
    stages: STAGE_DEFINITIONS,  // 现有 10 阶段
    heuristics: GENERIC_FILENAME_HEURISTICS,
  },
  kingdee: {
    name: '金蝶版',
    stages: KINGDEE_STAGE_DEFINITIONS,  // 金蝶 9 阶段
    heuristics: KINGDEE_FILENAME_HEURISTICS,
  },
} as const;

export function getProfileStages(profile: string): StageDef[] {
  return CLASSIFICATION_PROFILES[profile]?.stages ?? STAGE_DEFINITIONS;
}

// classify.ts / upload.ts — 分类时读取项目 profile
const project = projectDb.getProject(projectId);
const stages = getProfileStages(project.classification_profile ?? 'generic');
// 使用 stages 构建 prompt、校验结果
```

#### 5.7.6 数据迁移与兼容

- 现有项目默认 `classification_profile = 'generic'`，无需迁移
- 已分类的文件不受影响（stage/subcategory 值已存入数据库）
- 新建项目时选择金蝶版，自动使用金蝶阶段体系
- 提供"重新分类全部文件"按钮，用当前项目的 profile 重新分类

### 5.8 金蝶版特色卡片映射

金蝶版的阶段-卡片映射需要调整，因为阶段数量从 10 变为 9：

| 分组 | 金蝶版阶段 | 特色卡片 |
|------|------------|----------|
| presale | 售前 | 项目信息 + 合同概览 + 项目评估 |
| progress | 0项目管理、1启动、2需求、3方案、4构建、5测试、6上线 | 需求跟踪 + 关键问题 + 签字追踪 |
| handover | 7验收（含转客户成功交接） | 签字追踪 + 拓展商机 + 交付物清单 |
| closed | 关闭 | 拓展商机 + 交付物清单 + 项目总结 |

### 5.9 金蝶版签字文件清单

根据方法论，金蝶项目的关键签字文件为：

| 金额档位 | 必需签字文件 | 对应方法论文件 |
|----------|-------------|---------------|
| < 10万 | 实施完成确认单 | 7验收阶段-05 |
| 10-50万 | 实施完成确认单 + 蓝图确认单 | 7验收-05 + 3方案-07 |
| 50-100万 | 实施完成确认单 + 蓝图确认单 + 开发需求设计确认单 | 7验收-05 + 3方案-07 + 3方案-07 |
| > 100万 | 实施完成确认单 + 开发完成确认单 + 蓝图确认单 + 上线确认单 + UAT确认单 | 7验收-05/06 + 3方案-07 + 6上线-08 + 5测试-10 |

---

## 第六部分：优化建议汇总

### 6.1 本版本应修复

| 优先级 | 编号 | 问题 | 预估工作量 |
|--------|------|------|------------|
| P0 | C1 | ai:analyze metadata 自覆盖（每次必现） | 0.5h |
| P0 | C2 | 新建 parseMetadata 工具函数 + 替换 6 处调用 | 1.5h |
| P1 | H1+H2 | 两条分类路径统一校验 + sanitizeCategory | 2h |
| P1 | H3 | StageSidebar 改为导入 STAGE_DEFINITIONS | 1h |
| P1 | M1 | Milestone 类型统一为 MilestoneExtended | 1h |
| P2 | M2 | Handover 导出 filename → stored_path | 0.5h |
| P2 | M3 | classify.ts 文件读取失败跳过分类 | 0.5h |
| P2 | M4 | 3 个组件 render 回调 any 类型替换 | 1h |

### 6.2 后续版本优化

| 编号 | 优化项 | 说明 |
|------|--------|------|
| OPT-1 | StageSidebar 读取 custom_stages | 支持用户自定义阶段 |
| OPT-2 | 交付物自动统计 | 基于文件分类自动识别交付物 |
| OPT-3 | 金蝶版分类方案 | 项目级 classification_profile |
| OPT-4 | Metadata 拆子表 | 解决并发读写和性能问题 |
| OPT-5 | 全局错误反馈 | Toast 通知 + 统一错误格式 |
| OPT-6 | 加载状态 | 骨架屏 + AI 分析中状态 |
| OPT-7 | 集中状态管理 | Context 或 Zustand 统一管理 |
| OPT-8 | AI 分类置信度 | 低置信度标记为"待确认" |
| OPT-9 | 数据库 Schema 版本管理 | 添加迁移机制 |

---

## 附录：文件索引

| 文件 | 用途 |
|------|------|
| `docs/card-system-design-decisions.md` | 卡片系统设计决策 |
| `docs/card-system-optimization-plan.md` | 卡片系统优化方案 |
| `docs/mimo-task-card-system.md` | mimo 实现指南 |
| `docs/design/card-ui-rules.md` | UI 规则 |
| `docs/design/design-tokens.md` | 设计令牌 |
| `docs/compose/plans/2026-06-26-code-quality-optimization.md` | 代码质量优化方案 |
| `electron/shared/stages.ts` | 阶段定义（单一数据源） |
| `electron/prompts/classify.ts` | AI 分类 prompt |
| `src/components/ProjectHome/FeatureCards.tsx` | 特色卡片映射 |
| `src/components/ProjectHome/StageSidebar.tsx` | 侧边栏 |
| `src/utils/metadata.ts` | parseMetadata 工具函数 |
| `electron/utils/validators.ts` | 验证工具函数 |
| `C:\work\实施方法论V10.0交付物模板\` | 金蝶方法论模板文件 |

---

## 第七部分：MiMo 验证判断（2026-06-26）

> 以下是对审查报告中各问题的验证判断，已对照源码确认。

### 7.1 Critical 问题验证

#### C1: ai:analyze 内部 metadata 自覆盖
**状态**：✅ 真实存在

**验证**：`electron/ipc/ai-handlers.ts:140-216`
- 第140行读取 `project = projectDb.getProject(projectId)`
- 第185行基于旧数据写入 `project_overview`：`const existingMeta = project.metadata ? JSON.parse(project.metadata) : {}`
- 第203行又基于**同一份旧数据**写入 `key_info`：`const existingMetadata = project.metadata ? JSON.parse(project.metadata) : {}`
- 第216行第二次 `updateProject` 会覆盖第187行的写入

**修复建议**：在第203行前重新读取 project，或累积所有变更后统一写入一次。

#### C2: 6个卡片组件 JSON.parse 无 try-catch 保护
**状态**：✅ 真实存在

**验证**：`src/components/ProjectHome/cards/` 目录下有10处 `JSON.parse(project.metadata)` 没有 try-catch 保护（SummaryCard除外）。

受影响文件：
- ContractCard.tsx:10
- EvaluationCard.tsx:10
- IssueCard.tsx:15
- OpportunityCard.tsx:6
- RequirementCard.tsx:9
- ProjectInfoPlaceholderCard.tsx:6
- DeliverableCard.tsx:53
- SignatureCard.tsx:15, 26
- ContractDetailModal.tsx:17

**注意**：报告中提到"项目中尚不存在 `parseMetadata()` 工具函数"，但 Phase 1 已经创建了 `src/utils/metadata.ts`，需要确认是否已替换这些调用。

### 7.2 High 问题验证

#### H1+H2: AI分类结果未校验阶段合法性 + classify.ts 未调用 sanitizeCategory
**状态**：✅ 真实存在

**验证**：
- `sanitizeCategory` 只定义在 `electron/ipc/handlers/upload.ts:21`
- `electron/ipc/handlers/classify.ts` 没有调用 `sanitizeCategory`，AI 返回的 category 值直接用于文件路径拼接

**修复建议**：将 `sanitizeCategory` 提取到共享位置（如 `electron/utils/sanitize.ts`），两个 handler 都调用。

#### H3: StageSidebar 硬编码阶段列表
**状态**：✅ 真实存在

**验证**：`src/components/ProjectHome/StageSidebar.tsx:26-37` 硬编码了10个阶段，没有从 `electron/shared/stages.ts` 导入。

**修复建议**：改为导入 `STAGE_DEFINITIONS`。

#### H4: 数据库无 Schema 版本管理
**状态**：✅ 真实存在

**验证**：`electron/database/index.ts` 使用9个 `try { ALTER TABLE } catch {}` 迁移块，每次启动都重新执行。

**修复建议**：添加版本号和迁移记录机制（后续版本优化）。

### 7.3 Medium 问题验证

#### M1: Milestone 与 MilestoneExtended 类型不匹配
**状态**：✅ 真实存在

**验证**：
- `src/types/index.ts:15-19` 定义了 `Milestone`（只有 date/title/type）
- `src/types/index.ts:157-168` 定义了 `MilestoneExtended`（有 id/category/amount/confirmed 等）
- ContractCard.tsx:25 使用 `.filter(m => m.confirmed)`，但 milestone 类型是 `Milestone`（没有 confirmed 字段）
- ContractDetailModal.tsx:32 同样问题

**修复建议**：统一使用 `MilestoneExtended` 类型。

#### M2: Handover 导出使用 filename 而非 stored_path
**状态**：✅ 真实存在

**验证**：`electron/services/handover-service.ts:113`
```typescript
const filePath = path.join(projectPath, file.filename)
```
文件分类后移动到子目录，`filename` 只是原始文件名，找不到文件。

**修复建议**：改用 `file.stored_path`。

#### M3: classify.ts 文件读取失败返回空字符串
**状态**：✅ 真实存在

**验证**：`electron/ipc/handlers/classify.ts:219`
```typescript
content = await fs.readFile(file.stored_path, 'utf-8').catch(() => '')
```
文件读取失败时返回空字符串，送入 AI 分类会产生无意义结果。

**修复建议**：返回 null，调用方检查后跳过分类。

#### M4: 3个卡片组件 render 回调使用 any
**状态**：✅ 真实存在

**验证**：
- IssueCard.tsx:34 `(issue: any, i: number)`
- IssueCard.tsx:52 `renderItem={(issue: any) =>`
- RequirementCard.tsx:27 `(r: any, i: number)`
- OpportunityCard.tsx:22 `(opp: any, i: number)`

**修复建议**：定义具体类型（如 `interface Issue { id: number; title: string; ... }`）。

#### M5: 数据库迁移 catch 块过于宽泛
**状态**：✅ 真实存在

**验证**：`electron/database/index.ts` 有9处 `try { ALTER TABLE } catch {}` 空 catch 块。

**修复建议**：至少加 `console.debug` 或缩小 catch 范围。

### 7.4 后续版本优化验证

| 编号 | 优化项 | 是否需要优化 |
|------|--------|--------------|
| OPT-1 | StageSidebar 读取 custom_stages | ✅ 需要 |
| OPT-2 | 交付物自动统计 | ✅ 需要 |
| OPT-3 | 金蝶版分类方案 | ✅ 需要（重要功能） |
| OPT-4 | Metadata 拆子表 | ⏳ 后续版本 |
| OPT-5 | 全局错误反馈 | ✅ 需要 |
| OPT-6 | 加载状态 | ✅ 需要 |
| OPT-7 | 集中状态管理 | ⏳ 后续版本 |
| OPT-8 | AI 分类置信度 | ⏳ 后续版本 |
| OPT-9 | 数据库 Schema 版本管理 | ⏳ 后续版本 |

---

## 第八部分：待办项记录

### 本版本应修复（P0/P1）

| 优先级 | 编号 | 问题 | 预估工作量 | 状态 |
|--------|------|------|------------|------|
| P0 | C1 | ai:analyze metadata 自覆盖 | 0.5h | ⏳ 待修复 |
| P0 | C2 | parseMetadata 已创建但未替换10处调用 | 1h | ⏳ 待修复 |
| P1 | H1+H2 | sanitizeCategory 提取到共享位置 | 1h | ⏳ 待修复 |
| P1 | H3 | StageSidebar 导入 STAGE_DEFINITIONS | 0.5h | ⏳ 待修复 |
| P1 | M1 | Milestone 类型统一为 MilestoneExtended | 0.5h | ⏳ 待修复 |
| P2 | M2 | Handover 导出 filename → stored_path | 0.5h | ⏳ 待修复 |
| P2 | M3 | classify.ts 文件读取失败跳过分类 | 0.5h | ⏳ 待修复 |
| P2 | M4 | 4处 render 回调 any 类型替换 | 1h | ⏳ 待修复 |

### 后续版本优化

| 编号 | 优化项 | 优先级 | 状态 |
|------|--------|--------|------|
| OPT-1 | StageSidebar 读取 custom_stages | P2 | ⏳ 待实施 |
| OPT-2 | 交付物自动统计 | P2 | ⏳ 待实施 |
| OPT-3 | 金蝶版分类方案 | P1 | ⏳ 待实施（重要） |
| OPT-5 | 全局错误反馈 Toast | P2 | ⏳ 待实施 |
| OPT-6 | 加载状态骨架屏 | P2 | ⏳ 待实施 |
| OPT-4 | Metadata 拆子表 | P3 | ⏳ 后续版本 |
| OPT-7 | 集中状态管理 | P3 | ⏳ 后续版本 |
| OPT-8 | AI 分类置信度 | P3 | ⏳ 后续版本 |
| OPT-9 | 数据库 Schema 版本管理 | P3 | ⏳ 后续版本 |

---

> 验证时间：2026-06-26 | 验证者：MiMoCode
