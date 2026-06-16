# PMAer v0.1.1 需求与问题记录

> 创建日期：2026-06-16
> 状态：已完成Qoder审核（见第九节）
> 涉及范围：首次启动引导 + AI分类 + 设置页 + 文件提取

---

## 一、首次启动用户引导（新增需求）

### 1.1 需求描述

当前首次启动仅显示一个"内测版说明"弹窗，用户只能点击"我知道了"关闭。需要改为**两步引导流程**，帮助用户完成初始配置。

### 1.2 设计方案

#### 第一步：项目文件存储位置

**触发条件**：`first_launch_done !== 'true'`

**弹窗内容**：
- 标题：`设置项目文件存储位置`
- 描述：`PMAer 会为每个项目创建独立文件夹，用于存放项目文件和AI分析结果。请选择您希望的存储位置。`
- 默认路径显示：`{userData}/projects`（系统默认）
- 操作：
  - 输入框显示当前路径（只读）
  - "浏览"按钮 → 调用系统文件夹选择对话框
  - "使用默认位置"按钮 → 保持默认路径
  - "确认"按钮 → 保存路径到设置 → 进入第二步

**技术实现**：
- 新增IPC handler：`settings:browseFolder` → 调用 `dialog.showOpenDialog({ properties: ['openDirectory'] })`
- 保存到设置：`project_storage_path`
- preload新增：`settings.browseFolder`

#### 第二步：AI模型配置

**弹窗内容**：
- 标题：`配置 AI 助手`
- 描述：`PMAer 支持多家国内主流AI厂商，包括小米MiMo、智谱、阿里千问、百度文心、DeepSeek、腾讯混元、月之暗面Kimi、讯飞星火、百川、MiniMax等。`
- 两个选择按钮：
  - **【我有 API Key，自己设置】**（主按钮）→ 关闭弹窗 + 跳转到设置页AI模型tab
  - **【用开发者的，先试试看】**（次按钮）→ 关闭弹窗 + 使用内置MiMo V2.5 API Key
- 底部提示：`内置API Key将在 2026年7月31日 关闭，届时需配置自己的Key。`

**技术实现**：
- BetaNoticeModal改为两步流程（Step1→Step2）
- Step1确认后保存 `project_storage_path` + `first_launch_done` 的中间状态
- Step2选择"自己设置"时：关闭弹窗 + `setCurrentPage('settings')`
- Step2选择"先试试看"时：关闭弹窗 + 设置 `first_launch_done = 'true'`

### 1.3 涉及文件

| 文件 | 改动 |
|------|------|
| `src/components/BetaNotice/BetaNoticeModal.tsx` | 重写为两步引导流程 |
| `src/App.tsx` | 暴露 `setCurrentPage` 给Modal回调 |
| `electron/ipc/settings-handlers.ts` | 新增 `settings:browseFolder` handler |
| `electron/preload.ts` | 新增 `settings.browseFolder` 方法 |
| `src/types/windowApi.ts` | 新增 `browseFolder` 类型声明 |
| `src/components/Settings/SettingsPage.tsx` | 存储路径添加浏览按钮（见问题3） |

---

## 二、问题1：AI自动分类未触发

### 2.1 现象

上传文件后，AI自动分类未执行，文件始终显示"未分类"。

### 2.2 根因分析

**原因A — 内容提取返回null导致分类被跳过**

`electron/ipc/file-handlers.ts:114`：
```typescript
if (contentExtracted) {  // contentExtracted为null时整段跳过
  // ... 自动分类代码
}
```

`FileExtractor.extract()` 返回null的场景：
- 图片文件（.jpg/.png等）— 设计如此，需云端OCR
- `.doc`旧格式文件 — mammoth库只支持.docx，不支持.doc
- 扫描版PDF — 本地提取文字<10字符时返回null
- 任何提取异常

**实测验证（2026-06-16）**：
| 文件 | 提取结果 | 说明 |
|------|----------|------|
| .txt | ✅ 16068字符 | 正常 |
| .md | ✅ 17052字符 | 正常 |
| .xlsx | ✅ 5620字符 | 正常 |
| .doc | ❌ NULL | mammoth不支持旧.doc格式 |
| .pdf（文字版） | ⚠️ 372字符 | 内容少但可用 |
| .pdf（扫描件） | ⚠️ 16字符 | 几乎无文字 |
| .jpg | ❌ NULL | 设计如此，需云端OCR |

**原因B — AI服务未配置时静默失败**

`file-handlers.ts:122-123`：`getAIService().chat()` 在无API Key时抛错"未配置任何AI供应商"，被 `.catch()` 静默吞掉，用户无感知。

### 2.3 修复方案

#### 方案A：为null内容文件提供fallback分类

对于内容提取为null的文件，仍尝试基于文件名+文件类型进行分类：

```typescript
// file-handlers.ts:114 改为
if (contentExtracted) {
  // 现有AI分类逻辑...
} else {
  // Fallback: 基于文件名和类型推断分类
  const inferredCategory = inferCategoryFromFilename(safeName)
  if (inferredCategory) {
    const targetDir = path.join(projectPath, inferredCategory)
    await fs.mkdir(targetDir, { recursive: true })
    const targetPath = path.join(targetDir, safeName)
    await fs.rename(filePath, targetPath)
    updateFile(id, { category: inferredCategory, stored_path: targetPath })
  }
}
```

`inferCategoryFromFilename` 规则：
- 合同/CON开头 → "售前"
- 验收/SS结尾 → "验收"
- 结算/付款 → "关闭"
- 需求/方案/设计 → "需求"
- 其他 → "未分类"

#### 方案B：添加AI服务预检

在调用 `getAIService().chat()` 前检查是否有可用provider：

```typescript
const ai = getAIService()
if (!ai.hasProviders()) {
  console.warn('[AI分类] 未配置AI供应商，跳过自动分类')
  return  // 或触发fallback
}
```

#### 方案C：分类失败时通知用户

将 `.catch()` 中的 `console.error` 改为 `message.error` 或更新文件状态为"分类失败"。

### 2.4 涉及文件

| 文件 | 改动 |
|------|------|
| `electron/ipc/file-handlers.ts` | 添加null内容fallback + AI预检 |
| `electron/services/ai-service.ts` | 新增 `hasProviders()` 方法 |

---

## 三、问题2：设置页AI模型为空

### 3.1 现象

打开设置页 → AI模型tab，模型下拉框为空或显示不正确的值。

### 3.2 根因

`SettingsPage.tsx` 的 `handleProviderChange` 函数在加载设置时无条件覆盖已保存的模型值：

```typescript
// 第150-154行
const handleProviderChange = (provider: string) => {
  // ...获取provider配置
  form.setFieldsValue({
    ai_model: firstModel?.id || "",  // 用列表第一个模型覆盖保存值！
    ai_base_url: providerConfig.baseUrl,
  })
}
```

加载顺序：
1. `form.setFieldsValue(result.data)` → 正确填入 `mimo-v2.5`
2. `handleProviderChange(result.data.ai_provider)` → 覆盖为 `mimo-v2.5-pro`

### 3.3 修复方案

```typescript
const handleProviderChange = (provider: string) => {
  const providerConfig = providerList.find(p => p.id === provider)
  if (!providerConfig) return

  const currentModel = form.getFieldValue('ai_model')
  const availableModels = providerConfig.models.filter(m => !m.deprecated)
  const modelExists = availableModels.some(m => m.id === currentModel)

  if (!modelExists) {
    const firstModel = availableModels[0] || providerConfig.models[0]
    form.setFieldsValue({
      ai_model: firstModel?.id || "",
      ai_base_url: providerConfig.baseUrl,
    })
  } else {
    form.setFieldsValue({ ai_base_url: providerConfig.baseUrl })
  }
}
```

### 3.4 涉及文件

| 文件 | 改动 |
|------|------|
| `src/components/Settings/SettingsPage.tsx` | `handleProviderChange` 添加模型存在性检查 |

---

## 四、问题3：存储路径无浏览按钮

### 4.1 现象

设置页 → 存储设置tab，"项目存储路径"只有一个文本输入框，没有文件夹浏览按钮。

### 4.2 根因

1. **UI缺失**：`SettingsPage.tsx:376-385` 只渲染 `<Input>`，无浏览按钮
2. **后端缺失**：Electron代码库中无 `dialog.showOpenDialog` IPC handler
3. **图标已导入**：`FolderOutlined` 在第23行导入但未使用

### 4.3 修复方案

#### 后端：新增IPC handler

```typescript
// settings-handlers.ts
ipcMain.handle('settings:browseFolder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: '选择项目文件存储位置',
  })
  if (result.canceled) return { success: false }
  return { success: true, data: result.filePaths[0] }
})
```

#### 前端：添加浏览按钮

```tsx
<Form.Item label="项目存储路径" name="project_storage_path">
  <Input
    placeholder="留空使用默认路径"
    addonAfter={
      <Button
        icon={<FolderOutlined />}
        onClick={async () => {
          const result = await window.api.settings.browseFolder()
          if (result.success && result.data) {
            form.setFieldsValue({ project_storage_path: result.data })
          }
        }}
      >
        浏览
      </Button>
    }
  />
</Form.Item>
```

#### Preload和类型

```typescript
// preload.ts
settings: {
  // ...existing
  browseFolder: () => ipcRenderer.invoke('settings:browseFolder'),
}

// windowApi.ts
settings: {
  // ...existing
  browseFolder: () => Promise<{ success: boolean; data?: string; error?: string }>
}
```

### 4.4 涉及文件

| 文件 | 改动 |
|------|------|
| `electron/ipc/settings-handlers.ts` | 新增 `settings:browseFolder` handler |
| `electron/preload.ts` | 新增 `browseFolder` 方法 |
| `src/types/windowApi.ts` | 新增 `browseFolder` 类型 |
| `src/components/Settings/SettingsPage.tsx` | 存储路径Input添加addonAfter浏览按钮 |

---

## 五、附加需求：MiMo V2.5 Pro隐藏

### 5.1 需求

MiMo V2.5 Pro 不支持多模态（图片/PDF签字检测），在模型选择列表中应隐藏。

### 5.2 方案

在 `model-registry.ts` 的小米MiMo配置中，将 `mimo-v2.5-pro` 标记为 `deprecated`：

```typescript
{
  id: 'mimo-v2.5-pro',
  name: 'MiMo-V2.5-Pro',
  deprecated: true,
  deprecationDate: '2026-06-16',
  replacement: 'mimo-v2.5',
  // ...
}
```

### 5.3 默认模型确认

当前默认模型ID：`mimo-v2.5`（`settings.ts:85`），正确。需确认以下位置同步：
- `electron/database/settings.ts` initDefaultSettings → `mimo-v2.5` ✅
- `electron/services/ai-providers/zhipu.ts` 默认参数 → 不涉及
- `electron/services/ai-service.ts` 默认参数 → 不涉及

---

## 六、已知限制（暂不修复）

| 问题 | 说明 | 计划 |
|------|------|------|
| `.doc`旧格式不支持 | mammoth只支持.docx，旧.doc格式返回null | 后续版本考虑引入antiword或LibreOffice转换 |
| 扫描版PDF提取文字少 | 依赖云端OCR，当前未实现 | 云端OCR为后续功能 |
| 图片文件无法本地提取 | 设计如此，需云端OCR | 同上 |

---

## 七、修复优先级

| # | 需求/问题 | 优先级 | 依赖 |
|---|----------|--------|------|
| 1 | 首次启动引导（存储+AI配置） | P0 | 无 |
| 2 | MiMo V2.5 Pro隐藏 | P0 | 无 |
| 3 | 设置页AI模型默认值修复 | P0 | 无 |
| 4 | AI自动分类fallback | P1 | 无 |
| 5 | AI服务预检+失败通知 | P1 | 无 |
| 6 | 存储路径浏览按钮 | P1 | 依赖IPC handler |

---

## 八、验证清单

修复完成后需验证：

- [ ] 首次启动弹出两步引导
- [ ] 第一步可选择/浏览文件夹，路径正确保存
- [ ] 第二步"自己设置"跳转到设置页
- [ ] 第二步"先试试看"关闭弹窗，内置Key可用
- [ ] 设置页AI模型默认显示mimo-v2.5
- [ ] 切换供应商后模型不被覆盖（若当前值有效）
- [ ] MiMo V2.5 Pro不出现在模型列表
- [ ] 上传.txt/.md/.xlsx文件后自动分类触发
- [ ] 上传图片/扫描PDF后文件移入合理阶段（fallback）
- [ ] AI服务未配置时分类失败有提示
- [ ] 存储路径浏览按钮可打开系统文件夹选择器

---

## 九、审核意见

> 审核人：Qoder
> 审核日期：2026-06-16

### 9.1 首次启动引导（需求一）

**审核结论：方案基本可行，需补充3处细节**

1. **Step1 取消/关闭行为未定义**：如果用户在第一步点击弹窗关闭按钮或按 Esc，当前设计没有说明处理方式。建议明确：关闭按钮应等同于"使用默认位置 + 跳过"，直接进入 Step2。或者禁止关闭，只能前进。

2. **Step2 内置 API Key 状态管理**：选择"先试试看"后设置 `first_launch_done = 'true'`，但没有记录"用户选择了内置Key"这个状态。后续如果用户切换供应商，没有依据来判断是否需要重新提示。建议增加 `ai_key_source: 'builtin' | 'custom'` 字段。

3. **App.tsx 暴露 `setCurrentPage` 的方式**：文档提到 `App.tsx` 需暴露 `setCurrentPage` 给 Modal 回调，但 BetaNoticeModal 是子组件，直接传回调会导致组件间耦合。建议改用 Electron IPC 事件（`window.api.app.navigateTo('settings')`）或 React Context 来传递页面切换意图，保持组件解耦。

### 9.2 问题1：AI自动分类未触发

**审核结论：根因分析准确，修复方案需调整，另发现3个文档未提及的额外问题**

#### 方案A（文件名fallback）— 部分通过，需补充

- `inferCategoryFromFilename` 的规则过于简单（仅靠文件名前缀），实际项目中文件名格式不统一，误分类风险高。建议：
  - fallback 分类结果标记为"自动推断（低置信度）"，在 UI 上用不同颜色标识
  - 增加一条数据库字段 `classification_method: 'ai' | 'filename' | 'manual'`
- 方案A 代码中直接 `fs.rename`，但如果 `targetDir` 已存在同名文件会怎样？需要加文件名冲突处理（如加时间戳后缀）

#### 方案B（AI服务预检）— 通过

- `hasProviders()` 方法的实现思路正确，当前 ai-service.ts 确实没有该方法
- 建议在 `hasProviders()` 返回 false 时，不只是 warn，而是在文件记录中标记 `classification_error: 'no_ai_configured'`，便于 UI 展示提示

#### 方案C（失败通知）— 通过

- 将 `.catch()` 中的静默失败改为用户可见通知，方向正确

#### 【审核补充】文档未提及的3个额外问题

**额外问题1 — AI返回的 stage/summary/keyInfo 被丢弃**（严重程度：中）

`file-handlers.ts` 第 126 行只解构了 `{ category }`，而 AI prompt 明确要求返回 `stage`、`summary`、`key_info` 等字段。这些信息被完全丢弃，没有写入数据库。建议同步保存。

**额外问题2 — parseClassifyResponse 非JSON回退可能产生异常目录名**（严重程度：低）

`electron/utils/ai-response.ts` 第 16-17 行，如果 AI 返回内容不包含 JSON，`defaults.category` 会是整段 AI 响应文本。这个值会被用作 `fs.mkdir` 的目录名，可能产生不可预期的文件夹（如包含空格、特殊字符、过长名称等）。建议在 parseClassifyResponse 中对 fallback category 做 sanitize 处理（移除非法字符、截断长度、匹配预设阶段列表）。

**额外问题3 — 内容截断为 2000 字符**（严重程度：低）

`file-handlers.ts` 第 121 行 `contentExtracted.substring(0, 2000)` 只取前 2000 字符发给 AI。对于大文件，分类关键信息可能在后半部分，导致分类不准。建议后续版本改为取首尾各 1000 字符或增加可配置参数。

### 9.3 问题2：设置页AI模型为空

**审核结论：通过，方案正确**

- 根因分析完全准确，已通过源码确认 `handleProviderChange` 第 151-152 行无条件覆盖 `ai_model`
- 修复方案逻辑正确：先检查当前模型是否存在于新供应商的可用模型列表中，存在则保留
- **小补充**：修复后还需确认 `ai_base_url` 的处理——当前方案在模型存在时只设置 `ai_base_url`，但如果用户之前手动改过 baseUrl 呢？建议保留 `result.data.ai_base_url` 而非总是用 `providerConfig.baseUrl`

### 9.4 问题3：存储路径无浏览按钮

**审核结论：通过，有一处事实更正**

- 根因中"FolderOutlined 在第23行导入但未使用"这个描述**不准确**。实际代码中 `FolderOutlined` 在第 207 行作为"存储设置" tab 的图标使用了：`{ key: 'storage', label: '存储设置', icon: <FolderOutlined /> }`。所以 FolderOutlined 不是未使用的导入，修复时无需移除现有引用。
- 其余方案（新增 IPC handler、preload、类型定义、Input addonAfter）均正确

### 9.5 附加需求：MiMo V2.5 Pro 隐藏

**审核结论：通过，补充一处细节**

- 已通过源码确认 `mimo-v2.5-pro` 当前存在于 `electron/shared/model-registry.ts`（注意：实际路径是 `electron/shared/` 而非 `src/shared/`），且没有 `deprecated` 字段
- 将其标记为 `deprecated: true` 的方案正确
- **补充**：标记 deprecated 后，需确认 `SettingsPage.tsx` 中 `handleProviderChange` 的过滤逻辑 `.filter(m => !m.deprecated)` 能正确将其排除。当前代码已实现此过滤（第 148 行），无需额外修改
- 如果用户之前已选择了 mimo-v2.5-pro 并保存，标记 deprecated 后重新加载页面时，`handleProviderChange` 修复后会发现当前模型不在可用列表中，自动切换到第一个可用模型。这个行为可以接受，但建议加一条 toast 提示"您之前选择的模型已更新"

### 9.6 优先级调整建议

| # | 需求/问题 | 文档优先级 | 审核建议 | 理由 |
|---|----------|-----------|----------|------|
| 1 | 首次启动引导 | P0 | **P0** | 同意，首次体验影响全局 |
| 2 | MiMo V2.5 Pro隐藏 | P0 | **P1** | 降为P1，仅影响模型列表展示，不影响功能 |
| 3 | 设置页AI模型默认值 | P0 | **P0** | 同意，直接影响用户体验 |
| 4 | AI自动分类fallback | P1 | **P1** | 同意 |
| 5 | AI服务预检+失败通知 | P1 | **P0** | 升为P0，静默失败是最差的用户体验，用户会以为功能坏了 |
| 6 | 存储路径浏览按钮 | P1 | **P1** | 同意 |
| 7 | AI返回字段丢弃（新增） | - | **P2** | 不紧急，但浪费了AI能力 |
| 8 | 分类结果sanitize（新增） | - | **P1** | 可能导致文件系统异常，建议尽早修 |

### 9.7 审核总结

文档质量整体较好，根因分析详细且有实测数据支撑。主要审核发现：

- 3个额外问题需要补充到修复范围（AI返回字段丢弃、分类结果sanitize、内容截断）
- 1处事实描述有误（FolderOutlined 并非未使用）
- 首次引导的取消/关闭行为和状态管理需要明确
- 建议调整2项优先级（MiMo V2.5 Pro降为P1、AI预检升为P0）

---

## 十、新增问题（v0.1.1测试发现）

### 10.1 侧边栏阶段文件数量显示错误（P1）

**现象**：点击某个阶段后，其他阶段的文件数量显示为0。只有"所有文件"视图下所有阶段数量正确。

**根因**：`projectHome.hooks.ts:38-51` 的 `loadFiles` 根据 `selectedCategory` 决定调用 `list`（全部）还是 `listByCategory`（单个阶段）。点击阶段后 `files` 状态被替换为该阶段子集，StageSidebar 的计数基于此不完整数据。

**修复方向**：维护独立的 `allFiles` 状态用于侧边栏计数，`files` 状态仅用于表格显示。

### 10.2 safeStorage加密导致API Key失效（P0 — 已修复）

**现象**：MiMo API返回401 Invalid API Key。

**根因**：`safeStorage.encryptString` 的加密格式第一个字节是118（不在0-3范围），`isEncrypted()` 永远返回false，`getDecryptedApiKey` 把加密密文原样返回给API。

**修复**：API Key在本地SQLite中明文存储，移除加密/解密逻辑。

### 10.3 MiMo API URL重复拼接（P0 — 已修复）

**现象**：MiMo API返回404 Not Found。

**根因**：`ai_base_url` 设置为 `https://api.xiaomimimo.com/v1`，MiMo provider 又拼接 `/v1/chat/completions`，最终URL变成 `.../v1/v1/chat/completions`。

**修复**：`ai-service.ts` 和 `signature-detector.ts` 中 MiMo URL 统一去除末尾 `/v1`。

---

## 十一、子分类需求（v0.1.2规划）

详见 `docs/requirements/business-requirements.md` §1.1 文件分类阶段定义。

**核心变更**：
- 每个阶段下新增3-7个子分类，按文档用途区分
- 验收阶段区分"待签"和"已签"状态
- 会议纪要保留在各阶段内，AI通过内容关键词判断归属
- 文件夹结构改为二级：`阶段/子分类/`

**涉及改动**：
- 数据库：files表新增subcategory字段
- Prompt：分类prompt新增子分类判断
- UI：侧边栏子分类展开/折叠
- 文件移动：创建二级文件夹

---

## 给Qoder的评审指令

请Qoder审核以下内容：

1. **需求文档** `docs/requirements/business-requirements.md` — 重点审核§1.1子分类表的完整性和合理性
2. **子分类方案** — 审核各阶段子分类是否覆盖常见项目文档类型，是否有遗漏或冗余
3. **会议纪要跨阶段方案** — 审核"保留在各阶段内，AI通过内容判断"的方案是否可行
4. **实现方案** — 审核数据库schema变更、文件夹结构、prompt改造的技术可行性

**审核要点**：
- 子分类粒度是否合适（不过细也不过粗）
- 验收阶段"待签/已签"的状态区分是否足够
- AI能否准确区分会议纪要的阶段归属
- 文件夹二级结构对用户体验的影响
