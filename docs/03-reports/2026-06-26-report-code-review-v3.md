# 项目管理助手 — 综合代码评审报告 v3.0

> 评审日期：2026-06-13
> 评审范围：`electron/`、`src/`、配置文件、需求文档对照
> 评审方法：依赖安装 + 类型检查 + Lint + 测试 + 生产构建实测，并逐文件追踪代码路径
> 说明：本报告基于**当前代码实测**，**取代** `docs/code-review-report.md`（QoderWork 06-12 版本，已严重过时——其列出的 11 个"严重问题"中至少 6 个早已修复）

---

## 〇、评审方法与"运行"结果（硬证据）

| 命令 | 结果 |
|------|------|
| `npm install` | ✅ exit 0 |
| `tsc --noEmit`（renderer） | ✅ 0 errors |
| `cd electron && tsc` | ✅ 0 errors |
| `eslint .` | ✅ 0 errors，**14 warnings**（`any`×7、`no-console`×5、`exhaustive-deps`×2） |
| `vitest run` | ⚠️ **仅 1 文件 / 1 用例通过**，形同没有测试 |
| `vite build` | ✅ 构建成功，但单 bundle **1.19 MB**，无代码分割 |
| Electron GUI 实际运行 | ⛔ 本环境无法驱动 GUI，且核心 AI 功能需真实厂商 API Key |

> **诚实声明**：这是一个需要 GUI 与真实 AI 厂商 Key 的 Electron 桌面应用，无法在无头环境中真正"点开界面跑一遍"。因此"运行验证"= 安装依赖 + 全量类型检查 + Lint + 测试 + 生产构建（全绿）+ 逐条追踪实际接线的代码路径。凡只能在运行时确认的，均已明确标注。

> **关于旧报告**：`docs/code-review-report.md` 已过时。`validateNumberArray`（S1）、`getPrompts`/`getSessions`（S2/S3）、`safeStorage` 加密（S5）、签字检测重写（S6/S7）、`xlsx`→`exceljs`（M6）、`ProjectTimeline`（L5）均**已修复**。请勿再据其决策。

---

## 一、整体结论

| 维度 | 评价 |
|------|------|
| 架构清晰度 | 🟢 良好。前后端经 contextBridge 隔离，组件拆分合理，IPC 边界清晰 |
| 需求完整性 | 🟡 框架完整、主链路通，但约 **13 项需求未达标**（含 NF-01 核心需求完全缺失） |
| 已实现功能的正确性 | 🔴 **11 个 Bug，其中 1 个致命**（保存设置会损坏 API Key） |
| 安全性 | 🔴 生产环境安全加固因 `NODE_ENV` 判定错误**完全不生效** |
| 健壮性 | 🟡 多个 IPC 无顶层 try/catch；DB/FS 静默不一致 |
| 测试 | 🔴 几乎为零（1 个假测试） |
| 可打包性 | 🔴 `electron-builder` 完全未配置，打不出可用安装包 |

---

## 二、需求完整性逐条核对

图例：✅ 达标 / ⚠️ 部分 / ❌ 缺失

| 需求 | 功能点 | 结论 | 证据 / 差距 |
|------|--------|------|-------------|
| F01.1 | 创建项目 + 文件夹 + 失败回滚 | ✅ | `project-handlers.ts:51-85` |
| F01.1 | **创建 11 个阶段文件夹** | ❌ | 实际只建 3 个：`DEFAULT_STAGES=['售前','进行中','关闭']` `project-handlers.ts:18` |
| F01.2 | 列表 / 卡片+表格 / 搜索筛选排序 | ✅ | `ProjectList.tsx:486-517` |
| F01.3 | **编辑项目名称** | ❌ | 编辑弹窗只能改 `current_stage` `ProjectList.tsx:631` |
| F01.3 | **编辑分类方式 category_type** | ❌ | 无 UI |
| F01.4 / F01.5 | 删除 / 打开文件夹 | ✅ | — |
| F02.1 | 拖拽 + 点击上传 | ✅ | `UploadArea.tsx` |
| F02.1 | **50MB 后端限制** | ❌ | 仅前端校验，后端无条件写盘 `file-handlers.ts:16` |
| F02.1 | **CSV / 图片内容提取** | ❌ | csv 与 png/jpg 落到 `default→null` `file-extractor.ts:40-66` |
| F02.2–02.5 | 列表/删除/打开/手动分类 | ✅ | 手动移动 `file-handlers.ts:285` |
| F03.1 | 单文件分类 | ⚠️ 有 Bug | 见 B2/B3 `ai-handlers.ts:109` |
| F03.2 | 一键/批量分类 + 进度 | ✅ | hooks |
| F03.2 | **批量分类取消** | ❌ | 逻辑已写但**无按钮**触发 `batchCancelledRef` `projectHome.hooks.ts:32/159` |
| F03.3 | 自定义分类 Prompt | ✅ | — |
| F04.1 | 阶段定义 / 自定义 | ⚠️ | 仅 3 阶段；11 阶段仅存在于 prompt |
| F04.2 | **自动阶段推进** | ⚠️ 失效 | 规则仅覆盖 `售前→进行中`、`进行中→关闭`；AI 识别出的"测试/上线/验收"等永不触发 `types/index.ts:110` |
| F04.3 | 手动阶段推进 | ✅ | — |
| F05.1 | 对话窗口 | ✅ | — |
| F05.2 | **AI 回复 Markdown 渲染** | ❌ | 纯文本渲染 `ChatWindow.tsx:448` |
| F05.3 | **上下文文件选择面板** | ❌ | 永远传空数组 `[]` `ChatWindow.tsx:127` |
| F05.4 | 会话持久化/切换/新建/清空 | ⚠️ 有 Bug | 清空闭包陷阱，见 B6 |
| F06 | 时间线 / 里程碑 | ✅ | — |
| F07 | 签字检测 | ⚠️ | 仅 zhipu/mimo 已配置时可用，其余 9 家静默返回 false |
| F08 | 关键信息提取 + 双写 | ✅ | — |
| F09 | 批量操作 | ⚠️ | 取消缺失（同 F03.2） |
| F10 | 多厂商 / Key 加密 / 掩码 | 🔴 致命 Bug | 掩码导致保存时**损坏真实 Key**，见 B1 |
| F11 / NF-05 | 角色选择 + 角色差异化 Prompt | ⚠️ | 角色已存储 `SettingsPage.tsx:403`，但**无任何代码把角色注入 prompt**，差异化未接线 |
| F13 | 4 张统计卡 | ✅ | — |
| F14 | 自定义阶段增/删 | ✅ | — |
| F14 | **阶段排序** | ❌ | 无 UI |
| F14 | **保护默认阶段** | ❌ | 默认阶段也是 `closable`，可删光 `SettingsPage.tsx:448` |
| **NF-01** | **自定义存储路径** ⭐⭐⭐ | ❌ | 完全缺失，`project_storage_path` 全仓库 0 命中 |
| NF-02 | Markdown | ❌ | 同 F05.2 |
| NF-03 | 上下文面板 | ❌ | 同 F05.3 |
| NF-04 | 名称/分类方式编辑 | ❌ | 同 F01.3 |
| NF-05 | 角色差异化 Prompt | ❌ | 角色已存但从未应用 |
| NF-06 | 手动分类物理移动 | ✅ | `file-handlers.ts:285` |

**未达标需求合计约 13 项**：NF-01、F01.3（名称）、F01.3（分类方式）、F02.1（大小）、F02.1（csv/图片）、F03.2（取消）、F04.2（推进）、F05.2、F05.3、F11/NF-05、F14（排序）、F14（保护）。

---

## 三、已实现功能中的 Bug（按严重度）

### 🔴 致命

**B1 — 保存设置会摧毁真实 API Key（必现，开箱即坏）**
- `settings:get` 返回掩码 `'sk-***'`（`settings.ts:60`）
- `loadSettings` 把掩码直接灌进密码框：`form.setFieldsValue(result.data)`（`SettingsPage.tsx:63`）
- `handleSave` 回传全部表单值，于是 `ai_api_key:'sk-***'` 被写库（`SettingsPage.tsx:103` → `settings-handlers.ts:39` → `setSetting` 把字面量 `sk-***` 加密存储）
- **后果**：用户只要打开设置页点一次"保存"（哪怕只改无关字段），真实 Key 即被覆盖成 `sk-***`，全部 AI 功能瘫痪。`required:true` 校验反而保证了掩码值能通过。
- **修复**：保存前剔除未改动的密文字段，并在后端拒绝写入 `'sk-***'`。

```ts
// SettingsPage.tsx handleSave 内，validateFields 之后：
const SECRET_FIELDS = ['ai_api_key', 'classify_api_key', 'zhipu_api_key', 'mimo_api_key'] as const
for (const f of SECRET_FIELDS) {
  if (values[f] === 'sk-***' || values[f] === undefined) delete values[f]  // 未改动则不回写
}
```
```ts
// settings-handlers.ts settings:update 内，setSetting 之前再加一道后端防线：
if (key.endsWith('_api_key') && value === 'sk-***') continue  // 永不把掩码写库
```

### 🔴 严重

**B2 — 多个 IPC handler 无顶层 try/catch，会直接 reject Promise**
`ai:classify`、`ai:analyze`、`file:upload`、`project:delete`、`project:update` 在校验后直接 `await aiService.chat()` / `fs.rename` / `fs.rm`。AI 未配置或 FS 失败时 handler 直接抛错，前端拿到的是 Electron 通用错误而非 `{success:false,error}`。`ai-handlers.ts:109,256`；`file-handlers.ts:16`；`project-handlers.ts:138,112`。与已规范包裹的 `ai:chat` 等**不一致**，违反 §5.2。

建议用统一包装器收口（详见第六节方案 2）。

**B3 — 移动失败却谎报 success，导致 DB/FS 不一致**
`ai:classify`（`ai-handlers.ts:244`）和 `file:updateCategory`（`file-handlers.ts:306`）在 `fs.rename` 失败时仍更新 DB `category` 并返回 `success:true` → 数据库说文件在 A 文件夹，磁盘上还在原处。

```ts
try {
  await fs.rename(file.stored_path, targetPath)
  fileDb.updateFile(fileId, { category, stored_path: targetPath })
} catch (err) {
  console.error('[move] 文件移动失败:', err)
  return { success: false, error: '文件移动失败，分类未应用', code: 'MOVE_FAILED' }
}
```

**B4 — `project:delete` 留下孤儿文件夹且部分成功仍报错**
先删 DB 再 `fs.rm`（无 catch，`project-handlers.ts:155-161`）。rm 抛错时 DB 已删，用户却看到失败提示，且文件夹残留磁盘。

**B5 — 自动阶段推进对真实分类静默失效**
推进规则仅 2 条，AI 识别出的 11 阶段中 8 个（启动/需求/方案/构建/测试/上线/验收/转客户成功）永远匹配不到，`checkStageProgression` 返回 null（`types/index.ts:110`）。这是一个"已实现但实际不工作"的功能。

### 🟡 中等

**B6 — 清空会话可能清错会话（闭包陷阱）**
`handleClearCurrentSession` 使用了 `currentSessionId`，但其 `useCallback` 依赖数组缺少该项（lint 实测 `ChatWindow.tsx:206`）→ 切换会话后清空的是旧会话。

**B7 — AI 模型下拉框加载后为空**
`loadSettings` 从未根据已保存的 provider 回填 `models` 状态，`getModelOptions()` 读空数组 → 模型框首次进入为空，需手动重选厂商才出现（`SettingsPage.tsx:48/58/250`）。F10 联动下拉半残。

```ts
// loadSettings 内 setFieldsValue 之后补：
if (result.data.ai_provider) {
  const p = providerList.find(x => x.id === result.data.ai_provider)
  if (p) setModels(p.models)
}
```

**B8 — 项目卡片永远显示"按阶段分类"**
无论 `category_type` 为何，卡片 meta 都硬编码"按阶段分类"（`ProjectList.tsx:346`），内容分类项目显示错误标签。

**B9 — `loadFiles` / `loadProjects` 无取消守卫**
与 ChatWindow 历史加载不同，二者无 `cancelled` 标记（`projectHome.hooks.ts:38`、`ProjectList.tsx:57`），快速切换项目/分类时可能用旧数据 `setState`。

**B10 — "重置"按钮行为误导**
`handleReset` 仅 `form.resetFields()` + 清空 models 并提示"已重置"，并未恢复服务端默认值，也未重置 `customStages`/prompts（`SettingsPage.tsx:118`）。

**B11 — `isEncrypted()` 启发式不可靠**
对几乎任意字符串都返回 true，导致对明文也尝试解密后静默回退；`encryptValue` 在 safeStorage 不可用时静默存明文，无任何信号（`settings.ts:7-24`）。

---

## 四、代码质量评估（资深视角）

### 4.1 健壮性 🔴

1. **生产安全加固完全失效（高危）**：`setupSecurityHeaders()` 首行 `if (process.env.NODE_ENV !== 'production') return`，但全仓库从不设 `NODE_ENV=production`（dev 设 `development`，打包后为 `undefined`）。结果 **CSP、权限拒绝处理器在真实打包应用里永不生效**（`main.ts:46`）。同时 `main.ts:39` 在"非 development"分支无条件 `openDevTools`，prod 会自动打开开发者工具。
2. **IPC 边界不统一**（见 B2）。
3. **DB/FS 静默不一致**（见 B3、B4）。
4. **后端无 50MB 校验**：限制仅在 `UploadArea.tsx:6`，`StageSidebar` 的 Dragger、`FileDropZone` 都不校验，直接走 IPC 可传任意大小 → 内存/DoS。

### 4.2 Agent 可读性 / 可维护性 🟡

- **`STAGE_STYLE` 重复 3+ 处且颜色已漂移**：`售前` 在不同文件色值不同（`projectHome.styles.ts:2/18`、`ProjectTimeline.tsx:11`、`types/index.ts:103`）。
- **classify 结果归一化逻辑复制 4 份**（`projectHome.hooks.ts:114/166/270` + `FileDropZone.tsx:49`），根因是返回类型 `string | object` 未建模。
- **`project-info.md` 模板、AI-JSON 提取块、校验样板**全是复制粘贴。
- **死代码**：`FileDropZone.tsx` 整个文件无人引用；`EmptyState.ICON_MAP`、`types` 里 `AIConfig`/`ExtractionConfig` 未被引用；`conversations.ts:4` 注释引用了 schema 中已不存在的表。
- **动态 import 反模式**：`ai-handlers.ts:144/297` 对已可静态导入的本地模块用 `await import()`，纯增延迟。
- **dev 代码漏到 prod**：`StyleTest` 路由有 `import.meta.env.DEV` 守卫，但 Header 的"样式验证"按钮无守卫，prod 点击白屏；`StyleTest` 用了 AntD6 已弃用的 `Tabs.TabPane`/`Select.Option`（`App.tsx:147` vs `312`）。

### 4.3 类型安全 🟡（§5.2 要求"无 any / 无 as unknown"）

- `any`×7（lint 实测）：`files.ts:22/25/26`、`conversations.ts:31`、`project-handlers.ts:52`（`categoryType as any`）、`windowApi.ts:44`。
- `as unknown as`：`project-handlers.ts:134`、`UploadArea.tsx:19`。

### 4.4 React 反模式 / 竞态 🟡

- **直接 DOM 操作**：`FileListTable.tsx:253` `document.createElement('input')`、`:268` `document.querySelector('[data-row-key]')` 改 `style.opacity`（依赖 AntD 非公开属性）。
- **JS 写 hover**：`ProjectList`/`ChatWindow`/`StageSidebar` 多处 `e.currentTarget.style`。
- **inline `<style>`**：3 个组件在 JSX 里塞 `<style>{@keyframes}`，每次渲染重建。
- **竞态**：见 B6、B9。

### 4.5 可调试性 🟡

- 大量**静默 catch**：`projectHome.hooks.ts:68/178/282`（批量分类每项失败仅 `failCount++`，丢弃 error，无法定位）、`ProjectInfoCard.tsx:33`、`SettingsPage.tsx:70`。
- 关键问题靠**正则刮 AI 文本**（`projectHome.hooks.ts:58`），格式一变静默变 0。
- `no-console` 5 处警告，缺结构化日志。

### 4.6 测试 🔴（几乎为零）

唯一的 `src/__tests__/utils.test.ts` 在测试内**重新定义**了一个 `formatFileSize` 再测那个副本，**未 import 任何 src 代码**。`src/utils/time.ts`、所有 service、validators、IPC handler **0 覆盖**。

### 4.7 打包 / 配置 🔴

- **`electron-builder` 完全未配置**：无 `electron-builder.yml`，`package.json` 也无 `build` 块（只有 `"build":"vite build"` 脚本）。`electron:build` 跑了等于没 appId/files/asar/签名/sql.js wasm → 打不出可用安装包。
- bundle 1.19MB 未分包；`package.json` 缺 `"type":"module"`（eslint 已抱怨）。

---

## 五、改进方案 — 高层战略

按 ROI 排序：

1. **第 0 优先 — 修"假完成"高危项**：B1（Key 损坏）、`NODE_ENV` 安全失效、B2（IPC 无 try/catch）、后端 50MB 校验。这些是"看起来做了其实没生效/会损坏数据"的项，先堵。
2. **统一 IPC 边界**：用一个 `withHandler()` 包装器收口"校验 + try/catch + 统一错误"，顺手消灭每个 handler 6-10 行重复样板。
3. **建模 AI 返回类型 + 单一数据源**：消除 4 份 classify 归一化、3 份 STAGE_STYLE。
4. **补需求缺口**：Markdown 渲染、上下文文件面板、取消按钮、存储路径、阶段保护、角色注入——多为小改。
5. **拍板 3 vs 11 阶段**，让 prompt / 文件夹 / 推进规则一致。
6. **建测试底座**：抽纯函数（time、validators、checkStageProgression、归一化）先测，关键逻辑覆盖到 60%。

---

## 六、改进方案 — 详细问题 + 代码片段

### 方案 1 — 生产安全加固永不生效 🔴

根因：依赖一个从不被设置的 `NODE_ENV=production`。改用 Electron 官方 `app.isPackaged`。

```ts
// electron/main.ts
import { app } from 'electron'
const isDev = !app.isPackaged   // 唯一可靠的环境判定

function createWindow() {
  // ...
  if (isDev) mainWindow.loadURL('http://localhost:1234')
  else mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'))
  if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' })  // prod 不开
}

function setupSecurityHeaders() {
  const csp = isDev
    ? "default-src 'self' http://localhost:1234 'unsafe-inline'; connect-src 'self' ws://localhost:1234 https:"
    : ["default-src 'self'","script-src 'self'","style-src 'self' 'unsafe-inline'",
       "img-src 'self' data: blob:","object-src 'none'","frame-src 'none'",
       "connect-src 'self' https:","base-uri 'self'","form-action 'self'"].join('; ')
  session.defaultSession.webRequest.onHeadersReceived((d, cb) =>
    cb({ responseHeaders: { ...d.responseHeaders, 'Content-Security-Policy': [csp] } }))
  session.defaultSession.setPermissionRequestHandler((_w, _p, cb) => cb(false))
}
```
> 注意：`connect-src` 必须允许各 AI 厂商 https 域名，否则打包后 AI 调用被 CSP 拦截。

### 方案 2 — IPC handler 统一包装 🔴

```ts
// electron/utils/ipc.ts （新增）
import { ipcMain } from 'electron'
import { handleIpcError } from './errors'
import type { ValidationResult } from './validators'

export function handle<T>(
  channel: string,
  validators: (args: unknown[]) => ValidationResult[],
  fn: (...args: any[]) => Promise<T>,
) {
  ipcMain.handle(channel, async (_e, ...args) => {
    for (const v of validators(args)) {
      if (!v.valid) return { success: false, error: v.error }
    }
    try {
      return { success: true, data: await fn(...args) }
    } catch (err) {
      console.error(`[IPC ${channel}]`, err)
      return handleIpcError(err)
    }
  })
}
```
一举解决 B2、各 handler 重复校验、`ai:classify`/`analyze`/`file:upload`/`project:delete` 裸 reject。

### 方案 3 — 后端 50MB 校验 🔴

```ts
// electron/shared/constants.ts （新增，前后端共用）
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024
```
```ts
// file:upload 写盘前
import { MAX_UPLOAD_BYTES } from '../shared/constants'
if (fileData.content.byteLength > MAX_UPLOAD_BYTES) {
  return { success: false, error: `文件超过 50MB 限制（${(fileData.content.byteLength/1048576).toFixed(1)}MB）` }
}
```
前端 `UploadArea` 同样 import，消除魔法数字 + 双端一致。

### 方案 4 — B1 设置 Key 损坏（见第三节 B1，最高优先）

### 方案 5 — AI 返回类型建模，消除 4 份归一化 🟡

```ts
// src/types/index.ts
export interface ClassifyResult { category: string; stage: string | null; summary: string | null }
```
```ts
// src/services/aiService.ts —— 一处归一化
export async function classify(fileId: number, t?: 'stage'|'content'): Promise<ClassifyResult> {
  const r = await window.api.ai.classify(fileId, t)
  if (!r.success || !r.data) throw new Error(r.error ?? '分类失败')
  return typeof r.data === 'string' ? { category: r.data, stage: null, summary: null } : r.data
}
```
随后删除 hooks 三处 + FileDropZone 一处的 `typeof ... 'stage' in data` 探测。

### 方案 6 — STAGE_STYLE 单一数据源 🟡

```ts
// src/shared/stages.ts （新增，前后端共用）
export const STAGE_STYLE: Record<string, { color: string; bg: string }> = {
  售前: { color: '#92400E', bg: '#FEF3C7' },
  进行中: { color: '#553C9A', bg: '#E9D8FD' },
  关闭: { color: '#4A5568', bg: '#E2E8F0' },
}
```
其余三处改为 import，删除副本。

### 方案 7 — 需求缺口（成本低，建议本轮做）

**(a) Markdown 渲染** `ChatWindow.tsx:448`
```bash
npm i react-markdown remark-gfm
```
```tsx
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
<div className="md-body"><ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown></div>
```

**(b) 上下文文件选择面板** `ChatWindow.tsx`
```tsx
const [ctxIds, setCtxIds] = useState<number[]>([])
// 右侧 240px 面板：files.map(f => <Checkbox checked={ctxIds.includes(f.id)} .../>)
const result = await aiService.chat(projectId, content, ctxIds, currentSessionId)
```

**(c) 批量分类取消按钮** `BatchActionBar.tsx`
```tsx
{batchClassifying && <Button danger size="small" onClick={onCancelBatch}>取消</Button>}
// onCancelBatch -> batchCancelledRef.current = true（hook 每轮已检查）
```

**(d) 自定义阶段保护默认 + 排序** `SettingsPage.tsx:448`
```tsx
const PROTECTED = new Set(['售前','进行中','关闭'])
{customStages.map(s => (
  <Tag key={s} closable={!PROTECTED.has(s)} onClose={() => handleDeleteStage(s)}>{s}</Tag>
))}
// 排序：上下箭头，或引入 dnd-kit 拖拽
```

**(e) NF-01 自定义存储路径**
1. 白名单加 `project_storage_path`（`settings-handlers.ts:9`）
2. `getProjectsRoot()` 读设置：
```ts
// electron/utils/project-path.ts
export function getProjectsRoot(): string {
  const custom = getSetting('project_storage_path')
  return custom && custom.trim() ? custom : path.join(app.getPath('userData'), 'projects')
}
```
3. 设置页加输入框 + 浏览按钮（新增 `settings:pickFolder` handler 调 `dialog.showOpenDialog`）
4. `file-handlers.ts` 两处硬编码 root 改为调用 `getProjectsRoot()`，避免安全校验与真实路径分叉

**(f) NF-05 角色差异化 Prompt**
```ts
// ai-handlers.ts，构建 prompt 前注入角色
const role = settings.user_role || 'pm'
const ROLE_HINT: Record<string,string> = {
  pm: '你面向项目经理，关注进度、风险、里程碑。',
  developer: '你面向开发工程师，关注技术方案与接口文档。',
  pre_sales: '你面向售前，关注报价、方案、客户需求。',
  customer_success: '你面向客户成功，关注验收、交接、签字完整性。',
}
const systemPrompt = `${ROLE_HINT[role] ?? ''}\n${CHAT_SYSTEM_PROMPT}`
```

### 方案 8 — 测试底座 🔴

```ts
// src/utils/__tests__/time.test.ts
import { formatTimeRelative } from '../time'
it('1 小时前', () => {
  const t = new Date(Date.now() - 3600_000).toISOString()
  expect(formatTimeRelative(t)).toMatch(/小时前/)
})
```
```ts
// 暴露已知缺陷的回归用例
import { checkStageProgression } from '@/types'
it('售前+进行中 → 推进', () => expect(checkStageProgression('售前','进行中')?.targetStage).toBe('进行中'))
it('售前+测试 → 不推进（B5 已知缺陷）', () => expect(checkStageProgression('售前','测试')).toBeNull())
```
删除 `utils.test.ts` 假测试；CI 加 `npm run typecheck && npm run lint && npm test`。

### 方案 9 — 打包配置 🔴

```jsonc
// package.json 增 build 块
"build": {
  "appId": "com.example.project-manager",
  "asar": true,
  "files": ["dist/**", "electron/dist/**", "node_modules/**"],
  "extraResources": [{ "from": "node_modules/sql.js/dist/sql-wasm.wasm", "to": "sql-wasm.wasm" }],
  "win": { "target": "nsis" },
  "mac": { "target": "dmg" }
}
```
> `sql.js` 的 wasm 必须 extraResources，否则打包后数据库无法启动。

### 低优先级一次性清理

删 `FileDropZone.tsx`、`EmptyState.ICON_MAP`、未用 type；`StyleTest` 按钮加 `import.meta.env.DEV` 守卫；`package.json` 加 `"type":"module"`；动态 import 改静态；`loadFiles/loadProjects` 加 `cancelled` 守卫；`handleClearCurrentSession` 补 deps；统一 `formatTime`/字节格式化为共享工具。

---

## 七、建议修复顺序

| 批次 | 周期 | 内容 |
|------|------|------|
| **第 1 批（高危/假完成）** | 本周 | B1（Key 损坏）→ 方案 1（NODE_ENV/CSP）→ 方案 2（IPC 包装，含 B2）→ 方案 3（后端 50MB）→ B3/B4（DB/FS 一致） |
| **第 2 批（需求缺口）** | 下周 | 方案 7 a–f（Markdown/上下文/取消/阶段保护/存储路径/角色）+ 拍板 3 vs 11 阶段（修 B5）|
| **第 3 批（质量底座）** | 持续 | 方案 5、6、8、9 + B6–B11 + 低优先级清理 |

---

## 八、问题统计

| 类别 | 数量 |
|------|------|
| 未达标需求 | **~13** |
| 已实现功能中的 Bug | **11**（致命 1、严重 4、中等 6） |
| 代码质量问题 | 安全失效 1（高危）+ 类型/重复/反模式/测试缺失多项 |
| 打包阻断 | 1（electron-builder 未配置） |

### 一句话总结

> 架构与边界设计是合格的，主流程能跑通；但存在**一个开箱必现的致命数据损坏 Bug（保存设置即毁掉 API Key）**、**生产安全加固因环境判定错误完全不生效**、**约 13 项需求未达标（含核心 NF-01）**、以及**几乎为零的测试**。当前状态**不可发布**，建议先完成第 1 批高危修复。

---

## 九、给实现 Agent 的执行指令（Implementation Prompt）

> 以下内容是给**负责修复的 AI Agent** 的完整任务说明。请将本报告全文连同此指令一并交付。

### 你的角色与目标

你是一名资深全栈工程师，负责修复本报告（`docs/code-review-report-v3.md`）中识别出的问题。代码库为 **React 19 + Ant Design 6 + Electron + sql.js（TypeScript）** 的桌面应用。你的目标是：在**不破坏现有可用功能**的前提下，按批次修复缺陷、补齐未达标需求，使项目达到**可发布**标准。

### 工作范围（按批次，严格按顺序）

**第 1 批 — 高危/数据安全（必须先完成并验证通过，才能进入第 2 批）**
1. **B1**：修复保存设置损坏 API Key（前端剔除掩码字段 + 后端拒写 `sk-***`），方案见 §三 B1 / §六方案 4。
2. **方案 1**：将 `NODE_ENV` 环境判定改为 `app.isPackaged`，使 CSP + 权限处理器在打包应用生效，prod 不开 DevTools，`connect-src` 放行 AI 厂商 https 域名。
3. **方案 2**：新增 `electron/utils/ipc.ts` 统一包装器，迁移 `ai:classify`/`ai:analyze`/`file:upload`/`project:delete`/`project:update` 等未包裹 handler，消除裸 reject（B2）。
4. **方案 3**：后端 `file:upload` 增加 50MB 校验，常量抽到 `electron/shared/constants.ts` 并被前端复用。
5. **B3 / B4**：移动失败不再谎报 success；`project:delete` 文件系统删除失败要有 catch 且不残留孤儿、不误报。

**第 2 批 — 未达标需求**
6. 方案 7 a–f：Markdown 渲染、上下文文件面板、批量分类取消按钮、自定义阶段排序+保护默认、NF-01 自定义存储路径、NF-05 角色差异化 Prompt。
7. F01.3：补齐编辑项目名称 + 分类方式。
8. **3 vs 11 阶段决策**：⚠️ 这是**需先与需求方确认**的设计分叉，不要擅自选择。若确认为 11 阶段，则同步 `DEFAULT_STAGES`、阶段文件夹创建、`STAGE_PROGRESSION_RULES`（修 B5）；若维持 3 阶段，则需修正需求文档与 prompt 表述使其自洽。**在得到确认前，仅在报告中标注，不改动此项。**
9. F02.1：补 CSV 与图片内容提取（图片走云端 vision）。

**第 3 批 — 质量底座**
10. 方案 5/6（AI 返回类型建模、STAGE_STYLE 单一数据源）、方案 8（测试底座）、方案 9（electron-builder 配置）、B6–B11、低优先级清理。

### 硬性约束（Constraints）

- **不得破坏现有功能**：每批改动后必须保证既有主链路（创建项目 / 上传 / 分类 / 对话 / 设置保存）仍可用。
- **不得引入 `any` / `as unknown as`**：本报告 §5.2 要求类型安全；新增代码不得增加 lint warning，应逐步消减现有 7 处 `any`。
- **错误处理统一**：所有新增/修改的 IPC handler 必须返回 `{ success: boolean; data?; error? }`，禁止裸 throw 到 renderer。
- **安全不可回退**：不得为图省事放宽 CSP、关闭 sandbox、或明文存储密钥。
- **保持代码风格一致**：沿用现有目录结构、命名、注释密度（中文注释）、`.prettierrc` 与 `eslint.config.js` 规则。
- **小步提交**：每个批次（或每个独立问题）一个聚焦的 commit，commit message 注明对应编号（如 `fix(B1): 保存设置不再覆盖真实 API Key`）。先建分支，不要直接提交到 `main`。
- **遇到设计分叉先问，不要猜**：尤其是第 8 项（3 vs 11 阶段）。

### 每批次的验收标准（Definition of Done）

每完成一批，必须运行并全部通过，把结果贴出来：

```bash
npm run typecheck      # renderer，0 errors
cd electron && npx tsc # main，0 errors
npm run lint           # 0 errors，warning 数不得增加
npm test               # 全绿，且新增的测试有意义（import 真实源码，非副本）
npm run build          # 生产构建成功
```

并逐条说明：

- 本批修复了报告中哪些编号（B*/F*/NF*/方案*），每条引用 `文件:行号` 说明改动点。
- 哪些**无法在无头环境验证**（如需 GUI 点击或真实 API Key 的路径），需人工验证的步骤要写成清单。
- 是否有任何既有功能受影响及如何回归验证。

### 最终交付期望（Final Deliverable）

1. **代码**：分支 + 分批 commit，全部 CI 命令通过。
2. **B1 必现 Bug 闭环**：附复现前后对比（保存设置后 Key 是否仍有效）。
3. **需求达标更新表**：在本报告 §二 的表格基础上，标注每项从 ❌/⚠️ 变为 ✅ 的状态与对应 commit。
4. **测试**：关键纯函数（`time`、`validators`、`checkStageProgression`、classify 归一化、50MB 校验边界）有单元测试，覆盖率较当前显著提升。
5. **可打包**：`npm run electron:build` 能产出带 asar、含 sql.js wasm 的安装包。
6. **遗留与风险清单**：列出本次未处理项（如待需求方确认的 3 vs 11 阶段）、已知限制、后续建议。

### 不要做的事（Out of Scope，除非另行要求）

- 不要重写架构 / 更换框架 / 大规模重排目录。
- 不要升级主依赖大版本（React/AntD/Electron）。
- 不要改动 `.archive/`、`docs/` 下的历史文档（本报告除外的状态更新）。
- 不要在未确认前改动 3 vs 11 阶段的取舍。

---

## 十、修复进度复核（2026-06-16，对照 mainline `4741e17`）

> 实现 Agent 已基于 v3 报告完成一轮修复并合入 mainline。本节为**对照当前代码的逐条复核**（不信 commit message，全部回到代码确认）。
> 实测基线：`tsc --noEmit`（renderer）✅ 0；`vitest run` ✅ **79 passed / 9 files**（v3 时仅 1）；`eslint` ⚠️ **1 error + 26 warnings**（v3 时 0 error）；`cd electron && tsc` 🔴 **报错**（见 R1）。

### 10.1 Bug 修复结果

| 编号 | 状态 | 证据 |
|------|------|------|
| **B1** Key 掩码覆盖 | ✅ 已修 | 前端 `SettingsPage.tsx:114-119` 剔除 `'sk-***'`/undefined；后端 `settings-handlers.ts:40-42` `if (key.endsWith('_api_key') && value==='sk-***') continue` |
| **B2** IPC 裸 reject | ✅ 已修 | `ai:classify` `ai-handlers.ts:146`、`ai:analyze` `:277`、`file:upload` `file-handlers.ts:100`、`project:delete` `project-handlers.ts:155`、`project:update` `:129` 均已 try/catch（内联，未用统一包装器） |
| **B3** 移动失败谎报成功 | ✅ 已修 | `ai-handlers.ts:242` 与 `file-handlers.ts:363` 失败时 `return {success:false, code:'MOVE_FAILED'}` |
| **B4** delete 孤儿/误报 | ⚠️ 部分 | `project-handlers.ts:162` `fs.rm` 仍在同一 try 内、无独立 catch；DB 已先删，rm 抛错则误报+残留（`force:true` 使概率低但路径未隔离） |
| **B5** 自动阶段推进 | ⚠️ 部分（按重设计） | 项目阶段已定为 3（`types/index.ts:98`），文件分类独立为 `FILE_CLASSIFICATION_STAGES`(10)（`:103`）；但 `STAGE_PROGRESSION_RULES` 仍仅 2 条（`:115`），AI 识别出"测试/上线/验收"等仍不触发推进——该路径对 8 个取值依旧形同失效 |
| **B6** 清空会话闭包 | ✅ 已修 | `ChatWindow.tsx:257` deps 含 `currentSessionId` |
| **B7** 模型下拉为空 | ✅ 已修 | `SettingsPage.tsx:93-95` 加载后 `handleProviderChange` 回填 models |
| **B8** 卡片永远"按阶段分类" | ✅ 已修 | `ProjectList.tsx:349` 按 `category_type` 三元判断 |
| **B9** loadFiles/loadProjects 无取消 | ⚠️ 部分 | `ProjectList.tsx:59` 加了 `cancelled` 但 `useEffect:81` 未使用其返回的清理函数→守卫失效；`projectHome.hooks.ts:39` `loadFiles` 仍完全无守卫 |
| **B10** 重置按钮 | ✅ 已修 | `SettingsPage.tsx:138-141` 改为 `await loadSettings()` 恢复已保存配置 |
| **B11** isEncrypted 不可靠 | ✅ 已修（移除） | `settings.ts` 已删除 safeStorage 加密逻辑。⚠️ 副作用：API Key 现以**明文**存库，N01"加密存储"需求重新变为未满足 |

### 10.2 需求缺口结果

| 需求 | 状态 | 证据 |
|------|------|------|
| 阶段文件夹 3→多 | ✅ 已修 | `project-handlers.ts:55` 用 `FILE_CLASSIFICATION_STAGES`(10) 建文件夹 |
| F01.3 编辑名称+分类方式 | ✅ 已修 | `ProjectList.tsx:651-678` 弹窗含 name/status/category_type，`handleEditProject:129` 全量提交 |
| F02.1 后端 50MB | ⚠️ 部分 | `file-handlers.ts:17/96` 已校验，但常量仍**未抽共享**（前端各有一份） |
| F02.1 CSV/图片提取 | ❌ 未修 | `file-extractor.ts:40-66` 仍只支持 txt/md/json/pdf/doc/xls，csv 与图片落 `default→null` |
| F03.2 批量取消按钮 | ✅ 已修 | `BatchActionBar.tsx:45`→`ProjectHome.tsx:130`→`projectHome.hooks.ts:426`，循环内 `:163/:267` 检查 |
| F05.2 Markdown 渲染 | ✅ 已修 | `ChatWindow.tsx:493` `<ReactMarkdown remarkPlugins={[remarkGfm]}>`；依赖已加 |
| F05.3 上下文文件面板 | ✅ 已修 | `ChatWindow.tsx:618` 240px 面板 + `selectedFileIds`，`:154` 传入非空数组 |
| F11/NF-05 角色注入 prompt | ✅ 已修 | `ai-handlers.ts:19` `ROLE_HINT`，chat `:99`、classify `:161` 注入 |
| F14 阶段排序 + 保护默认 | ⚠️ 部分 | 保护✅ `SettingsPage.tsx:567` `closable={!defaultStages.includes(stage)}`；排序❌ 仍无 |
| NF-01 自定义存储路径 | ⚠️ 几乎完成 | 白名单 `settings-handlers.ts:15`✅、`getProjectsRoot` 读取 `project-path.ts:16`✅、设置 UI `SettingsPage.tsx:412` + browse✅。**残留 R3**：`file:delete` `file-handlers.ts:284` 仍硬编码默认根，自定义路径下删文件会失败 |

### 10.3 质量项结果

| 项 | 状态 | 证据 |
|----|------|------|
| 生产安全 NODE_ENV→isPackaged | ✅ 已修 | `main.ts:12` `isDev=!app.isPackaged`，CSP/权限处理器在打包生效，prod 不开 DevTools |
| STAGE_STYLE 单一数据源 | ✅ 已修 | 定义集中于 `projectHome.styles.ts:2/18`，5 个消费方均 import（`types/index.ts:108` `PROJECT_STATUS` 残留近似副本，仅用于编辑弹窗标签） |
| classify 归一化合并 | ⚠️ 部分 | 后端已抽 `electron/utils/ai-response.ts`；renderer `projectHome.hooks.ts:118/170/274` 仍 3 处 `typeof...` 探测，未建 `ClassifyResult` 类型 |
| model-registry 单源 | ✅ 已修 | 仅存 `electron/shared/model-registry.ts`，renderer 经 `@shared` 别名引用 |
| electron-builder 配置 | ⚠️ 部分 | `electron-builder.yml` 有 appId/files/win；**无 sql.js wasm 的 extraResources**（见 R2），无 mac target |
| `type:module` / any 削减 | ⚠️ 部分 | `package.json` 仍缺 `"type":"module"`；源码 `any`/`as unknown as` 约 11 处，未较 v3 减少 |

### 10.4 ⚠️ 本轮修复**新引入**的问题 → ✅ 已于 2026-06-16 全部修复并验证

| 编号 | 严重度 | 问题 | 状态 / 修复方式（已实施并验证） |
|------|--------|------|-------------|
| **R1** | 🔴 高 | **electron 主进程编译失败**：`project-handlers.ts:6` `import ... from '../../src/types'` 跨出 electron `rootDir`，`cd electron && tsc` 报 `TS6059`，打包链路断裂。 | ✅ **已修**：新增 `electron/shared/stages.ts` 作为阶段常量单一数据源；electron 改为 `import from '../shared/stages'`；`src/types/index.ts` 改为 `export { ... } from '../../electron/shared/stages'` 重导出，renderer 消费方与测试零改动。`cd electron && tsc` → exit 0。**附带清理**：删除了 R1 旧 bug 残留的 `src/types/index.{js,js.map,d.ts,d.ts.map}` 编译产物（曾导致 Rollup 解析到陈旧 `.js` 使 `vite build` 报 `PROJECT_STATUS is not exported`），并在 `.gitignore` 加入 `src/**/*.js` 等规则防止复发。 |
| **R2** | 🔴 高 | **sql.js wasm 未配置**：`initSqlJs()` 无 `locateFile`，yml 无 `extraResources`，打包后启动即崩。 | ✅ **已修**：`database/index.ts` 的 `initSqlJs({ locateFile })` 在 `app.isPackaged` 时指向 `process.resourcesPath`，开发态用 `require.resolve('sql.js')`；`electron-builder.yml` 增加 `extraResources: [{from: node_modules/sql.js/dist/sql-wasm.wasm, to: sql-wasm.wasm}]`。**端到端验证**：`electron-builder --dir` 成功产出 `PMAer.app`，且 `Contents/Resources/sql-wasm.wasm` 确实存在（与 locateFile 路径一致）。 |
| **R3** | 🟠 中 | **NF-01 自洽缺口**：`file:delete` 路径校验硬编码默认根，自定义路径下删文件报"路径无效"。 | ✅ **已修**：`file-handlers.ts` `file:delete` 改用 `getProjectsRoot()`，与 `file:open` 一致；同步移除不再使用的 `app` 导入。 |
| **R4** | 🟡 低 | **lint 回归**：1 error（`ai-service.ts:73` `providerConfig` 未用）。 | ✅ **已修**：删除未用的 `providerConfig` 变量及随之失效的 `getProviderById` 导入。`eslint` → **0 error**（26 warnings 为既有 `any`/`no-console`，未新增）。 |

**R1–R4 修复后整体验证（2026-06-16）**：

| 检查 | 结果 |
|------|------|
| `tsc --noEmit`（renderer） | ✅ 0 errors |
| `npm run electron:compile`（main） | ✅ exit 0（R1 修复前为失败） |
| `eslint .` | ✅ **0 errors** / 26 warnings（R4 修复前为 1 error） |
| `vitest run` | ✅ 79 passed / 9 files |
| `vite build` | ✅ 成功（清理陈旧产物后） |
| `electron-builder --dir` | ✅ 产出 `PMAer.app`，wasm 已入 Resources（R2 端到端验证） |

### 10.5 复核小结

- **修复质量良好**：v3 列出的 11 个 Bug 中 **8 个完全修复**、3 个部分；致命 B1 已闭环；需求缺口大部分补齐；测试从 1 → **79**，生产安全加固已真正生效。
- **本轮新引入的 R1–R4 已全部修复并验证**，打包链路恢复可用（已实测产出含 wasm 的 `.app`）。
- **遗留待办（按序）**：B11 重新引入 safeStorage 加密（当前 API Key 明文存储，N01 倒退）→ 收尾 B4（delete 的 fs.rm 独立 catch）/ B5（文件阶段→项目推进对 8 个取值仍失效）/ B9（loadFiles/loadProjects 取消守卫）→ F02.1（csv/图片提取）、F14（阶段排序）、classify renderer 端归一化、`type:module` 与 any 削减。
- 验证标准不变：`npm run typecheck && cd electron && npx tsc && npm run lint && npm test && npm run build` 全绿，且 `npm run electron:build` 能产出含 wasm 的安装包。
