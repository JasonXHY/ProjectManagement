# 项目代码审查报告

> 审查时间：2026-06-12
> 审查人：QoderWork
> 审查范围：electron/、src/、配置文件、安全设置
> 排除范围：.archive/、node_modules/、dist/

---

## 一、严重问题（必须修复）

| 编号 | 文件:行号 | 问题描述 | 修复建议 |
|------|-----------|----------|----------|
| S1 | `electron/ipc/ai-handlers.ts:48-51` | **`validateStringArray` 校验逻辑错误，聊天上下文功能完全不可用**：`contextFileIds` 参数在 `windowApi.ts` 和 `preload.ts` 中声明为 `number[]`，但校验函数 `validateStringArray` 只接受字符串数组。传入数字数组时校验失败，返回"参数类型错误"错误，导致 AI 对话携带文件上下文功能完全无法使用。 | 创建 `validateNumberArray` 校验函数，或将 `validateStringArray` 改为通用 `validateArray(value, itemType, fieldName)`。 |
| S2 | `src/services/configService.ts:13` | **`configService.getPrompts()` 类型缺失，设置页崩溃**：调用了 `window.api.settings.getPrompts()`，但 `windowApi.ts` 的 `settings` 接口只定义了 `get` 和 `update`，没有 `getPrompts` 方法。运行时将抛出 `TypeError: window.api.settings.getPrompts is not a function`。 | 在 `windowApi.ts` 的 `settings` 接口中添加 `getPrompts` 和 `getModelList` 方法类型声明。 |
| S3 | `electron/preload.ts:22-35` | **preload 未暴露 `ai.getSessions` API**：`ai-handlers.ts` 注册了 `ai:get-sessions` 处理器，`windowApi.ts` 声明了 `getSessions` 类型，但 `preload.ts` 中没有对应的 `ipcRenderer.invoke`。前端调用 `window.api.ai.getSessions()` 会报 `undefined is not a function`。 | 在 `preload.ts` 的 `ai` 对象中添加 `getSessions: (projectId: number) => ipcRenderer.invoke('ai:get-sessions', projectId)`。 |
| S4 | `index.html:7` | **CSP 允许 `unsafe-inline` 用于 script-src**：当前策略 `script-src 'self' 'unsafe-inline'` 使 CSP 形同虚设。同时缺少 `connect-src`、`object-src`、`frame-src` 等指令，攻击面过大。 | 生产环境移除 `'unsafe-inline'`，改用 nonce 或 hash；补充 `object-src 'none'; frame-src 'none'; connect-src` 白名单。建议在 `electron/main.ts` 中通过 `session.webRequest.onHeadersReceived` 设置更强的 CSP。 |
| S5 | `electron/database/settings.ts:34-40` | **API Key 明文存储在 SQLite 数据库中**：函数名为 `getDecryptedApiKey`，但实际没有任何加密/解密逻辑，直接返回明文值。数据库文件被窃取时所有 AI 供应商 API Key 全部暴露。 | 使用 Electron 的 `safeStorage` API（`safeStorage.encryptString` / `safeStorage.decryptString`）对 API Key 加密存储。 |
| S6 | `electron/services/signature-detector.ts:37-45` | **隐藏 BrowserWindow 缺少 `sandbox: true`**：签字检测创建的隐藏窗口仅设置了 `offscreen: true` 和 `contextIsolation: true`，未启用 `sandbox`。如果该窗口被利用，攻击者可在非沙箱化的渲染进程中执行代码。 | 在 `webPreferences` 中添加 `sandbox: true`。 |
| S7 | `electron/services/signature-detector.ts:81` | **在隐藏窗口中通过 `file://` 加载 `node_modules` 中的脚本**：直接在渲染进程中暴露了 `node_modules` 目录。通过 `executeJavaScript` 注入包含文件二进制数据的大字符串，存在间接代码注入风险。 | 对 `filePath` 做严格校验（确保在 `projectsRoot` 内），启用 CSP 限制该窗口可执行的脚本。长期考虑使用原生 PDF 渲染方案替代。 |
| S8 | `electron-builder.yml:1-8` | **打包配置严重不完整**：缺少 `asar: true`（源码明文暴露）；缺少平台配置；缺少代码签名配置；`files` 规则过于宽泛（包含 `.ts` 源文件）；未配置 `sql.js` 的 WASM 文件的 `extraResources`。 | 添加 `asar: true`；排除 `.ts` 源文件；添加 `win:` 配置；为 `sql.js` 配置 `extraResources`。 |
| S9 | `src/components/Chat/ChatWindow.tsx:72-93` | **竞态条件 — useEffect 缺少清理**：加载对话历史的 `useEffect` 直接调用 `aiService.getHistory().then()`，没有 abort 或取消机制。当 `currentSessionId` 快速切换时，旧请求的响应可能覆盖新请求结果，导致对话历史错乱。 | 引入 `let cancelled = false` 标记，在 `.then()` 中检查 `if (!cancelled)` 后再 setState；或使用 `AbortController`。 |
| S10 | `src/components/ProjectHome/projectHome.hooks.ts:141-200` | **竞态条件 — 批量操作无取消机制**：`handleBatchClassify` 执行长时间循环异步操作（逐个分类文件），期间用户无法取消，组件卸载后仍会继续执行 setState，可能导致内存泄漏。 | 引入 `AbortController` 或 `isMounted` ref，在每次循环迭代时检查是否应中止；组件卸载时自动取消。 |
| S11 | `src/types/windowApi.ts:30-31` | **IPC 监听器声明但从未使用**：`onClassifyProgress` 和 `removeClassifyProgressListener` 已在类型中定义，但整个前端代码中从未调用。批量分类改为手动逐个轮询，这两个 IPC 通道成为死代码，若后端仍在发送 progress 事件则造成内存泄漏。 | 二选一：(a) 在 `handleBatchClassify` 中注册 `onClassifyProgress` 监听器；(b) 从 `windowApi.ts` 中删除未使用的 API 定义。 |

---

## 二、中等问题（应该修复）

| 编号 | 文件:行号 | 问题描述 | 修复建议 |
|------|-----------|----------|----------|
| M1 | `electron/ipc/settings-handlers.ts:9-15` | **`ALLOWED_SETTINGS_FIELDS` 白名单缺少字段**：缺少 `zhipu_api_url` 和 `mimo_api_url`，`ai-service.ts` 和 `signature-detector.ts` 都尝试读取这两个设置键，但不在白名单中，用户无法通过设置界面修改。 | 在白名单数组中添加 `'zhipu_api_url'` 和 `'mimo_api_url'`。 |
| M2 | `electron/preload.ts:36-42` + `src/types/windowApi.ts:33-36` | **preload 暴露了 `getModelList` 和 `getPrompts`，但类型声明中缺少**：前端 TypeScript 代码无法通过类型检查调用这两个 API。 | 在 `windowApi.ts` 的 `settings` 接口中添加这两个方法的类型声明。 |
| M3 | `electron/main.ts:21-41` | **缺少 Electron 安全加固措施**：未设置权限请求处理器（通知、摄像头等）；未设置 `setWindowOpenHandler` 阻止弹窗；未禁用 `webview` 标签；生产环境可被 DevTools 访问。 | 添加 `setWindowOpenHandler(() => ({ action: 'deny' }))`；设置权限处理器拒绝所有请求；生产环境禁用 DevTools。 |
| M4 | `vite.config.ts:12-14` | **Vite 开发服务器监听所有网络接口**：`port: 1234` 没有配合 `host: 'localhost'`，默认监听 `0.0.0.0`，局域网内其他设备可访问开发服务器。 | 添加 `server: { host: 'localhost', port: 1234, strictPort: true }`。 |
| M5 | `package.json:23` | **`electron` 放在了 `dependencies` 而非 `devDependencies`**：`electron` 和 `electron-builder` 是构建工具，放入 dependencies 导致安装体积暴增。 | 将 `electron` 和 `electron-builder` 移到 `devDependencies`。 |
| M6 | `package.json:31` | **`xlsx` 版本已过时且有安全漏洞**：SheetJS 社区版已停止维护，存在多个 CVE（如 CVE-2024-55916 原型污染）。 | 替换为 `exceljs`（活跃维护）或 SheetJS Pro 版本。 |
| M7 | `tsconfig.json:17-21` | **TypeScript 严格模式可更严格**：缺少 `noImplicitOverride`、`noUncheckedIndexedAccess` 等额外严格检查。 | 添加这些选项提升类型安全。 |
| M8 | `eslint.config.js:7-47` | **ESLint 规则不够完善**：缺少 `eslint-plugin-security`；`no-explicit-any` 仅为 warn；缺少 `no-floating-promises` 规则（可能导致未捕获的 Promise rejection）。 | 添加安全插件；升级 `any` 为 error；添加 `no-floating-promises`。 |
| M9 | `tailwind.config.ts` + `src/index.css:1` | **Tailwind CSS v4 使用了 v3 格式配置文件**：安装了 v4.3.0，但配置文件使用 v3 格式（`content` 数组、`theme` 对象）。`preflight: false` 禁用了 CSS reset。 | 迁移为 v4 的 CSS 配置格式（`@theme` 指令），或确认兼容模式满足需求。 |
| M10 | `src/components/ProjectHome/FileListTable.tsx:263-275` | **React 反模式 — 直接 DOM 操作**：`onRow` 的 `onMouseEnter`/`onMouseLeave` 使用 `document.querySelector` 操作 DOM。Ant Design Table 的 `data-row-key` 非公开 API，版本升级可能变更。 | 使用 CSS hover 规则替代，或在 `onRow` 中使用 React `ref` 管理。 |
| M11 | `src/components/ProjectList/ProjectList.tsx:18-28` | **代码重复 — STAGE_STYLE 重复定义 3 次**：在 `ProjectList.tsx`、`StageProgressionModal.tsx`、`projectHome.styles.ts` 中各有一份定义，维护时极易不同步。 | 统一使用 `projectHome.styles.ts` 中导出的版本。 |
| M12 | `src/components/ProjectList/ProjectList.tsx:484-495` | **代码重复 — `formatTime` 重复定义**：在 `ProjectList.tsx` 和 `ChatWindow.tsx` 中有两份几乎相同的实现。 | 提取到 `src/utils/time.ts` 中共享。 |
| M13 | `src/types/windowApi.ts:14` | **TypeScript 类型安全 — `file.upload` 的 `fileData: any`**：完全没有类型约束，破坏类型安全。 | 定义具体接口 `FileUploadData { name: string; content: ArrayBuffer; type: string }`。 |
| M14 | `src/components/Chat/ChatWindow.tsx:111,133` | **不安全的类型转换**：`crypto.randomUUID() as unknown as number` 将 string 强转为 number，类型系统被完全绕过。 | 直接使用 `crypto.randomUUID()` 作为临时 ID，去掉 `as unknown as number`。 |
| M15 | `src/components/ProjectHome/projectHome.hooks.ts:306-319` | **函数命名与行为不匹配**：`handleStageChange` 实际调用 `fileService.updateCategory(fileId, newStage)`，更新的是 `category` 字段而非 `stage`。stage 和 category 在数据模型中是否同一概念不明确。 | 如果同一概念则统一命名；如果不同则分别定义。 |
| M16 | `src/components/Settings/SettingsPage.tsx:123-135` | **`handleReset` 行为误导**：仅重置表单到初始值（非服务端默认值），但提示"已重置"，用户可能误以为恢复了系统默认配置。`customStages` 和 `prompts` 状态未被重置。 | 实现真正的"恢复默认"功能，调用后端获取默认配置。 |
| M17 | `src/App.tsx:13` | **开发代码残留**：`StyleTest` 页面和对应路由不应出现在生产代码中。Header 中也暴露了"样式验证"按钮。 | 通过 `import.meta.env.DEV` 条件引入。 |
| M18 | `src/components/ProjectHome/StageSidebar.tsx:51-56` + `ProjectHome.tsx:87` | **多处 UI 元素缺少 onClick 处理器**：StageSidebar 的上传按钮和"打开文件夹"按钮、ProjectHome 的"打开文件夹"按钮均无事件绑定，用户点击无反应。 | 为各按钮绑定对应的功能函数。 |
| M19 | `src/components/ProjectHome/projectHome.hooks.ts:34` | **未使用的状态变量**：`_uploading` 被设置但值从未被读取或渲染，是死代码。 | 删除 `_uploading` 状态和相关调用，或在 UploadArea 中展示上传进度。 |
| M20 | `src/components/ProjectHome/ProjectHome.tsx:24` + `Chat/ChatWindow.tsx:35-36` | **未使用的 Props**：`onBack`、`onChat`、`projectName`、`_onBack` 被解构后从未使用。 | 从未使用的 Props 接口中移除，同步更新调用处。 |
| M21 | `src/App.tsx:290-296` | **状态不同步**：项目阶段推进后 `App.tsx` 中的 `selectedProject.current_stage` 不会自动更新，直到用户退出并重新进入项目。 | 在推进成功后同时更新 `selectedProject` 的 `current_stage`。 |
| M22 | `electron/database/index.ts:165-197` | **数据库保存缺乏并发保护**：`saveDatabase` 使用简单的"备份-写入-验证"策略，没有文件锁或队列机制，并发调用可能导致竞争条件。 | 引入写入队列（Promise 链）或文件锁确保串行写入。 |

---

## 三、低优先级（可以改进）

| 编号 | 文件:行号 | 问题描述 | 修复建议 |
|------|-----------|----------|----------|
| L1 | `src/shared/model-registry.ts` + `electron/services/ai-providers/model-registry.ts` | **model-registry.ts 代码重复**：两个文件内容几乎相同，electron 版本多 3 个函数，维护时需修改两处。 | 统一放入 `src/shared/`，两端共同导入。 |
| L2 | `src/components/ProjectList/ProjectList.tsx:680-691` 等 | **内联 `<style>` 标签**：3 个组件在 JSX 中嵌入 `<style>` 标签，每次渲染创建 DOM 节点，样式散落。 | 提取到全局 CSS 文件统一导入。 |
| L3 | `src/components/ProjectHome/UploadArea.tsx:17` | **硬编码魔法数字**：`50 * 1024 * 1024`、`'1.4s'` 等散落在代码中。 | 提取为命名常量。 |
| L4 | `src/components/ProjectHome/projectHome.hooks.ts:8` | **常量位置不当**：`STAGE_ORDER` 硬编码在 hooks 文件中，与 `DEFAULT_STAGES` 内容重复。 | 复用 `types/index.ts` 中已导出的 `DEFAULT_STAGES`。 |
| L5 | `src/components/ProjectList/ProjectGantt.tsx:1` | **组件命名不准确**：`ProjectGantt` 实际渲染 Timeline 而非甘特图。 | 重命名为 `ProjectTimeline`。 |
| L6 | `src/components/common/ErrorBoundary.tsx:27-29` | **错误恢复策略过于粗暴**：`handleReload` 完全重新加载应用，丢失所有客户端状态。 | 先尝试重置 ErrorBoundary 状态，不成功时才 reload。 |
| L7 | `src/components/Settings/SettingsPage.tsx:79-81` | **空 catch 块**：`catch (e) { void e }` 是 hack 写法。 | 使用 `catch {}` 或有意义的错误处理。 |
| L8 | 多处组件 | **直接操作 DOM style 实现 hover**：多个组件使用 `onMouseEnter`/`onMouseLeave` 修改 `e.currentTarget.style`，React 反模式。 | 使用 CSS 类名 + `:hover` 伪类或 Tailwind `hover:` 工具类。 |
| L9 | `src/components/ProjectHome/FileListTable.tsx:249-254` | **DOM 操作创建 input 元素**：空状态的"上传文件"按钮通过 `document.createElement` 动态创建文件选择器。 | 使用 `useRef<HTMLInputElement>` 通过 ref 触发。 |
| L10 | `electron/ipc/settings-handlers.ts:30-31` | **无效设置字段被静默跳过**：用户提交不允许的设置字段时无任何反馈，修改被忽略但用户不知道。 | 收集被跳过的字段并在响应中返回警告。 |
| L11 | `vitest.config.ts:8-10` + `vite.config.ts:6-16` | **路径别名不一致**：vitest 定义了 `@` 别名，但 vite.config.ts 没有相同配置。 | 在 vite.config.ts 中也添加 `resolve.alias`。 |
| L12 | 项目根目录 | **缺少 `.gitignore` 文件**：构建产物、node_modules、数据库文件等可能被意外提交。 | 创建 `.gitignore`，排除常见构建产物和敏感文件。 |
| L13 | `src/shared/model-registry.ts:60` | **模型免费标记可能有误**：腾讯混元 `hunyuan-lite` 标记为 `isFree: false`，但实际是免费模型。 | 核实各模型的免费状态。 |
| L14 | `src/App.tsx:300` | **不必要的非空断言**：`selectedProject.id!` 中 `id` 已是非 optional 的 `number`，不需要 `!`。 | 去掉 `!`。 |

---

## 四、总结

| 类别 | 数量 |
|------|------|
| 严重问题（必须修复） | **11** |
| 中等问题（应该修复） | **22** |
| 低优先级（可以改进） | **14** |
| **总计** | **47** |

### 整体评价

项目在第三轮（28 项功能）和第四轮（28 项代码质量优化）的大规模重构后，整体架构清晰度和代码质量有显著提升。Electron 安全基线（contextIsolation、nodeIntegration: false、sandbox、路径穿越防护、IPC 参数校验体系）已经建立，前后端边界通过 contextBridge 隔离得当，组件拆分合理（ProjectHome 从 1204 行缩减到 144 行 + 8 个子组件）。

**最需要关注的 3 类问题**：

1. **功能阻断型 Bug**（S1-S3）：`validateStringArray` 校验类型不匹配导致聊天上下文功能完全不可用、`getPrompts` 和 `getSessions` API 的 preload/type 声明缺失导致设置页和会话列表功能不可用。这三个问题都是"类型声明与实现不同步"导致的，建议修复后编写端到端的类型一致性校验脚本。

2. **安全加固**（S4-S8）：CSP 过于宽松、API Key 明文存储、隐藏窗口未沙箱化、打包配置不完整。这些在开发阶段可以接受，但在发布前必须修复。

3. **竞态条件与资源泄漏**（S9-S11）：ChatWindow 的历史加载缺少取消机制、批量分类无法中止、IPC 监听器声明但未使用。这些问题在正常使用场景下可能不会立即暴露，但在快速切换或长时间操作时会严重影响体验。

### 建议修复顺序

**第一轮（功能修复，1-2 天）**：S1 → S2 → S3 → M1 → M2 → M18
**第二轮（安全加固，2-3 天）**：S4 → S5 → S6 → S7 → S8 → M3 → M4
**第三轮（质量提升，3-5 天）**：S9 → S10 → S11 → M10-M14 → 其余中等和低优先级
