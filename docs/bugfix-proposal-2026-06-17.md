# Bug排查与修复方案 v2

**日期**：2026-06-17
**状态**：待Qoder审核

---

## 一、问题清单

| # | 问题 | 优先级 | 状态 |
|---|------|--------|------|
| 1 | 手动推进项目阶段报错"当前阶段已是最终阶段" | P0 | 待修复 |
| 2 | 首次弹窗每次都弹（`first_launch_done` 写不进数据库） | P0 | 待修复 |
| 3 | 获取会话列表失败 `no such column: first_msg.content` | P0 | 待修复 |
| 4 | 首次弹窗选择"自有API"时的API Key交互优化 | P1 | 待设计 |
| 5 | 未分类文件点击不显示（SQL与侧边栏计数不一致） | P0 | ✅已修复 |
| 6 | 拖拽上传区域高度过大（160px→100px） | P2 | ✅已修复 |
| 7 | 项目卡片关键节点日期显示1月1号 | P1 | 待讨论 |
| 8 | 项目阶段自动推进未触发 | P0 | 待排查 |

---

## 二、问题详情与修复方案

### 问题1：手动推进项目阶段报错"当前阶段已是最终阶段"

**现象**：用户点击"推进到下一阶段"按钮，提示"当前阶段已是最终阶段，无法继续推进"，即使当前阶段不是最终阶段。

**根因**：`handleManualProgression`（`projectHome.hooks.ts:355`）调用 `checkStageProgression(project.current_stage, '')`，传入空字符串作为 `fileStage`。但 `checkStageProgression`（`types/index.ts:136`）在 `fileStage` 为空时直接返回 `null`：

```typescript
// types/index.ts:136
if (!fileStage) return null  // ← 手动推进传入 ''，永远走这里
```

**影响**：手动推进功能完全失效，只能通过AI分类触发阶段推进。

**修复方案**：`handleManualProgression` 不调用 `checkStageProgression`，直接查 `STAGE_PROGRESSION_RULES` 找下一阶段：

```typescript
// projectHome.hooks.ts:355
const handleManualProgression = useCallback(() => {
  const { STAGE_PROGRESSION_RULES } = require('../../types')
  for (const [, rule] of Object.entries(STAGE_PROGRESSION_RULES)) {
    if (project.current_stage === rule.from) {
      setProgressionModal({
        open: true,
        targetStage: rule.to,
        detectedType: '手动推进',
      })
      return
    }
  }
  message.info('当前阶段已是最终阶段，无法继续推进')
}, [project.current_stage])
```

**涉及文件**：`src/components/ProjectHome/projectHome.hooks.ts`

---

### 问题2：首次弹窗每次都弹

**现象**：每次打开应用都弹出"设置存储位置"和"配置AI助手"弹窗，即使已经设置过。

**根因**：`first_launch_done` 不在 `ALLOWED_SETTINGS_FIELDS` 白名单中（`settings-handlers.ts:9-16`）。BetaNoticeModal 保存 `first_launch_done: 'true'` 时被 `validateSettingsKey` 静默过滤，永远写不进数据库。

```typescript
// settings-handlers.ts:9-16
const ALLOWED_SETTINGS_FIELDS = [
  'ai_provider', 'ai_model', 'ai_api_key', 'ai_billing_mode', 'ai_base_url',
  // ... 其他字段
  'user_role', 'custom_stages', 'custom_subcategories', 'project_storage_path',
  // ← 缺少 'first_launch_done'
]
```

**修复方案**：在 `ALLOWED_SETTINGS_FIELDS` 中添加 `first_launch_done`：

```typescript
// settings-handlers.ts:15
'user_role', 'custom_stages', 'custom_subcategories', 'project_storage_path', 'first_launch_done',
```

**涉及文件**：`electron/ipc/settings-handlers.ts`

---

### 问题3：获取会话列表失败 `no such column: first_msg.content`

**现象**：打开对话页面时控制台报错：
```
[AI] 获取会话列表失败: Error: no such column: first_msg.content
```

**根因**：`getChatSessions`（`conversations.ts:51-70`）SQL查询结构错误。子查询 `fm` 只 SELECT 了 `session_id` 和 `min_id`，外层查询引用 `first_msg.content`——`first_msg` 别名未定义。

```sql
-- 当前错误的SQL
SELECT cm.session_id, first_msg.content as first_message, ...
FROM chat_messages cm
INNER JOIN (
  SELECT session_id, MIN(id) as min_id FROM chat_messages WHERE project_id = ? GROUP BY session_id
) fm ON cm.session_id = fm.session_id AND cm.id = fm.min_id
-- 问题：fm 只有 session_id 和 min_id，没有 content
-- 且 first_msg 别名未在任何地方定义
```

**修复方案**：改用标量子查询取第一条消息内容：

```sql
SELECT 
  cm.session_id,
  (SELECT content FROM chat_messages 
   WHERE session_id = cm.session_id AND project_id = ? 
   ORDER BY id ASC LIMIT 1) as first_message,
  COUNT(*) as message_count,
  MIN(cm.created_at) as created_at,
  MAX(cm.created_at) as updated_at
FROM chat_messages cm
WHERE cm.project_id = ?
GROUP BY cm.session_id
ORDER BY MAX(cm.created_at) DESC
```

**涉及文件**：`electron/database/conversations.ts`

---

### 问题4：首次弹窗"自有API"的API Key交互优化

**现象**：用户在首次弹窗选择"我有API Key，自己设置"后跳转到设置页面，但设置页面的API Key字段可能显示内置Key或为空，用户需要手动找到并修改。

**需求**：选择"自有API"时：
1. 清除内置API Key
2. API Key字段开放给用户填写
3. 如果用户未填写就取消/切换页面，恢复内置API Key
4. 如果用户填写了，保存用户的Key

**修复方案**：

**方案A：在设置页面添加状态追踪**（推荐）

```typescript
// SettingsPage.tsx
const [isCustomKeyMode, setIsCustomKeyMode] = useState(false)
const [builtinKeySnapshot, setBuiltinKeySnapshot] = useState('')

// 从首次弹窗跳转过来时，检测ai_key_source === 'custom'
useEffect(() => {
  if (settings.ai_key_source === 'custom' && !isCustomKeyMode) {
    setIsCustomKeyMode(true)
    setBuiltinKeySnapshot(settings.ai_api_key) // 快照当前内置Key
    // 清空API Key字段，让用户填写
    form.setFieldsValue({ ai_api_key: '' })
  }
}, [settings.ai_key_source])

// 用户取消或切换页面时，如果没有填写新Key，恢复内置Key
const handleCancel = () => {
  if (isCustomKeyMode && !form.getFieldValue('ai_api_key')) {
    // 用户没有填写Key，恢复内置Key
    form.setFieldsValue({ ai_api_key: builtinKeySnapshot })
    configService.update({ ai_key_source: 'builtin', ai_api_key: builtinKeySnapshot })
  }
  setIsCustomKeyMode(false)
}

// 保存时检查
const handleSave = async () => {
  const values = form.getFieldsValue()
  if (isCustomKeyMode && !values.ai_api_key) {
    message.warning('请填写API Key，或切换回内置Key')
    return
  }
  // 正常保存...
}
```

**涉及文件**：`src/components/Settings/SettingsPage.tsx`

---

### 问题5：未分类文件点击不显示 ✅已修复

**根因**：`getFilesByCategory` SQL查询 `category = '未分类'` 匹配不到 `category = null` 的文件。

**修复**：`electron/database/files.ts` 对"未分类"特殊处理，匹配 `NULL / '' / '未分类'`。

---

### 问题6：拖拽上传区域高度过大 ✅已修复

**修复**：`UploadArea.tsx` minHeight 160px→100px，图标和间距全面收紧。

**补充说明**：仅修改内联样式不够，Ant Design 的 `.ant-upload-drag` CSS 中 `.ant-upload-btn { height: 100% }` 会撑开容器。需同时在 `overrides.css` 中添加 `min-height: 100px !important` 强制覆盖。

---

### 问题7：项目卡片关键节点日期显示1月1号

**现象**：项目列表卡片下方的关键节点日期全部显示1月1号。

**待讨论**：
- 哪些日期应该显示在卡片上？
- 日期数据来源是什么？（projects表的milestones字段？还是从文件中提取？）
- 如果没有日期数据，应该显示什么？（隐藏？显示"--"？）

---

### 问题8：项目阶段自动推进未触发

**现象**：AI分类后文件阶段变化，但项目阶段未自动推进。

**排查结果**：

**触发链路**：
1. `handleClassify`（projectHome.hooks.ts:113）调用 `aiService.classify(fileId, project.category_type)`
2. 后端 `ai:classify`（ai-handlers.ts:124）根据 `categoryType` 选择 prompt：
   - `categoryType === 'stage'` → `CLASSIFY_PROMPT_STAGES`（含 `stage` 字段）
   - `categoryType === 'content'` → `CLASSIFY_PROMPT_CONTENT`（**不含 `stage` 字段**）
3. `parseClassifyResponse`（ai-response.ts:2）提取 `parsed.stage`
4. `checkStageProgression`（types/index.ts:132）检查是否触发推进

**可能原因**：

1. **项目 `category_type` 为 `'content'`**（最可能）：创建项目时选择了"按内容分类"，导致使用 `CLASSIFY_PROMPT_CONTENT`，AI不返回 `stage` 字段，`fileStage` 始终为 `null`，`checkStageProgression` 直接返回 `null`。

2. **AI 未返回 `stage` 字段**：即使使用 `CLASSIFY_PROMPT_STAGES`，AI 可能未按 JSON 格式返回 `stage`，或返回的值不在 `['售前', '进行中', '关闭']` 中。

3. **批量分类的 `highestStage` 逻辑**：`handleBatchClassify`（projectHome.hooks.ts:146）遍历所有文件，追踪 `highestStage`，最后统一调用 `checkStageProgression`。如果所有文件的 `fileStage` 都是 `null`，则不会触发推进。

**修复方案**：

**方案A：强制使用 stage prompt**（推荐）
无论 `category_type` 是什么，分类时始终使用 `CLASSIFY_PROMPT_STAGES`，确保 AI 返回 `stage` 字段：

```typescript
// ai-handlers.ts:164
// 修改前
if (categoryType === 'content') {
  promptTemplate = settings.classify_prompt_content || CLASSIFY_PROMPT_CONTENT
} else {
  promptTemplate = settings.classify_prompt_stages || CLASSIFY_PROMPT_STAGES
}

// 修改后：始终使用 stage prompt（content 分类也返回 stage）
promptTemplate = settings.classify_prompt_stages || CLASSIFY_PROMPT_STAGES
```

**方案B：在 CLASSIFY_PROMPT_CONTENT 中也添加 stage 判断**
修改 `CLASSIFY_PROMPT_CONTENT` prompt，增加判断2（项目阶段），使两种分类方式都返回 `stage`。

**涉及文件**：`electron/ipc/ai-handlers.ts`（方案A）或 `electron/prompts/classify.ts`（方案B）

---

## 三、修复优先级建议

| 批次 | 问题 | 预估工作量 |
|------|------|-----------|
| 第1批 | #1 手动推进 + #2 首次弹窗 + #3 会话列表SQL | 小（各1处改动） |
| 第2批 | #4 API Key交互优化 | 中（设置页面状态管理） |
| 第3批 | #7 卡片日期 + #8 自动推进 | 需讨论后实施 |

---

## 四、需要Qoder审核的点

1. 问题1的修复方案是否合理？手动推进是否应该跳过文件阶段检测？
2. 问题2的修复是否足够？`first_launch_done` 加入白名单是否有安全风险？
3. 问题3的SQL改写是否正确？标量子查询在sql.js中的性能是否可接受？
4. 问题4的方案A是否最优？有没有更简洁的状态管理方式？
5. 问题6的CSS覆盖方案：`min-height: 100px !important` 是否有副作用？Ant Design 内部是否依赖高度计算？
6. 问题8的方案A：强制使用 `CLASSIFY_PROMPT_STAGES` 是否影响"按内容分类"项目的用户体验？方案B是否更合理？
7. 问题8的触发链路：`category_type` 为 `'content'` 时是否应该禁用阶段推进？还是两种分类方式都应该支持阶段推进？

---

## 五、Qoder 审核意见

**审核人**：Qoder  
**日期**：2026-06-17  
**方法**：逐条源码验证 + 跨模块影响分析

### 问题1：手动推进阶段报错 ✅ 根因确认正确，修复方案需调整

**根因验证**：完全正确。源码 `projectHome.hooks.ts:355-366` 确认 `handleManualProgression` 调用 `checkStageProgression(project.current_stage, '')`，而 `checkStageProgression`（`types/index.ts:136`）第 136 行 `if (!fileStage) return null` 确实会因空字符串直接返回 null。手动推进功能完全不可用。

**修复方案审查**：方案方向正确但有两个问题：

1. **不应使用 `require()`**：修复代码中 `const { STAGE_PROGRESSION_RULES } = require('../../types')` — 该文件是 ESM + Vite 环境，不应该用 CommonJS require。应改为文件顶部已有的 import（检查确认 `STAGE_PROGRESSION_RULES` 已在 `types/index.ts` 中定义，文件内已 import 了 `checkStageProgression`，应同时 import `STAGE_PROGRESSION_RULES`）。

2. **规则遍历逻辑有误**：方案中遍历 `STAGE_PROGRESSION_RULES` 的 entries，但该对象的 value 结构是 `{ from, to, stages }`。方案用 `project.current_stage === rule.from` 匹配是正确的，但应考虑 **一个 from 阶段可能对应多个 to 阶段**（当前没有这种情况，但未来扩展时会出问题）。更健壮的写法是直接调用一个新函数 `getNextStages(currentStage)` 返回所有可能的下一阶段。

**建议修改**：

```typescript
// 方案改为：
import { checkStageProgression, STAGE_PROGRESSION_RULES } from '../../types'

const handleManualProgression = useCallback(() => {
  // 直接查找当前阶段对应的下一阶段
  for (const rule of Object.values(STAGE_PROGRESSION_RULES)) {
    if (project.current_stage === rule.from) {
      setProgressionModal({
        open: true,
        targetStage: rule.to,
        detectedType: '手动推进',
      })
      return
    }
  }
  message.info('当前阶段已是最终阶段，无法继续推进')
}, [project.current_stage])
```

**另外注意**：`handleManualProgression` 的 `useCallback` 依赖数组中缺少 `setProgressionModal`。虽然 React 保证 useState 的 setter 稳定，但建议补全以避免 linter 警告。

**结论**：根因正确，修复方向正确，需修正 require → import 写法。

---

### 问题2：首次弹窗每次都弹 ✅ 根因确认正确，修复方案足够

**根因验证**：完全正确。`settings-handlers.ts:9-16` 的 `ALLOWED_SETTINGS_FIELDS` 白名单中确实没有 `first_launch_done`。`settings:update` handler（第 31 行）调用 `validateSettingsKey(key, ALLOWED_SETTINGS_FIELDS)` 时，不在白名单的 key 会被 `continue` 跳过，`first_launch_done` 永远写不进数据库。

**修复方案审查**：在白名单中添加 `first_launch_done` 是正确且充分的修复。

**安全风险评估**：`first_launch_done` 不以 `_api_key` 结尾，不会触发第 40 行的 API Key 掩码保护逻辑。它只存储字符串 `'true'`，无安全风险。唯一需要注意的是 `validateSettingsKey` 的实现——如果白名单使用黑名单逻辑而非白名单逻辑则需确认，但当前代码明确是白名单（`ALLOWED_` 前缀），添加字段是安全的。

**补充建议**：除了添加到白名单外，建议在 `settings:update` handler 中增加一行日志记录哪些字段被过滤了（目前是静默 skip），以便未来调试类似问题。这不是必须的，只是建议。

**结论**：修复方案充分，可直接执行。

---

### 问题3：获取会话列表 SQL 错误 ✅ 根因确认正确，修复方案正确但可优化

**根因验证**：完全正确。`conversations.ts:53-70` 的 SQL 查询中，外层引用 `first_msg.content`，但子查询 `fm` 只 SELECT 了 `session_id` 和 `min_id`，没有 `content` 字段。且 `first_msg` 这个别名在查询中从未定义（子查询别名是 `fm`）。这是典型的 SQL 别名引用错误。

**修复方案审查**：改用标量子查询取第一条消息内容的方案是正确的。

**性能评估**：标量子查询在 sql.js 中的性能：
- `chat_messages` 表有 `idx_chat_project_session` 索引（`database/index.ts:102`）
- 子查询 `WHERE session_id = cm.session_id AND project_id = ?` 可以利用索引
- 对于会话数量不大的场景（几十到几百个会话），性能完全可接受
- 如果未来会话数达到数千级别，可以考虑改用 LEFT JOIN + ROW_NUMBER 窗口函数，但目前没有必要

**建议优化**：SQL 中两个 `?` 参数都绑定 `projectId`，这是正确的。但建议在子查询中也加上 `ORDER BY id ASC LIMIT 1` 确保取到的是真正的第一条消息（当前方案已包含，确认正确）。

**结论**：修复方案正确，可直接执行。

---

### 问题4：API Key 交互优化 ⚠️ 方案可行但有更优选择

**方案审查**：方案A（状态追踪 + 快照恢复）是可行的，但增加了较多状态管理复杂度（`isCustomKeyMode` + `builtinKeySnapshot` + useEffect + handleCancel 恢复逻辑）。

**更优方案建议**：可以考虑在首次弹窗跳转时直接传递参数，而不是依赖设置页面检测状态：

1. 首次弹窗选择"自有API"时，设置 `ai_key_source: 'custom'`（新字段）并清空 `ai_api_key`
2. 设置页面检测到 `ai_key_source === 'custom'` 时，显示"填写自己的API Key"提示
3. 用户填写后保存，`ai_key_source` 保持 `'custom'`
4. 用户取消时，设置页面恢复 `ai_key_source: 'builtin'` 并恢复内置 Key

这与方案A思路一致，但将 `ai_key_source` 作为持久化字段而非 React 状态，可以跨页面/跨重启保持状态。

**另一个问题**：方案中 `form.setFieldsValue({ ai_api_key: '' })` 直接清空 API Key，但如果用户已有自己的 Key（非内置），这会误删。建议先检查是否为内置 Key 再决定是否清空。

**结论**：方案A可行，但建议用持久化字段替代 React 状态。

---

### 问题6：拖拽上传区域高度 ✅ 已修复，补充确认

**CSS 覆盖评估**：`min-height: 100px !important` 的副作用：
- Ant Design 的 `.ant-upload-drag` 内部确实依赖高度计算，但 `min-height` 不影响 `max-height`，不会导致内容溢出
- `!important` 在此场景下是必要的，因为 Ant Design 的内联样式优先级较高
- 建议将覆盖规则写在项目的 `overrides.css` 中而非组件内联样式，保持样式一致性

**结论**：方案无副作用，可执行。

---

### 问题7：项目卡片关键节点日期显示1月1号 ⚠️ 需要更多排查

**现状分析**：`ProjectTimeline.tsx:56-57` 的日期显示逻辑：
```typescript
const dateStr = m.date
const displayDate = dateStr.length >= 10 ? dateStr.substring(5, 10) : dateStr
```

如果 `m.date` 是 `""`（空字符串），`dateStr.length >= 10` 为 false，直接显示空字符串。如果 `m.date` 是 `"2026-01-01"`，则显示 `"01-01"`（即1月1号）。

**可能原因**：
1. AI 提取里程碑时，对没有明确日期的里程碑使用了默认日期 `2026-01-01`
2. 项目创建时 milestones JSON 被初始化为包含默认日期的占位数据
3. `parseMilestones` 解析出的 date 字段格式不正确

**需要确认**：
- 用户看到的"1月1号"是 `01-01` 还是 `1月1日`？（代码显示的是 `01-01` 格式）
- milestones 数据从哪里来？是 AI 提取后存储的，还是用户手动填写的？
- 建议在控制台打印 `project.milestones` 的实际值来确认数据源

**结论**：问题确认存在，但根因需要用户补充复现信息（milestones 数据的实际值）。

---

### 问题8：项目阶段自动推进未触发 ✅ 根因确认正确，修复方案需调整

**根因验证**：完全正确。关键链路确认：

1. `CLASSIFY_PROMPT_CONTENT`（`classify.ts:55-81`）的 JSON 模板中**没有 `stage` 字段**（第 69-80 行），只有 `category`、`confidence`、`summary`、`key_info`。而 `CLASSIFY_PROMPT_STAGES`（第 42 行）有 `"stage": "售前/进行中/关闭"`。

2. `file-handlers.ts:164-166` 自动分类路径：
```typescript
const promptTemplate = project.category_type === 'stage'
  ? CLASSIFY_PROMPT_STAGES
  : CLASSIFY_PROMPT_CONTENT
```
当 `category_type === 'content'` 时使用 `CLASSIFY_PROMPT_CONTENT`，AI 不返回 `stage` 字段。

3. `ai-response.ts:25` `stage: parsed.stage || null` — AI 不返回 stage 时为 null。

4. `projectHome.hooks.ts:120-131` 中 `fileStage` 为 null 时跳过 `checkStageProgression` 调用。

**修复方案审查**：

**方案A（强制使用 stage prompt）的问题**：
- 直接丢弃 `CLASSIFY_PROMPT_CONTENT` 意味着"按内容分类"项目将被强制按阶段分类
- 用户选择"按内容分类"时，期望的分类维度是内容类型（文档/代码/图片），不是项目阶段
- 强制注入阶段判断会增加 AI prompt 复杂度，可能降低分类准确率

**方案B（在 content prompt 中也添加 stage 判断）的问题**：
- 同样增加了 prompt 复杂度
- 但至少保留了"按内容分类"的主分类逻辑

**推荐方案：方案C — 自动分类时不传递 categoryType，始终使用 stage prompt**

实际上，文件上传后的自动分类（`file-handlers.ts:159-211`）和用户手动触发的分类（`ai-handlers.ts:124`）是两个不同入口：

- **自动分类**（文件上传时）：目的是将文件移动到正确的文件夹，同时判断阶段。这里应该**始终使用 stage prompt**，因为阶段推进是通用需求，与分类方式无关。
- **手动分类**（用户点击"重新分类"）：应该尊重 `category_type`，因为用户可能只想改变分类维度。

**具体建议**：

在 `file-handlers.ts` 的自动分类路径中，始终使用 `CLASSIFY_PROMPT_STAGES`：

```typescript
// file-handlers.ts:164-166
// 修改前：根据 category_type 选择 prompt
// 修改后：自动分类始终使用 stage prompt（确保返回 stage 字段）
const promptTemplate = CLASSIFY_PROMPT_STAGES
```

而在 `ai-handlers.ts` 的手动分类路径中，保持现有逻辑（尊重 `categoryType` 参数）。

**结论**：根因正确。推荐方案C（仅修改自动分类路径，手动分类保持不变）。

**用户确认的业务规则**：
1. **只能向后推进**：用户可能补之前阶段的文件，但阶段不能倒回去（如"进行中"项目收到"售前"文件不触发推进）
2. **推进前需用户确认**：自动检测到阶段推进信号时，弹窗提示用户确认，用户取消则不推进
3. **手动分类尊重用户选择**：用户点"重新分类"时，按 `categoryType` 决定是否判断阶段

---

### 问题8 额外发现：`file-handlers.ts` 自动分类也缺少阶段推进调用

**重要发现**：`file-handlers.ts:190-194` 在自动分类后只调用了 `updateFile` 更新文件记录，但**没有调用 `checkStageProgression`**。即使 AI 返回了 `stage` 字段，自动分类路径也不会触发项目阶段推进。

只有 `projectHome.hooks.ts:123-131`（前端手动触发的分类）才会调用 `checkStageProgression`。

**这意味着**：即使修复了 prompt 问题，文件上传时的自动分类仍然不会触发阶段推进。需要在 `file-handlers.ts:194` 后增加阶段推进检查：

```typescript
// file-handlers.ts:194 之后添加：
if (stage) {
  const project = getProject(projectId)
  if (project) {
    const { checkStageProgression } = require('../types') // 需改为 ESM import
    const progression = checkStageProgression(project.current_stage, stage)
    if (progression) {
      // 需要通过 IPC 通知前端显示推进确认弹窗
      // 或直接在后端执行推进（取决于产品设计）
    }
  }
}
```

但这涉及到后端如何通知前端显示确认弹窗的设计问题，建议作为独立问题处理。

---

### 审核总结

| 问题 | 根因 | 修复方案 | 审核结论 |
|------|------|---------|---------|
| #1 手动推进 | ✅ 正确 | ⚠️ 需改 require → import | 可执行，修正写法后 |
| #2 首次弹窗 | ✅ 正确 | ✅ 充分 | 可直接执行 |
| #3 会话SQL | ✅ 正确 | ✅ 正确 | 可直接执行 |
| #4 API Key交互 | ✅ 正确 | ⚠️ 建议改用持久化状态 | 可执行，方案A也可 |
| #6 拖拽高度 | ✅ 已修复 | ✅ 无副作用 | 已完成 |
| #7 卡片日期 | ⚠️ 需复现 | 待定 | 需补充 milestones 数据 |
| #8 自动推进 | ✅ 正确 | ⚠️ 推荐方案C | 需调整方案 |

**额外发现**：`file-handlers.ts` 自动分类路径缺少阶段推进调用，即使 prompt 修复后，自动分类也不会触发阶段推进。此问题建议作为独立 issue 跟踪。
