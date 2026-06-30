# 转交导入功能修复方案

> 2026-06-29 | 基于用户测试反馈
> 状态：待Qoder审核

---

## 一、问题清单

| # | 问题 | 根因 |
|---|------|------|
| 1 | 预览显示：项目名称/文件数量/阶段全部为空或"未设置" | ImportDialog读取的字段名与HandoverJSON结构不匹配 |
| 2 | 导入后AI分析数据丢失 | importHandover未将metadata写入数据库，且强制设is_analyzed=false |
| 3 | 导入后项目阶段未恢复 | currentStage读取后未用于更新项目 |
| 4 | 导入弹窗高度未生效 | Dragger内部样式可能覆盖了Modal的maxHeight |

---

## 二、问题1：预览数据字段不匹配

### 根因

`handover:preview`返回完整的`HandoverJSON`对象，结构为：
```json
{
  "project": { "name": "...", "current_stage": "...", ... },
  "files": [...],
  "handover_note": "...",
  ...
}
```

但ImportDialog读取的是：
- `data.projectName` → 应为 `data.project.name`
- `data.fileCount` → 应为 `data.files.length`
- `data.stage` → 应为 `data.project.current_stage`
- `data.handoverNote` → 应为 `data.handover_note`

### 修复方案

**改动文件**：`src/components/Handover/ImportDialog.tsx`

修改`handleBeforeUpload`中的preview数据映射（line 65-70）：

```typescript
setPreview({
  projectName: data.project?.name || '未命名项目',
  fileCount: data.files?.length || 0,
  stage: data.project?.current_stage || '未设置',
  handoverNote: data.handover_note || '',
})
setProjectName(data.project?.name || '')
```

---

## 三、问题2：导入后AI数据丢失

### 根因

`handover-service.ts:importHandover`有两个问题：

1. **metadata未写入数据库**（line 140）：`createProject`创建空metadata项目，line 165-167将metadata写入`.ai/metadata.json`文件但**未同步到数据库**

2. **强制重新分析**（line 191）：`is_analyzed: false`强制所有文件重新分析，即使已有ai_summary

### 修复方案

**改动文件**：`electron/services/handover-service.ts`

**修复点1：导入后将metadata写入数据库**

在`importHandover`函数末尾（line 206前），添加：

```typescript
// 将metadata写入数据库
const metadataToRestore = data.project?.metadata || data.metadata || {}
if (Object.keys(metadataToRestore).length > 0) {
  projectDb.updateProject(projectId, { metadata: JSON.stringify(metadataToRestore) })
}
```

需要导入`projectDb`或使用已有的`updateProject`函数。

**修复点2：保留is_analyzed状态和has_signature**

修改line 191-192：

```typescript
is_analyzed: !!(fileEntry.ai_summary || fileEntry.content_extracted),
has_signature: fileEntry.signature_status === 'signed',
```

**修复点3：恢复项目阶段**

在metadata写入后，更新项目阶段：

```typescript
if (currentStage) {
  projectDb.updateProject(projectId, { current_stage: currentStage })
}
```

### 设计合理性判断

用户提出"导入后不需要重复分析"——**这个逻辑完全合理**：

- 导出时已包含：category、subcategory、stage、ai_summary、ai_key_info、content_extracted
- 导入时应完整恢复这些数据
- 只有新导入的文件才需要分析
- 这是转交功能的核心价值：保留已有的分析成果

---

## 四、问题4：弹窗高度未生效

### 根因

`src/styles/overrides.css` lines 43-61 有全局规则：
```css
.ant-upload-drag {
  min-height: 64px !important;
  max-height: 80px !important;    /* ← 根因 */
}
```

所有Dragger实例被限制在64-80px。Modal的`styles.body` maxHeight无法覆盖Dragger的内部样式。

### 修复方案

**改动文件**：`src/styles/overrides.css`

添加例外规则，只影响Modal内的Dragger：

```css
/* ImportDialog的拖拽上传区域需要更大空间 */
.ant-modal .ant-upload-drag {
  min-height: 200px !important;
  max-height: none !important;
}
```

同时将Modal的`styles.body` maxHeight改为520px。

---

## 五、实施优先级

| 优先级 | 问题 | 工作量 |
|--------|------|--------|
| P0 | 问题1：预览字段映射 | 0.5天 |
| P0 | 问题2：metadata恢复+is_analyzed | 0.5天 |
| P1 | 问题4：弹窗高度 | 0.5天 |

---

## 六、搜索验证参考

- Ant Design Modal styles: https://ant.design/components/modal#components-modal-demo-use-style
- JSZip: https://stuk.github.io/jszip/
- Electron webUtils: https://www.electronjs.org/docs/latest/api/web-utils

---

## 审查意见（2026-06-29）

> 审查方法：逐条对照源码验证技术描述准确性，网络搜索验证技术方案可行性

### 问题1：✅ 根因正确，修复方案正确

**代码验证确认**：
- `previewHandover` 返回原始 `HandoverJSON`，不做任何转换 ✅
- `handover:preview` IPC handler 直接透传，不做映射 ✅
- ImportDialog 读取 `data.projectName`/`data.fileCount`/`data.stage`，全部是扁平字段 ✅
- 实际 `HandoverJSON` 结构是嵌套的：`data.project.name`、`data.files.length`、`data.project.current_stage` ✅
- `windowApi.ts` 中 preview 返回类型是 `any`，编译期无法发现此错误 ✅

**修复方案正确**，字段映射改为 `data.project?.name`、`data.files?.length`、`data.project?.current_stage` 即可。`handover_note` 是顶层字段，当前映射碰巧能工作。

### 问题2：✅ 根因正确，修复方案基本正确，有遗漏

**代码验证确认**：
- `importHandover` 没有导入 `updateProject`，只导入了 `getProject` 和 `createProject` ✅
- metadata 只写入磁盘文件 `.ai/metadata.json`，未写入数据库 ✅
- `is_analyzed` 硬编码为 `false`（line 191）✅
- `currentStage` 在 line 137 读取后从未使用，是死变量 ✅

**修复方案评估**：

1. **metadata 写入数据库**：方案正确。注意 `HandoverJSON` 的 metadata 有两层——`data.project.metadata`（必需）和 `data.metadata`（可选），方案中的 fallback `data.project?.metadata || data.metadata || {}` 覆盖了两种情况 ✅

2. **is_analyzed 保留**：`!!(fileEntry.ai_summary || fileEntry.content_extracted)` 逻辑合理——导入时 `content_extracted` 已被恢复（line 190），所以有内容的文件会标记为已分析 ✅

3. **恢复项目阶段**：方案正确，在 metadata 写入后调用 `updateProject` 更新 `current_stage` ✅

**遗漏项**：

`has_signature` 同样被硬编码为 `false`（line 192），而 `signature_status` 已从 `fileEntry.signature_status` 恢复。两者不一致——如果导出时文件有签名，导入后 `signature_status` 正确但 `has_signature` 被重置。建议一并修复：

```typescript
has_signature: fileEntry.signature_status === 'signed',
```

### 问题3（文档编号跳到了问题4）：⚠️ 根因分析不准确，修复方案有坑

**代码验证发现关键问题**：

文档说"Dragger 内部样式可能覆盖了 Modal 的 maxHeight"——这个方向对了但不够精确。**真正的元凶是 `src/styles/overrides.css` lines 43-61 的全局规则**：

```css
.ant-upload-drag {
  min-height: 64px !important;
  max-height: 80px !important;    /* ← 这是根因 */
}
```

这个 `!important` 规则全局生效，**所有** Dragger 实例都被限制在 64-80px 高度。当前 ImportDialog 的 Dragger 设了 inline `height: '200px'`，但被 `max-height: 80px !important` 强制压扁到 80px。

**文档提出的修复方案（移除 Dragger 固定高度）是无效的**——移除 inline height 后，Dragger 仍然会被 `overrides.css` 的 `max-height: 80px !important` 限制在 80px，上传区域会非常小，根本不适合拖拽操作。

**正确的修复方案有两种**：

**方案 A（推荐）**：在 `overrides.css` 中为 ImportDialog 的 Dragger 添加例外规则

```css
/* overrides.css 新增 */
/* ImportDialog 的拖拽上传区域需要更大空间 */
.ant-modal .ant-upload-drag {
  min-height: 200px !important;
  max-height: none !important;
}
```

这样只影响 Modal 内的 Dragger，不影响其他页面（如 FileDropZone）的 Dragger。

**方案 B**：在 ImportDialog 的 Dragger inline style 中用 `!important` 覆盖

```tsx
<Dragger
  style={{
    padding: '32px 0',
    height: '320px',
    maxHeight: 'none !important',  // 覆盖 overrides.css 的 max-height: 80px
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  }}
>
```

但 React inline style 不支持 `!important` 语法（会被忽略），所以方案 B 实际上行不通，**必须用方案 A**。

**另外**：当前代码中 Modal 的 `styles.body` 已设为 `maxHeight: '680px'`（之前审查建议的 480px 被改大了），这个值偏大。建议改回 480-520px 范围，配合方案 A 的 Dragger 320px 高度，整体视觉更协调。

### 汇总

| 问题 | 方案准确性 | 需修正项 |
|------|-----------|---------|
| 问题1 预览字段映射 | ✅ 正确 | 无 |
| 问题2 metadata 恢复 | ✅ 基本正确 | 遗漏 `has_signature` 的恢复 |
| 问题3 项目阶段恢复 | ✅ 正确 | 无 |
| 问题4 弹窗高度 | ⚠️ 根因不精确，方案无效 | 真正原因是 `overrides.css` 的 `max-height: 80px !important`；移除 Dragger 高度无效，需在 `overrides.css` 中加例外规则 |

---

### 网络验证来源

| 结论 | 验证方式 | 来源 |
|------|---------|------|
| Ant Design Dragger 默认 `height: 100%`，无 min-height | 代码验证 | `node_modules/antd/dist/antd.css` `.ant-upload-drag` 规则 |
| `overrides.css` 全局限制 Dragger 64-80px | 代码验证 | `src/styles/overrides.css` lines 43-61 |
| ImportDialog 已加 `styles.body maxHeight: 680px` | 代码验证 | `ImportDialog.tsx` lines 175-182 |
| ImportDialog Dragger inline `height: 200px` 被覆盖 | 代码验证 | `ImportDialog.tsx` lines 117-128 + `overrides.css` `!important` |
| `previewHandover` 返回原始 HandoverJSON | 代码验证 | `handover-service.ts` lines 123-129 |
| `importHandover` 未调用 `updateProject` | 代码验证 | `handover-service.ts` 全文搜索 |
| `is_analyzed` 硬编码 false | 代码验证 | `handover-service.ts` line 191 |
| `currentStage` 是死变量 | 代码验证 | `handover-service.ts` line 137 读取后无使用 |
| `HandoverJSON` 有双层 metadata | 代码验证 | `handover-service.ts` lines 34-51 接口定义 |
| `windowApi.ts` preview 返回类型为 any | 代码验证 | `src/types/windowApi.ts` line 69 |
| Ant Design Modal styles.body 用法 | 网络搜索 | [Ant Design Modal](https://ant.design/components/modal/) |
| Upload.Dragger 高度控制 | 网络搜索 | [StackOverflow: How to change Dragger height](https://stackoverflow.com/questions/57552905/how-to-change-the-height-of-upload-dragger-in-antd) |
