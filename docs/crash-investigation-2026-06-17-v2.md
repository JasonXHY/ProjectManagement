# PMAer 崩溃问题排查文档 v2

**日期**：2026-06-17 16:20
**报告人**：用户
**现象**：应用启动后崩溃，无法正常使用

---

## 1. 已知信息

| 项目 | 值 |
|------|-----|
| Electron版本 | 42.3.3 |
| 操作系统 | Windows |
| 昨天状态 | 正常工作 |
| 今天状态 | 崩溃 |

## 2. 今日代码变更

| Commit | 变更 |
|--------|------|
| 83b7014 | custom_stages旧值bug修复 |
| c973011 | signature_status字段 + AI返回字段 + 移除内容截断 |
| 3f75c51 | signature_status UI + AI摘要tooltip + .doc支持 |
| 7bc07ae | TypeScript类型修复 + word-extractor类型声明 |
| dc1a39c | word-extractor改为动态导入 |
| fc109a7 | sandbox从true改为false |
| ed83bc1 | MiMo URL双重/v1修复 |

## 3. 已排查内容

### 3.1 Electron沙箱错误
```
Electron sandboxed_renderer.bundle.js script failed to run
TypeError: Cannot destructure property 'preloadScripts' of 'binding.startupData' as it is null
```
- 已将 `sandbox: true` 改为 `sandbox: false`
- 已重新编译 TypeScript
- **问题依然存在**

### 3.2 word-extractor模块级导入
- 已改为动态导入（lazy import）
- 启动时不再加载该模块

### 3.3 MiMo URL双重/v1
- 已修复 replace 逻辑
- 167测试全通过

### 3.4 TypeScript编译
- 主进程编译：通过
- 前端类型检查：通过

## 4. 崩溃表现

1. 应用启动后，窗口出现但很快消失
2. 有时打开DevTools后点击浏览按钮崩溃
3. 有时启动后不做任何操作就崩溃
4. 没有明显的错误提示

## 5. 可能的崩溃原因

| 嫌疑 | 说明 |
|------|------|
| **sandbox设置** | 虽然改为false，但可能需要其他配置 |
| **数据库迁移** | 新增3个字段的ALTER TABLE可能有问题 |
| **word-extractor** | 动态导入可能在某些情况下失败 |
| **Electron 42.3.3** | 可能是该版本的已知问题 |
| **preload脚本** | preload.js的加载方式可能有问题 |

## 6. 需要协助排查

1. 检查 Electron 42.3.3 是否有已知的启动崩溃问题
2. 检查 sandbox: false 是否正确生效
3. 检查 preload 脚本的加载方式
4. 检查数据库迁移是否有问题
5. 检查是否有其他配置导致崩溃

## 7. 复现步骤

1. `npm install`
2. `npm run electron:dev`
3. 等待应用启动
4. 应用窗口出现后很快消失

---

**相关文件**：
- electron/main.ts
- electron/preload.ts
- electron/database/index.ts
- electron/services/file-extractor.ts
- electron/services/ai-service.ts

---

## 8. Qoder 二次排查分析

**审核人**：Qoder  
**日期**：2026-06-17  
**方法**：逐文件源码审查 + git diff 变更分析

### 8.1 变更影响分析

三个修复 commit（dc1a39c / fc109a7 / ed83bc1）涉及的变更范围：

| 文件 | 变更内容 | 崩溃风险 |
|------|---------|---------|
| `main.ts` | sandbox: true → false | **高** |
| `file-extractor.ts` | word-extractor 动态导入 | 低（已正确实现） |
| `ai-service.ts` | MiMo URL replace 逻辑 | 低（仅影响 API 调用） |
| `database/index.ts` | 3 条 ALTER TABLE 迁移 | 低（有 try-catch） |
| `database/files.ts` | FileRecord 新增 3 字段 | 低（纯数据结构） |
| `ipc/ai-handlers.ts` | 移除内容截断 + 新字段更新 | 低 |
| `ipc/file-handlers.ts` | 移除内容截断 + 新字段更新 | 低 |
| `FileListTable.tsx` | signature_status 列 + AI tooltip | 低（有空值保护） |

### 8.2 根因分析

#### 根因 #1（高概率）：渲染进程崩溃 → window-all-closed → app.quit() 级联退出

**关键代码**（`main.ts` 第 101-107 行）：

```typescript
app.on('window-all-closed', () => {
  SignatureDetector.destroy()
  closeDatabase()
  if (process.platform !== 'darwin') {
    app.quit()  // ← Windows 下只要窗口关闭就立即退出整个应用
  }
})
```

**机制**：在 Windows 平台上，如果渲染进程因任何原因崩溃导致 BrowserWindow 被销毁，`window-all-closed` 事件会触发，随即调用 `app.quit()` 退出整个应用。用户看到的现象就是"窗口出现后很快消失"，且没有任何错误提示——因为崩溃发生在渲染进程，主进程的 `uncaughtException` 和 `unhandledRejection` 处理器捕获不到渲染进程的错误。

**这解释了所有崩溃表现**：
- "窗口出现但很快消失" → 渲染进程崩溃 → 窗口销毁 → app.quit()
- "有时不做任何操作就崩溃" → React 应用在初始化/首次渲染阶段出错
- "有时点击浏览按钮崩溃" → IPC 通信或 contextBridge 暴露的 API 出错

#### 根因 #2（高概率）：sandbox: false 引入不稳定因素

**commit fc109a7 将 sandbox 从 true 改为 false**（commit message 注明是为了修复拖拽上传问题）。

**原始 sandbox: true 的错误**：
```
Electron sandboxed_renderer.bundle.js script failed to run
TypeError: Cannot destructure property 'preloadScripts' of 'binding.startupData' as it is null
```

这个错误指向 Electron 内部的沙箱渲染器初始化失败，**不是应用代码问题，而是 Electron 安装或版本兼容性问题**。将 sandbox 改为 false 只是绕过了这个报错，并没有解决根本原因。

**sandbox: false 的影响**：
1. 渲染进程获得完整 Node.js 能力，`require()` 可用——增加安全风险
2. preload 脚本的行为模式改变——在 sandbox: true 下 preload 运行在独立的沙箱环境，在 sandbox: false 下 preload 运行在渲染进程的主上下文中
3. `contextBridge.exposeInMainWorld` 在两种 sandbox 模式下的行为有差异，可能导致 IPC 通信异常
4. 如果 Vite dev server 的 HMR（热模块替换）或 source map 在 sandbox: false 下行为异常，可能导致渲染进程崩溃

#### 根因 #3（中概率）：app.whenReady() 缺少错误处理

**关键代码**（`main.ts` 第 85-99 行）：

```typescript
app.whenReady().then(async () => {
  await initDatabase()      // ← 如果这里失败...
  initDefaultSettings()
  registerProjectHandlers()
  // ... 后续代码全部不执行
  createWindow()             // ← 窗口永远不会被创建
})
// 没有 .catch() 处理器！
```

虽然文件顶部有 `process.on('unhandledRejection')` 处理器，但它只做 `console.error` 日志输出，不会阻止应用继续运行。如果 `initDatabase()` 或后续任何步骤抛出异常，整个 `.then()` 链中断，`createWindow()` 永远不会执行，用户看到的就是应用启动后什么都没发生（或者窗口闪一下就消失）。

**可能导致 initDatabase() 失败的场景**：
- 数据库文件被锁定（上次崩溃未正常关闭）
- sql.js 的 WASM 文件加载失败
- 数据库文件损坏

#### 已排除的嫌疑

| 嫌疑 | 结论 | 原因 |
|------|------|------|
| word-extractor 动态导入 | **排除** | 编译输出正确使用 `Promise.resolve().then(() => __importStar(require(...)))` 延迟加载，启动时不触发 |
| MiMo URL 修复 | **排除** | `getFullApiUrl('xiaomi')` 返回完整 URL，replace 逻辑正确剥离后拼接，仅在 API 调用时执行 |
| 数据库迁移 | **排除** | 3 条新 ALTER TABLE 均有 try-catch 包裹，失败时静默跳过；`signature_status DEFAULT 'unsigned'` 确保新列有默认值 |
| FileListTable.tsx | **排除** | `statusConfig[signatureStatus] \|\| statusConfig.unsigned` 在 null/undefined 时安全回退；ErrorBoundary 包裹整个应用 |
| preload.ts | **排除** | 代码未在近期 commit 中修改 |

### 8.3 建议修复方案

#### 第一步：添加渲染进程崩溃诊断（优先执行）

在 `main.ts` 的 `createWindow()` 函数中，创建窗口后添加崩溃事件监听：

```typescript
// 在 createWindow() 函数内，mainWindow 创建后添加：
mainWindow.webContents.on('crashed', (event, killed) => {
  console.error('=== 渲染进程崩溃 ===')
  console.error('killed:', killed)
  console.error('event:', event)
})

mainWindow.on('unresponsive', () => {
  console.error('=== 渲染进程无响应 ===')
})

mainWindow.webContents.on('render-process-gone', (event, details) => {
  console.error('=== 渲染进程异常退出 ===')
  console.error('reason:', details.reason)
  console.error('exitCode:', details.exitCode)
})
```

**目的**：获取实际的崩溃错误信息，确认是否是渲染进程崩溃。

#### 第二步：给 app.whenReady() 添加 .catch()

```typescript
app.whenReady().then(async () => {
  await initDatabase()
  initDefaultSettings()
  registerProjectHandlers()
  registerFileHandlers()
  registerSettingsHandlers()
  registerAIHandlers()
  SignatureDetector.init()
  setupSecurityHeaders()
  createWindow()
}).catch((error) => {
  console.error('应用初始化失败:', error)
  // 可选：显示错误对话框
  const { dialog } = require('electron')
  dialog.showErrorBox('启动失败', `应用初始化失败: ${error.message}`)
  app.quit()
})
```

#### 第三步：尝试恢复 sandbox: true + 修复 Electron 安装

原始 `sandbox: true` 的 `binding.startupData is null` 错误是 Electron 内部问题，建议：

1. 删除 `node_modules/electron` 目录
2. 执行 `npx electron@42.3.3 install` 重新安装 Electron 二进制
3. 如果仍然报错，尝试清除 npm 缓存：`npm cache clean --force` 后重新 `npm install`
4. 将 `sandbox` 恢复为 `true`

如果以上步骤后 sandbox: true 仍报错，则可能是 Electron 42.3.3 版本在当前系统环境的兼容性问题，可以考虑升级或降级 Electron 版本。

#### 第四步：干净的完全重建

```bash
# 停止所有进程后执行：
rm -rf node_modules dist electron/dist
npm install
npm run electron:dev
```

有时 node_modules 中的编译缓存（尤其是 Electron 的 native addon）在多次代码修改后可能不一致。

### 8.4 总结

| 优先级 | 问题 | 修复 |
|--------|------|------|
| **P0** | 无崩溃诊断日志，无法定位实际错误 | 添加 webContents.on('crashed'/'render-process-gone') 监听 |
| **P0** | app.whenReady() 无 .catch() | 添加 .catch() 并显示错误对话框 |
| **P1** | sandbox: false 是绕过措施，非根因修复 | 恢复 sandbox: true + 重新安装 Electron |
| **P2** | window-all-closed 在 Windows 下直接退出 | 可在开发模式下注释掉 app.quit() 以便调试 |

**建议执行顺序**：第一步 → 运行看日志 → 根据日志信息定位具体崩溃点 → 执行第三步修复 sandbox → 如果仍然崩溃则执行第四步完全重建。
