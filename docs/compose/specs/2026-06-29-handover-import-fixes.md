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

**修复点2：保留is_analyzed状态**

修改line 191，如果文件已有ai_summary则保留分析状态：

```typescript
is_analyzed: !!(fileEntry.ai_summary || fileEntry.content_extracted),
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

Ant Design的Modal `styles.body`设置`maxHeight`可能被Dragger内部样式覆盖。Dragger组件自身有`padding`和`min-height`。

### 修复方案

**改动文件**：`src/components/Handover/ImportDialog.tsx`

方案：移除Dragger的固定高度样式，改为由Modal控制内容高度。Dragger只保留基本样式：

```tsx
<Dragger
  accept=".zip"
  showUploadList={false}
  beforeUpload={handleBeforeUpload}
  style={{ padding: '24px 0' }}
>
```

同时确认Modal的`styles.body`生效。如果仍不生效，可以给renderContent的外层div添加固定高度约束。

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
