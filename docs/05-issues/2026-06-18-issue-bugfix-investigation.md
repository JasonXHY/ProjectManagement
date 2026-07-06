# Bug排查与修改方案 v3

**日期**：2026-06-18
**状态**：待Qoder审核

---

## 一、问题清单

| # | 问题 | 优先级 | 状态 |
|---|------|--------|------|
| 1 | 手动/自动推进阶段均未实现 | P0 | 待排查 |
| 2 | 侧边栏文件数：点击类别后其他类别变0 | P0 | 待排查 |
| 3 | 拖拽上传区域高度过大，遮挡文件列表 | P1 | 待修复 |
| 4 | API Key不支持修改，内置Key到期后无法替换 | P1 | 待修复 |
| 5 | Prompt配置显示旧版本内容 | P2 | 待修复 |

---

## 二、问题详情与排查分析

### 问题1：手动/自动推进阶段均未实现

**用户反馈**：推进阶段不管手动还是自动都没实现，最小限度要先把手动推进实现。

#### 排查代码链路

**手动推进链路**（`projectHome.hooks.ts:370-382`）：

```
用户点击"推进到下一阶段"按钮
  → handleManualProgression()
  → 遍历 STAGE_PROGRESSION_RULES 找到下一阶段
  → setProgressionModal({ open: true, targetStage: rule.to, detectedType: '手动推进' })
  → StageProgressionModal 弹窗显示
  → 用户点击确认
  → handleConfirmProgression()
  → projectService.update(project.id, { current_stage: targetStage })
  → IPC: project:update
  → project-handlers.ts:114 → projectDb.updateProject(id, data)
  → 数据库 UPDATE projects SET current_stage = ?
```

**自动推进链路**（`file-handlers.ts:195-205`，本次新增）：

```
文件上传 → 自动AI分类
  → parseClassifyResponse 提取 stage
  → checkStageProgression(project.current_stage, stage)
  → BrowserWindow.send('project:stage-progression-needed', {...})
  → preload.ts: onStageProgressionNeeded 监听
  → projectHome.hooks.ts: useEffect → setProgressionModal
  → 弹窗 → 确认 → 同上
```

#### 代码现状

| 组件 | 代码 | 状态 |
|------|------|------|
| `handleManualProgression` | `projectHome.hooks.ts:370-382` | ✅ 已实现（v11.15修复） |
| `handleConfirmProgression` | `projectHome.hooks.ts:331-353` | ✅ 已实现 |
| `StageProgressionModal` | `src/components/StageProgressionModal.tsx` | ✅ 组件存在 |
| 按钮渲染 | `ProjectHome.tsx:116-120` | ✅ 条件渲染：`project.current_stage !== '关闭'` |
| 后端 `project:update` | `project-handlers.ts:114` | ✅ 支持 `current_stage` 字段 |
| 前端IPC调用 | `projectService.update()` | ✅ 已实现 |
| 自动推进（后端） | `file-handlers.ts:195-205` | ✅ 本次新增 |
| 自动推进（前端监听） | `projectHome.hooks.ts:39-53` | ✅ 本次新增 |

#### 可能的失败原因

1. **`projectService.update` IPC调用失败**：需确认 `projectService.update` 是否正确调用 `window.api.project.update`，以及返回值是否正确处理

2. **`handleConfirmProgression` 依赖数组问题**：依赖 `[project, progressionModal.targetStage, loadFiles, onProjectUpdated]`，其中 `project` 是外部传入的prop，如果父组件没有正确更新project对象，`onProjectUpdated` 回调可能不会触发UI刷新

3. **`onProjectUpdated` 回调未实现或未传递**：如果父组件没有传 `onProjectUpdated`，阶段推进后项目状态不会更新，按钮可能仍然显示/隐藏错误

4. **StageProgressionModal组件问题**：弹窗可能渲染了但没有正确显示，或者确认按钮没有触发 `onConfirm`

5. **数据库更新成功但前端状态未同步**：`handleConfirmProgression` 中 `setProgressionModal` 关闭弹窗后，调用 `onProjectUpdated` 更新project，但如果父组件没有重新渲染ProjectHome，`project.current_stage` 仍然是旧值

#### 建议排查步骤

1. 在 `handleManualProgression` 入口添加 `console.log`，确认按钮点击是否触发
2. 在 `handleConfirmProgression` 中检查 `projectService.update` 返回值
3. 检查父组件是否传递了 `onProjectUpdated` 回调
4. 检查 `StageProgressionModal` 的 `onConfirm` prop 是否正确绑定

---

### 问题2：侧边栏文件数点击类别后其他类别变0

**用户反馈**：进入时显示正确，点到某个类别后其他类别都刷新成0，只有点到的类别显示正确数字。

#### 排查代码链路

**数据流**：

```
useEffect([loadFiles, loadCriticalIssues]) → loadFiles()
  → fileService.list(project.id) → setAllFiles(全部文件)
  → fileService.listByCategory(project.id, selectedCategory) → setFiles(分类文件)
```

**侧边栏计数**（`StageSidebar.tsx:59-66`）：

```typescript
const stageItems = [
  { key: '所有文件', count: files.length },  // ← 注意：这里用的是 files
  ...CLASSIFICATION_STAGES.map(s => ({
    ...s,
    count: files.filter(f => f.category === s.key).length,  // ← 也是 files
  })),
]
```

#### 根因分析

**关键发现**：`StageSidebar` 接收的 prop 是 `allFiles`，但 `StageSidebar` 内部的 `stageItems` 使用的是 `files` 参数名。

在 `ProjectHome.tsx:66`：
```tsx
<StageSidebar
  files={allFiles}  // ← 传入的是 allFiles
  ...
/>
```

`StageSidebar` 的 props 定义（`StageSidebar.tsx:40`）：
```typescript
interface StageSidebarProps {
  files: FileRecord[]  // ← 参数名叫 files，但实际接收的是 allFiles
}
```

所以 `stageItems` 中的 `files.length` 和 `files.filter(...)` 实际上使用的是 `allFiles`，**计数应该始终正确**。

**但问题可能在于**：`loadFiles` 中 `selectedCategory` 作为依赖项，当 `selectedCategory` 变化时 `loadFiles` 被重新创建，触发 `useEffect` 重新执行。在 `useEffect` 执行过程中，如果 `allFiles` 被先 set 为空再 set 为新值，可能导致侧边栏短暂显示0。

**更可能的根因**：`fileService.listByCategory` 在 `selectedCategory` 变化时被调用，返回的是该分类的子集。如果 `listByCategory` 的实现有误（比如返回了空数组），`setFiles([])` 会导致侧边栏计数基于空数组。

但侧边栏用的是 `allFiles`，不是 `files`，所以 `listByCategory` 的返回值不应该影响侧边栏计数。

**真正的问题**：`loadFiles` 在 `selectedCategory` 变化时被重新创建，触发 `useEffect` 重新调用 `loadFiles`。在 `loadFiles` 中：

```typescript
const loadFiles = useCallback(async () => {
  const allResult = await fileService.list(project.id)
  if (allResult.success && allResult.data) {
    setAllFiles(allResult.data)  // ← 更新 allFiles
  }
  // ... 然后根据 selectedCategory 获取 filtered files
}, [project.id, selectedCategory])  // ← selectedCategory 是依赖项
```

`setAllFiles(allResult.data)` 是异步的 React state 更新。在下一次渲染中，`allFiles` 才会更新。如果在 `allFiles` 更新之前有其他操作读取了旧的 `allFiles`，可能导致计数错误。

但 `StageSidebar` 在渲染时读取 `allFiles`，如果 `allFiles` 已经被 `setAllFiles` 更新，计数应该是正确的。

#### 建议排查步骤

1. 在 `loadFiles` 中添加 `console.log('allFiles count:', allResult.data?.length)`，确认 API 返回的数据量
2. 在 `StageSidebar` 中添加 `console.log('files prop length:', files.length)`，确认传入的数据量
3. 检查 `fileService.list` 和 `fileService.listByCategory` 的实现，确认返回值格式

---

### 问题3：拖拽上传区域高度过大

**用户反馈**：高度太高导致下面文件列表完全看不到，需要用户滚轮向下才能发现文件列表。

#### 代码现状

**UploadArea.tsx**：
- `minHeight: '100px'`（内联样式）
- 包含：图标(32px) + 文字(14px) + 格式标签行 → 总高度约100px

**overrides.css**：
```css
.ant-upload-drag {
  min-height: 100px !important;
}
```

**ProjectHome.tsx:84**：
```tsx
{selectedCategory === '所有文件' && <UploadArea onUpload={handleUpload} />}
```

#### 问题分析

1. **Ant Design Dragger 组件的默认行为**：`Upload.Dragger` 内部的 `.ant-upload-btn` 有 `height: 100%`，会撑开整个 dragger 容器
2. **内联样式 vs CSS 优先级**：Ant Design 的 CSS 可能覆盖内联 `minHeight`
3. **flex 布局影响**：`UploadArea` 的父容器可能有 flex 布局，导致 dragger 被拉伸

#### 建议修改方案

1. **减小内联 minHeight**：从 `100px` 改为 `80px` 或更小
2. **缩小图标和间距**：图标从 `32px` 改为 `24px`，减少 margin/padding
3. **添加 CSS 覆盖**：在 overrides.css 中添加 `max-height` 限制
4. **考虑条件渲染**：仅在无文件时显示上传区域，有文件时折叠或隐藏

---

### 问题4：API Key不支持修改

**用户反馈**：内置API Key到期后用户没法替换成自己的API，设计不够全面。

#### 代码现状

**SettingsPage.tsx:392-421**：
```tsx
<Input.Password
  readOnly={isBuiltinApiKey}
  disabled={isBuiltinApiKey}
  onCopy={(e) => isBuiltinApiKey && e.preventDefault()}
  onCut={(e) => isBuiltinApiKey && e.preventDefault()}
  onPaste={(e) => isBuiltinApiKey && e.preventDefault()}
  onContextMenu={(e) => isBuiltinApiKey && e.preventDefault()}
  onKeyDown={(e) => {
    if (isBuiltinApiKey) {
      if (e.ctrlKey && ['c', 'a', 'x'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    }
  }}
  style={isBuiltinApiKey ? { backgroundColor: '#f5f5f5', cursor: 'not-allowed' } : undefined}
  addonAfter={isCustomKeyMode ? (
    <a onClick={handleRestoreBuiltinKey}>恢复内置Key</a>
  ) : undefined}
/>
```

**判断逻辑**（`SettingsPage.tsx:120`）：
```typescript
const isBuiltin = result.data.ai_provider === 'xiaomi' && result.data.ai_model === 'mimo-v2.5';
```

#### 问题分析

1. **硬编码判断**：`isBuiltin` 通过 provider + model 组合判断，如果用户切换了 provider，`isBuiltin` 会变为 false，此时 API Key 字段变为可编辑
2. **但首次弹窗流程**：如果用户在首次弹窗选择"自有API"，`ai_key_source` 被设为 `'custom'`，此时 `isBuiltin` 仍为 true（因为 provider 还是 xiaomi），但 `isCustomKeyMode` 为 true，字段可编辑
3. **没有"切换到自有Key"的入口**：如果用户初始选择了内置Key，后续没有UI入口切换到自定义Key

#### 建议修改方案

1. **添加"切换到自有Key"按钮**：在 API Key 字段旁边添加"使用自己的Key"链接
2. **点击后**：设 `isCustomKeyMode = true`，快照当前内置Key，清空字段让用户填写
3. **保存时**：如果 `isCustomKeyMode` 且用户填写了Key，保存用户的Key；如果未填写，恢复内置Key
4. **移除过度防护**：去掉 `onCopy/onCut/onPaste/onContextMenu/onKeyDown` 拦截，改为视觉提示即可

---

### 问题5：Prompt配置显示旧版本内容

**用户反馈**：Prompt配置显示的内容是老版本的，不是最新的。

#### 代码现状

**后端获取**（`settings-handlers.ts:57-66`）：
```typescript
ipcMain.handle('settings:getPrompts', async () => {
  const settings = settingsDb.getAllSettings()
  return {
    success: true,
    data: {
      classify_stages: settings.classify_prompt_stages || CLASSIFY_PROMPT_STAGES,
      classify_content: settings.classify_prompt_content || CLASSIFY_PROMPT_CONTENT,
      analyze: settings.analyze_prompt || ANALYZE_SYSTEM_PROMPT,
    }
  }
})
```

**前端加载**（`SettingsPage.tsx:134-141`）：
```typescript
const promptsResult = await configService.getPrompts();
if (promptsResult.success && promptsResult.data) {
  form.setFieldsValue({
    classify_prompt_stages: promptsResult.data.classify_stages,
    classify_prompt_content: promptsResult.data.classify_content,
    analyze_prompt: promptsResult.data.analyze,
  });
}
```

#### 问题分析

1. **优先级逻辑**：`settings.classify_prompt_stages || CLASSIFY_PROMPT_STAGES` — 如果数据库中有旧值，会优先显示旧值
2. **用户可能保存过旧版Prompt**：在之前的版本中，用户可能修改并保存了Prompt，这些旧值仍然存在数据库中
3. **新版Prompt未覆盖旧值**：`initDefaultSettings` 只在 key 不存在时写入默认值，不会覆盖已有值

#### 建议修改方案

1. **方案A：强制更新**：在 `initDefaultSettings` 中，检查 Prompt 是否为旧版本格式，如果是则覆盖为新版
2. **方案B：版本标记**：在 settings 中添加 `prompt_version` 字段，版本不匹配时自动更新
3. **方案C：UI提示**：在 Prompt 配置页面添加"恢复默认Prompt"按钮，让用户手动重置

---

## 三、修改优先级建议

| 批次 | 问题 | 预估工作量 |
|------|------|-----------|
| 第1批 | #1 手动推进（排查+修复） | 中 |
| 第2批 | #2 侧边栏文件数 + #3 上传区域高度 | 小 |
| 第3批 | #4 API Key可修改 + #5 Prompt更新 | 中 |

---

## 四、需要Qoder审核的点

1. 问题1：`handleManualProgression` 代码逻辑看起来正确，失败原因可能在哪里？
2. 问题2：侧边栏计数用 `allFiles`，理论上不应受 `selectedCategory` 影响，根因是什么？
3. 问题3：上传区域 `minHeight: 100px` 是否合理？是否有更好的UI方案？
4. 问题4：移除 API Key 防复制保护是否安全？内测版的内置Key防泄漏需求如何平衡？
5. 问题5：Prompt版本管理应该怎么设计？强制覆盖还是用户手动重置？

---

## 五、Qoder 审核意见

**审核人**：Qoder  
**日期**：2026-06-18  
**方法**：全链路源码逐行审查 + 跨模块影响分析

---

### 问题1：手动/自动推进阶段均未实现

#### 1.1 手动推进：代码链路结构完整，最可能的根因是数据库遗留数据

**全链路验证结果**：

| 环节 | 文件 | 状态 |
|------|------|------|
| 按钮渲染 | `ProjectHome.tsx:117` | ✅ 条件 `project.current_stage !== '关闭'` 正确 |
| `handleManualProgression` | `hooks.ts:371-383` | ✅ 遍历 `STAGE_PROGRESSION_RULES` 逻辑正确 |
| Modal 显示 | `StageProgressionModal.tsx` | ✅ `open` prop 由 `progressionModal.open` 控制 |
| `handleConfirmProgression` | `hooks.ts:347-369` | ✅ `projectService.update()` → IPC → DB 链路完整 |
| IPC handler | `project-handlers.ts:114` | ✅ `current_stage` 在 `ALLOWED_PROJECT_FIELDS` 中 |
| DB 更新 | `projects.ts:48-61` | ✅ 动态 SQL 构建正确 |
| `onProjectUpdated` 回调 | `App.tsx:74-76` | ✅ `setSelectedProject(updated)` 正确传播到父组件 |
| 父组件传参 | `App.tsx:297-301` | ✅ `onProjectUpdated={handleProjectUpdated}` 已传递 |

**结论**：手动推进的代码链路**结构完整，没有代码逻辑缺陷**。但以下场景会导致推进失败：

**最可能的根因：数据库中存在旧阶段值**

`STAGE_PROGRESSION_RULES` 的 `from` 字段只有两个值：`'售前'` 和 `'进行中'`。如果数据库中某个项目的 `current_stage` 存储了旧版 10 阶段系统（如 "需求"、"方案"、"设计" 等）的值，且启动迁移时该阶段的映射未命中，则 `handleManualProgression` 遍历所有规则都找不到 `project.current_stage === rule.from` 的匹配，直接走到 `message.info('当前阶段已是最终阶段')` 分支。

**排查方法**：让用户在 DevTools Console 执行以下代码，确认实际值：
```javascript
const projects = await window.api.project.list()
console.log(projects.data.map(p => ({ name: p.name, stage: p.current_stage })))
```

如果发现有项目的 `current_stage` 不是 `'售前'`、`'进行中'`、`'关闭'` 三者之一，则需要补充迁移或手动修正。

**补充建议**：在 `handleManualProgression` 中，当没有匹配规则时，打印当前 `project.current_stage` 的值到 console，便于快速定位：
```typescript
console.warn('[手动推进] 未找到匹配规则, current_stage:', project.current_stage)
message.info('当前阶段已是最终阶段，无法继续推进')
```

#### 1.2 自动推进：存在3个已知风险点

**风险1（高概率）：AI 返回的 `stage` 值不匹配**

`CLASSIFY_PROMPT_STAGES` 指令 AI 返回 `"stage": "售前/进行中/关闭"`，但 LLM 输出非确定性。AI 可能返回：
- 文件分类阶段的值（"启动"、"需求"等10阶段值）
- 空字符串 `""`（被 `parseClassifyResponse` 转为 `null`，`if (stage)` 为 false，跳过推进）
- 格式变体："售前阶段"、"Project in progress" 等

`checkStageProgression` 使用严格字符串匹配（`rule.stages.includes(fileStage)`），任何偏差都会导致返回 `null`，自动推进静默失败。

**风险2（中概率）：`file-handlers.ts` 异步回调中 `project.current_stage` 是过期闭包**

```typescript
// file-handlers.ts:161
const project = getProject(projectId)  // ← 上传时获取
// ... 异步 AI 分类（可能耗时数秒到数十秒）...
aiService.chat([...]).then(async (result) => {
  const progression = checkStageProgression(project.current_stage, stage)  // ← 闭包中的 project 是旧值
})
```

如果在 AI 分类完成前用户手动推进了阶段，`project.current_stage` 仍是上传时的值，可能导致：
- 错误触发：项目已在"进行中"，但闭包中仍是"售前"，重复弹出推进确认
- 漏触发：项目已推进到"进行中"，AI 返回"关闭"，但闭包中的"售前"没有匹配规则

**修复**：在 `.then()` 回调内部重新读取最新的项目数据：
```typescript
.then(async (result) => {
  const latestProject = getProject(projectId)  // ← 重新获取
  if (latestProject && stage) {
    const progression = checkStageProgression(latestProject.current_stage, stage)
    // ...
  }
})
```

**风险3（低概率）：`ai:classify` 路径（手动点击分类按钮）未发送 IPC 推进事件**

`ai-handlers.ts:124-277` 的 `ai:classify` handler 只返回 `{ success: true, data: { stage: fileStage } }`，不发送 `project:stage-progression-needed` IPC 事件。前端 `handleClassify`（hooks.ts:140）自行检查推进，这是正确的。但需确认前端 `checkStageProgression` 的 `project.current_stage` 没有闭包过期问题——因为 `handleClassify` 的依赖数组是 `[project.current_stage, loadFiles]`，闭包中的 `project.current_stage` 始终是渲染时的值，所以这里是安全的。

#### 问题1 审核结论

| 场景 | 根因 | 修复 |
|------|------|------|
| 手动推进失败 | 最可能是 DB 中 `current_stage` 存储了旧阶段值 | 补充数据迁移或让用户手动修正 + 添加 console.warn |
| 自动推进失败 | AI 返回的 stage 值不匹配严格字符串匹配 | 在 `checkStageProgression` 中添加模糊匹配或日志 |
| 自动推进过期 | `file-handlers.ts` 闭包中 project 过期 | 在 `.then()` 回调中重新 `getProject()` |

---

### 问题2：侧边栏文件数点击类别后变0

#### 2.1 数据流确认

**验证结果**：Prop 传递链路正确——`ProjectHome.tsx:66` 传入 `files={allFiles}`，`StageSidebar.tsx` 内部用 `files.filter(f => f.category === s.key)` 计数，确实是基于全量数据，理论上不受 `selectedCategory` 影响。

#### 2.2 真正的根因：`loadFiles` 的 `selectedCategory` 依赖触发不必要的全量重取

**关键代码**（`hooks.ts:55-71`）：

```typescript
const loadFiles = useCallback(async () => {
  const allResult = await fileService.list(project.id)    // ← 取全量
  if (allResult.success && allResult.data) {
    setAllFiles(allResult.data)                            // ← 更新 allFiles
  }
  if (selectedCategory && selectedCategory !== '所有文件') {
    const result = await fileService.listByCategory(project.id, selectedCategory)  // ← 取过滤
    if (result.success && result.data) setFiles(result.data)
  } else {
    setFiles(allResult.data || [])
  }
}, [project.id, selectedCategory])  // ← selectedCategory 在依赖数组中!
```

**问题链**：
1. 用户点击某类别 → `setSelectedCategory('售前')`
2. `selectedCategory` 变化 → `loadFiles` 被重建（新函数引用）
3. `useEffect([loadFiles])` 检测到变化 → 重新执行 `loadFiles()`
4. `fileService.list()` 发起 IPC 请求取全量数据
5. **在 IPC 请求返回之前**，`allFiles` 仍是上一次的值（React state 更新是异步的）
6. IPC 返回后 `setAllFiles(newData)` 更新，React 重新渲染
7. 但如果 `fileService.list()` 返回失败（`{ success: false }`），`setAllFiles` 不会被调用，`allFiles` 保持原值

**变0 的具体触发场景**：

当 `fileService.list()` 返回 `{ success: true, data: [] }`（空数组）时，`setAllFiles([])` 被调用，所有侧边栏计数变为0。这可能发生在以下情况：
- 自动分类的异步进程正在写数据库，导致读操作返回空结果
- sql.js 内存数据库被 `saveDatabase()` 的写操作短暂锁定
- 数据库文件被其他进程占用

#### 2.3 建议修复：将过滤从服务端移到客户端

**根本解法**：`loadFiles` 只负责取全量数据，过滤在客户端完成：

```typescript
const loadFiles = useCallback(async () => {
  const allResult = await fileService.list(project.id)
  if (allResult.success && allResult.data) {
    setAllFiles(allResult.data)
    // 不再单独调用 listByCategory
  }
}, [project.id])  // ← 移除 selectedCategory 依赖

// files 改为 useMemo 派生
const files = useMemo(() => {
  if (!selectedCategory || selectedCategory === '所有文件') return allFiles
  if (selectedCategory === '未分类') {
    return allFiles.filter(f => !f.category || f.category === '未分类')
  }
  return allFiles.filter(f => f.category === selectedCategory)
}, [allFiles, selectedCategory])
```

**优点**：
- 类别切换不再触发 IPC 调用（纯客户端过滤，零延迟）
- `loadFiles` 的依赖只有 `[project.id]`，不会因类别切换重建
- 消除 `allFiles` 和 `files` 之间的同步问题
- 所有 handler 回调稳定化（不再因 `loadFiles` 重建而重建）

#### 问题2 审核结论

文档中的排查方向基本正确但**未找到根因**。真正的根因是 `loadFiles` 的 `selectedCategory` 依赖导致每次类别切换都重新从数据库取全量数据，在特定时序下 `allFiles` 被更新为空数组。修复方案：移除 `selectedCategory` 依赖，改用客户端 `useMemo` 过滤。

---

### 问题3：拖拽上传区域高度过大

#### 3.1 现状评估

`minHeight: 100px` + Ant Design `.ant-upload-drag` 的 `.ant-upload-btn { height: 100% }` 叠加效果，实际渲染高度可能超过 100px。在文件列表较长时确实会遮挡。

#### 3.2 建议方案

1. **内联 minHeight 降到 `64px`**，图标缩小到 `20px`，去掉格式标签行（改为 Tooltip 展示）
2. **overrides.css 中同时限制 max-height**：
   ```css
   .ant-upload-drag {
     min-height: 64px !important;
     max-height: 80px !important;
   }
   ```
3. **有文件时折叠为窄条**：添加一个 `compact` 模式，有文件时只显示图标和文字（`minHeight: 48px`），无文件时显示完整区域

`max-height` 限制不会破坏 Ant Design 内部布局——`Upload.Dragger` 内部的 `.ant-upload-btn` 用 `height: 100%` 撑开父容器，设 `max-height` 后它会被限制在合理范围内。

#### 问题3 审核结论

文档中的方案方向正确。建议进一步压缩到 64-80px 并添加 `max-height` 限制。有文件时考虑折叠为窄条。

---

### 问题4：API Key 不支持修改

#### 4.1 发现3个连锁Bug（严重）

**Bug 4a（Critical）：`ai_key_source` 未在 `ALLOWED_SETTINGS_FIELDS` 白名单中**

`settings-handlers.ts:9-16` 的白名单没有 `ai_key_source`。`settings:update` handler 调用 `validateSettingsKey` 时会静默跳过该字段。这意味着：
- BetaNoticeModal 的 `handleUseBuiltin` 写入 `ai_key_source: 'builtin'` → 被丢弃
- BetaNoticeModal 的 `handleSetupOwnKey` 写入 `ai_key_source: 'custom'` → 被丢弃
- 任何前端尝试写入 `ai_key_source` 的操作都会静默失败

**这是整个问题4的根因。**

**Bug 4b（Critical）：`isCustomKeyMode` 永远无法变为 `true`**

`SettingsPage.tsx:119-131` 的判断逻辑：
```typescript
if (result.data.ai_key_source === 'custom' && isBuiltin) {
  setIsCustomKeyMode(true)  // ← 由于 ai_key_source 永远是 undefined，这行永远不会执行
}
```

`result.data.ai_key_source` 永远是 `undefined`（因为 Bug 4a 导致该字段从未写入数据库），所以条件永远为 `false`。

**Bug 4c（High）：缺少"切换到自有Key"的UI入口**

当 `isBuiltinApiKey` 为 `true` 时，Input.Password 完全锁定（`readOnly` + `disabled` + 拦截所有剪贴板操作）。唯一的切换入口"恢复内置Key"只在 `isCustomKeyMode` 为 `true` 时显示——但由于 Bug 4b，`isCustomKeyMode` 永远无法为 `true`。

**结果**：选择了内置Key的用户**永远无法切换到自有Key**，除非他们先修改 provider/model 为非内置组合，再改回来——这个操作路径极其不直观。

#### 4.2 修复方案

**必须修复（P0）**：在 `ALLOWED_SETTINGS_FIELDS` 中添加 `'ai_key_source'`：

```typescript
// settings-handlers.ts
const ALLOWED_SETTINGS_FIELDS = [
  // ... 现有字段
  'ai_key_source', 'first_launch_done',
]
```

**必须修复（P0）**：在 SettingsPage 添加"切换到自有Key"按钮：

```tsx
{isBuiltinApiKey && !isCustomKeyMode && (
  <a onClick={() => {
    setBuiltinKeySnapshot(form.getFieldValue('ai_api_key'))
    setIsCustomKeyMode(true)
    setIsBuiltinApiKey(false)
    form.setFieldsValue({ ai_api_key: '' })
  }}>
    使用自己的API Key
  </a>
)}
```

**建议修复（P1）**：移除过度的防复制保护（`onCopy/onCut/onPaste/onContextMenu/onKeyDown` 拦截），改为视觉提示。内置Key的安全性不应依赖前端拦截——任何有DevTools经验的用户都能绕过。

#### 4.3 关于审核第4点（安全性）

移除前端防复制**不影响安全性**。理由：
1. API Key 已存储在数据库中，用户可以通过 DevTools 的 Network 面板查看 IPC 请求中的完整 Key
2. `settings:get` handler 返回的 `getAllSettings()` 已经对 API Key 字段做了掩码处理（`sk-***`），但前端需要明文时可以通过专用 IPC 获取
3. 防复制措施只是增加了普通用户的使用障碍，对有意获取 Key 的用户没有实际防护效果
4. 更好的做法是：在 API Key 字段旁边显示"点击复制"按钮，方便用户管理自己的 Key

#### 问题4 审核结论

文档的根因分析不够深入——**真正的问题是 `ai_key_source` 字段被白名单过滤，导致整个自有Key状态机失效**。修复必须从白名单入手，否则 UI 层面的任何改动都无效。

---

### 问题5：Prompt 配置显示旧版本

#### 5.1 根因确认：单向门机制

`settings-handlers.ts:57-66` 的优先级逻辑：
```typescript
classify_stages: settings.classify_prompt_stages || CLASSIFY_PROMPT_STAGES
```

`||` 运算符创建了一个**单向门**：一旦数据库中有了值（用户保存过），代码中的更新永远不会生效。`initDefaultSettings` 中也不包含 prompt 字段的默认值写入。

#### 5.2 推荐方案：版本标记 + "恢复默认"按钮

**后端**：在 `initDefaultSettings` 或数据库迁移中添加版本检查：

```typescript
const CURRENT_PROMPTS_VERSION = '2'  // 每次修改 prompt 时递增
const existingVersion = getSetting('prompts_version') || '1'
if (existingVersion !== CURRENT_PROMPTS_VERSION) {
  setSetting('classify_prompt_stages', CLASSIFY_PROMPT_STAGES)
  setSetting('classify_prompt_content', CLASSIFY_PROMPT_CONTENT)
  setSetting('analyze_prompt', ANALYZE_SYSTEM_PROMPT)
  setSetting('prompts_version', CURRENT_PROMPTS_VERSION)
}
```

**前端**：在 Prompt 配置页面添加"恢复默认"按钮，调用一个 IPC 删除对应的数据库 key：

```typescript
ipcMain.handle('settings:resetPrompt', async (_, key: string) => {
  const db = getDatabase()
  db.run('DELETE FROM settings WHERE key = ?', [key])
  saveDatabase()
  return { success: true }
})
```

#### 5.3 关于审核第5点（强制覆盖 vs 手动重置）

推荐**两者结合**：
- 版本标记自动覆盖（用户无感知，对大多数场景有效）
- "恢复默认"按钮手动重置（给用户控制权，应对版本标记遗漏的场景）

不推荐纯强制覆盖——如果用户自定义了 prompt 并且不希望被覆盖，版本更新时的自动覆盖会造成数据丢失感。

#### 问题5 审核结论

文档的分析方向正确。推荐方案B（版本标记）作为主要机制，配合方案C（"恢复默认"按钮）作为补充。

---

### 审核总结

| 问题 | 文档根因分析 | Qoder 补充发现 | 修复方案 | 优先级调整 |
|------|-------------|---------------|---------|-----------|
| #1 阶段推进 | 列举了5个可能原因 | 确认链路完整，最可能是 DB 遗留旧阶段值 | 先查 DB 数据 + 修复 `file-handlers.ts` 闭包过期 | P0 不变 |
| #2 侧边栏计数 | 方向正确但未定论 | `selectedCategory` 在 `loadFiles` 依赖中导致全量重取 | 移除依赖 + 改用 `useMemo` 客户端过滤 | P0 不变 |
| #3 上传区域 | 分析充分 | 建议同时限制 max-height | 压缩到 64-80px + max-height 覆盖 | P1 不变 |
| #4 API Key | 未找到根因 | **`ai_key_source` 被白名单过滤是根因** | 先加白名单，再加"切换自有Key"按钮 | **提升为 P0** |
| #5 Prompt版本 | 分析正确 | 确认单向门机制 | 版本标记 + 恢复默认按钮 | P2 不变 |

**额外发现**：问题4 和问题2 实际上是同一个 v2 bug 的延续——`ALLOWED_SETTINGS_FIELDS` 白名单遗漏字段。之前 v2 审核中发现 `first_launch_done` 缺失，这次又发现 `ai_key_source` 缺失。**建议全面审查所有前端可能写入的 setting key，确保白名单完整。**
