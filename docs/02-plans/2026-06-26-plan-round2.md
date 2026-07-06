# 第二轮优化方案 — 高优先级功能补全与缺陷修复

> 更新时间：2026-06-11
> 更新人：QoderWork
> 更新内容：新增 T0"一键分类"按钮（MiMo Code 同步需求），整合快速启动方案，完善全部 Task 细节

---

## 1. 背景

第一轮 UI 优化（commit `970e2b4`）完成后，用户与 MiMo Code 进行了验证和讨论，提出以下调整和新需求：

- 拖拽上传区域已缩小（MiMo Code 已完成）
- 新增"一键分类"按钮需求（需 QoderWork 出方案，MiMo Code 实施）
- 第一轮遗留的功能缺口和 Bug 需要在本轮补齐

本轮聚焦于**功能补全**和**已知缺陷修复**，把"半成品"做到完整可用。

---

## 2. 本轮任务总览

| Task | 名称 | 优先级 | 预估工作量 | 涉及文件 |
|------|------|--------|------------|----------|
| T0 | "一键分类"按钮 | P0 | 0.5d | electron, src |
| T1 | 文件预览与系统打开 | P0 | 0.5d | electron, src |
| T2 | SummaryCards 真实数据 | P0 | 0.5d | src |
| T3 | StageNav 自定义阶段 Bug 修复 | P0 | 0.5d | src |
| T4 | 基础错误处理与用户反馈 | P1 | 1d | electron, src |
| T5 | 空状态设计补全 | P1 | 0.5d | src |
| T6 | AI 聊天加载状态与取消 | P1 | 0.5d | src |
| 快速启动 | 开发模式快捷启动 | P1 | 0.5d | 项目根目录（独立） |

**总计**：约 5 天工作量（快速启动可独立先行实施）

---

## T0："一键分类"按钮

> 来源：MiMo Code 同步需求（用户确认）

### 0.1 需求描述

在文件列表上方的操作按钮区域，新增一个"一键分类"按钮，对当前项目中所有**未分类**的文件批量触发 AI 分类。

### 0.2 当前按钮区域代码

位置：`src/components/ProjectHome/ProjectHome.tsx` 第 697–710 行

```tsx
<div style={{ display: 'flex', gap: '8px' }}>
  <Button type="text" size="small" icon={<FolderOpenOutlined />}>
    打开文件夹
  </Button>
  <Button type="text" size="small" icon={<FolderOutlined />} onClick={loadFiles}>
    刷新
  </Button>
  {/* ← 在此处添加"一键分类"按钮 */}
</div>
```

### 0.3 UI 设计方案

#### 按钮样式

| 属性 | 值 | 说明 |
|------|---|------|
| 组件 | Ant Design `Button` | — |
| type | `default` | 不与"打开文件夹"/"刷新"形成视觉层级冲突，保持操作按钮组风格一致 |
| size | `small` | 与现有按钮一致 |
| 图标 | `TagsOutlined` | 语义明确的"分类"图标 |
| 圆角 | `--radius-sm` (6px) | 小按钮圆角 |
| 高度 | 28px（AntD small） | 与现有按钮一致 |

#### 按钮文字与计数

```
[TagsOutlined] 一键分类(5)
```

- 文字固定为 `"一键分类"`
- 括号内的数字为当前**未分类文件数量**（`category === null` 的文件）
- 使用 `font-feature-settings: "tnum"` 确保数字等宽，避免括号左右跳动
- 数字字体大小比文字小 1px（11px），颜色为 `--text-secondary`

#### 按钮位置

放在"刷新"按钮右侧，三个按钮 gap=8px：

```
[打开文件夹] [刷新] [一键分类(5)]
```

#### Hover 效果

- 背景色从 `--bg-surface` 变为 `--bg-hover`
- 边框色从 `--border-default` 变为 `--color-primary`（主色边框高亮）
- 图标和文字颜色从 `--text-secondary` 变为 `--color-primary`
- 过渡时间：`150ms cubic-bezier(0.4, 0, 0.2, 1)`

#### 按钮状态

| 状态 | 视觉表现 | 行为 |
|------|----------|------|
| 默认 | `type="default"`，显示未分类数量，如 `一键分类(5)` | 可点击 |
| 无未分类 | `disabled={true}`，显示 `一键分类(0)` 或 `已全部分类` | 不可点击，透明度 0.5 |
| 分类中 | `loading={true}`，显示 `分类中...`，其余按钮 disabled | 不可点击，防止重复触发 |
| 完成 | 恢复默认状态，Toast 提示 `已分类 5 个文件` | 可点击 |
| 错误 | 恢复默认状态，Toast error 提示失败原因 | 可点击 |

### 0.4 交互流程

```
用户点击"一键分类(5)"
    ↓
按钮进入 loading 状态
    ↓
前端计算未分类文件列表（从已加载的 files 数组中筛选）
    ↓
依次调用 aiService.classify(file.id)（串行，避免并发导致 API 限流）
    ↓
每个文件分类完成后：
    - 更新该文件在列表中的 category 显示
    - 可选：实时更新 SummaryCards 的未分析计数
    ↓
全部分类完成后：
    - 按钮恢复默认状态
    - 显示 message.success("已分类 5 个文件")
    - 自动刷新文件列表（loadFiles()）
```

### 0.5 实现要点

#### 前端

1. 在 `ProjectHome.tsx` 的按钮组中新增 Button
2. 计算 `uncategorizedFiles = files.filter(f => !f.category)`
3. 点击时遍历 `uncategorizedFiles`，串行调用 `handleClassify(file.id)`
4. 维护 `batchClassifying` 状态控制 loading

#### 后端

复用现有的 `ai:classify` IPC 通道，**不需要新增 IPC**。

**注意**：当前 `ai:classify` 只更新数据库 `category` 字段，不会移动物理文件（与 `file:upload` 中的自动分类行为不一致）。如果用户期望"一键分类"也移动物理文件，需要新增 `ai:classifyBatch` IPC 或在现有 `ai:classify` 中补充文件移动逻辑。这是一个**技术决策点**，建议 MiMo Code 在审核时确认。

### 0.6 边界情况

- 分类过程中用户切换页面：前端取消剩余请求（利用组件 unmount）
- 部分文件分类失败：继续处理剩余文件，最后统一提示"X 个成功，Y 个失败"
- 用户中途关闭应用：正在进行的 AI 请求不受影响（已在后端发起）
- 未分类文件数为 0：按钮 disabled，tooltip 显示"所有文件已分类"

---

## T1：文件预览与系统打开

### 1.1 现状

文件表格中每行文件有"预览"和"编辑"按钮，但目前：
- 预览按钮：无 onClick handler，点击无反应
- 编辑按钮：无 onClick handler，点击无反应
- `window.api.file` 暴露了 6 个方法，没有 `open` 或 `preview`

### 1.2 方案设计

**策略**：不实现复杂的应用内预览，而是利用操作系统能力打开文件，简单可靠。

#### 后端新增 IPC

在 `electron/ipc/file-handlers.ts` 中新增：

```
file:open       → 用系统默认程序打开文件（shell.openPath）
```

实现逻辑：
1. 根据 `fileId` 查询 `files` 表获取 `stored_path`
2. 校验路径安全性（必须在 `userData/projects` 目录下）
3. 调用 `shell.openPath(storedPath)` 打开文件
4. 返回 `{ success: true }` 或 `{ success: false, error: string }`

#### Preload 新增

```typescript
file: {
  // ... existing methods
  open(fileId: number): Promise<{ success: boolean; error?: string }>
}
```

#### 前端修改

- 文件表格的"预览"按钮 → 改为"打开"按钮，调用 `window.api.file.open(fileId)`，用系统默认程序打开
- 删除"编辑"按钮（与"打开"功能重复，简化 UI）
- 打开失败时显示 message.error 提示

### 1.3 交互细节

- 按钮 hover 时显示 tooltip："用系统默认程序打开"
- 点击后如果文件正在被其他程序占用（Windows 会弹出提示），显示 message.warning
- 文件不存在时（被移动或删除），显示 message.error 并提供刷新文件列表的选项

---

## T2：SummaryCards 真实数据

### 2.1 现状

`SummaryCards.tsx` 有 4 张卡片：
1. 文件总数 → **已实现**（从 `file:list` 获取）
2. 问题与风险 → **硬编码为 0**
3. 待处理事项 → **硬编码为 0**
4. AI 分析摘要 → **已实现**（从 `file:getSummary` 获取）

### 2.2 方案设计

#### 卡片 2：问题与风险

**数据来源**：从 `project-summary.md` 中解析。AI 分析项目后生成的摘要文件包含结构化的项目分析，可以从中提取"问题"和"风险"相关内容。

**实现方式**：
1. 读取 `project-summary.md` 内容
2. 用简单的正则或关键词匹配提取"问题"、"风险"、"待解决"等段落
3. 计算条目数量作为数字显示
4. 如果摘要文件不存在或无法解析，显示为 `—`（不是 0）

**降级方案**：如果解析不可靠，暂时只显示文字标签"查看项目分析"，点击跳转到 AI 分析功能，不显示数字。

#### 卡片 3：待处理事项

**数据来源**：从 `files` 表计算。

**实现方式**：
1. 查询当前项目的所有文件
2. 统计 `is_analyzed = 0`（未分析）的文件数量
3. 如果所有文件都已分析，显示为 0 或 `✓`
4. 如果存在未分析文件，显示数量并提示"点击运行 AI 分析"

### 2.3 数据流

```
项目加载 → 并行请求：
  ├── file:list(projectId) → 文件列表 → 计算总数、未分析数
  └── file:getSummary(projectId) → 摘要文本 → 解析问题/风险数
      ↓
  更新 SummaryCards 的 4 个值
```

### 2.4 注意事项

- 卡片点击应该跳转到对应的功能区域（问题/风险 → AI 分析，待处理 → 文件列表）
- 数字变化时添加简单的数字滚动动画（CSS transition 即可，不用 framer-motion）

---

## T3：StageNav 自定义阶段 Bug 修复

### 3.1 现状（Bug 描述）

`StageNav.tsx` 中存在一个**数据不一致 Bug**：

1. `loadCategories()` 函数（约第 43-46 行）在 `category_type === 'stage'` 时**始终**使用硬编码的 `DEFAULT_STAGES`（11 个固定阶段），完全忽略 `project.custom_stages` 字段
2. 用户通过"添加分类"功能新增的阶段**可以**成功保存到数据库的 `custom_stages` 字段
3. 但下次加载项目时，这些自定义阶段**不会显示**在侧边栏中
4. 用户感知：添加的自定义阶段在刷新后"消失"了

### 3.2 修复方案

#### 核心修复

在 `loadCategories()` 中优先读取 `project.custom_stages`：

```typescript
// 修复前
if (project.category_type === 'stage') {
  setCategories(DEFAULT_STAGES);
}

// 修复后
if (project.category_type === 'stage') {
  if (project.custom_stages) {
    try {
      const custom = JSON.parse(project.custom_stages);
      if (Array.isArray(custom) && custom.length > 0) {
        setCategories(custom);
        return;
      }
    } catch (e) {
      console.warn('Failed to parse custom_stages:', e);
    }
  }
  setCategories(DEFAULT_STAGES);
}
```

#### 配套完善

1. **添加阶段的交互优化**：当前添加分类的入口存在但不直观，改为在阶段列表底部显示一个"+ 添加阶段"按钮
2. **删除阶段**：为自定义添加的阶段增加删除功能（内置的 11 个默认阶段不可删除）
3. **重命名阶段**：双击阶段名可内联编辑（可选，P2）
4. **文件系统同步**：添加新阶段时，同步在项目目录下创建对应的子文件夹（当前 `project:create` 已有此逻辑，`project:update` 需要补充）

### 3.3 文件系统同步细节

当通过 `project:update` 修改 `custom_stages` 时：
1. 解析新的阶段列表
2. 对比旧的阶段列表（需要额外查询一次旧值）
3. 对**新增**的阶段：在项目目录下创建子文件夹 + `.ai/` 元数据目录
4. 对**删除**的阶段：如果文件夹为空则删除，如果有文件则保留文件夹并提示用户

---

## T4：基础错误处理与用户反馈

### 4.1 现状

当前错误处理的问题：
1. AI 调用失败时，直接在聊天区域显示一段错误文本，没有重试机制
2. 文件上传失败时，只有 console.error，用户看不到反馈
3. IPC 调用失败时，`try-catch` 中的 `catch` 大多只做了 `console.error`
4. 没有全局的错误边界（React Error Boundary）

### 4.2 方案设计

#### 4.2.1 统一 Toast 通知层

在 `src/` 下创建 `utils/notification.ts`：

```typescript
import { message, notification } from 'antd';

export const notify = {
  success: (msg: string) => message.success(msg),
  info: (msg: string) => message.info(msg),
  warning: (msg: string) => message.warning(msg),
  error: (msg: string, description?: string) => {
    notification.error({ message: msg, description, duration: 5 });
  },
};
```

#### 4.2.2 各场景错误处理

| 场景 | 当前行为 | 改进后 |
|------|----------|--------|
| AI 聊天失败 | 聊天区域显示错误文本 | 显示错误文本 + Toast 提示 + "重试"按钮 |
| 文件上传失败 | console.error | Toast error 提示 + 文件列表不变 |
| 文件删除失败 | console.error | Toast error 提示 |
| 项目创建失败 | console.error | Toast error 提示 |
| IPC 调用超时 | 无 | 超过 30 秒显示"操作超时"提示 |
| AI 分析失败 | console.error | Toast error 提示 + 保留已分析的文件状态 |

#### 4.2.3 React Error Boundary

在 `src/` 下创建 `components/ErrorBoundary.tsx`：
- 包裹在 `App` 组件外层
- 捕获渲染错误，显示友好的"出了点问题"页面
- 提供"重新加载"按钮

#### 4.2.4 AI 重试机制

在 AI 聊天失败时：
1. 在消息气泡下方显示"生成失败"标签
2. 旁边显示"重试"按钮
3. 点击重试时重新发送相同请求
4. 最多重试 2 次，之后提示用户检查设置或网络

### 4.3 不做的事情

- **不做**4 级自动重试（原始优化计划 Batch 3 的设想），太复杂且可能掩盖问题
- **不做**全局 loading 遮罩（影响体验）
- **不做**离线检测（Electron 桌面应用，用户自己知道网络状态）

---

## T5：空状态设计补全

### 5.1 现状

第一轮 UI 设计了部分空状态，但以下场景缺少空状态：

| 场景 | 当前表现 | 需要改进 |
|------|----------|----------|
| 项目无文件 | 空白文件表格 | 引导用户上传文件 |
| 阶段无文件 | 空白内容区 | 提示该阶段暂无文件 |
| 无聊天记录 | 空白聊天区域 | 引导用户开始对话 |
| 搜索无结果 | 无反馈 | 显示"未找到匹配结果" |

### 5.2 设计方案

每个空状态遵循统一结构：

```
┌─────────────────────────┐
│      [图标]              │
│    简短描述文字           │
│    [行动按钮] (可选)      │
└─────────────────────────┘
```

#### 项目无文件

- 图标：`InboxOutlined`（AntD）
- 文字："还没有文件"
- 辅助文字："上传文件开始项目管理"
- 按钮："上传文件"（触发文件上传对话框）

#### 阶段无文件

- 图标：`FileTextOutlined`
- 文字："该阶段暂无文件"
- 辅助文字："上传的文件会自动分类到对应阶段"
- 无按钮

#### 无聊天记录

- 图标：`MessageOutlined`
- 文字："开始与 AI 助手对话"
- 辅助文字："可以询问项目进度、文件内容、风险分析等"
- 可选：3 个推荐问题标签（"项目有什么风险？"、"帮我总结文件"、"下一步该做什么？"）

#### 搜索无结果

- 图标：`SearchOutlined`
- 文字："未找到匹配的结果"
- 辅助文字："试试其他关键词"

### 5.3 实现方式

创建 `src/components/common/EmptyState.tsx` 通用组件：

```typescript
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

使用 Ant Design 的 `Empty` 组件作为基础，通过 ConfigProvider 定制样式。

---

## T6：AI 聊天加载状态与取消

### 6.1 现状

当前 AI 聊天的用户体验问题：
1. 发送消息后到收到回复之间，没有明确的加载指示
2. 无法取消正在进行的 AI 请求
3. AI 响应时间可能较长（5-30 秒），用户不知道进度

### 6.2 方案设计

#### 6.2.1 加载状态

发送消息后，在 AI 消息气泡位置显示：

```
┌──────────────────────┐
│  ● AI 正在思考...     │
│  ░░░░░░░░░░░░░░░░░░  │  ← 骨架屏动画条
└──────────────────────┘
```

- 使用 CSS animation 实现呼吸灯效果
- 显示已等待时间（"已等待 5 秒..."），每秒更新
- 超过 30 秒显示"响应较慢，请耐心等待"

#### 6.2.2 取消功能

由于当前 IPC 是 `ipcMain.handle`（请求-响应模式），无法真正取消后端的 API 请求。采用**前端取消**策略：

1. 加载状态旁显示"取消"按钮
2. 点击后前端标记当前请求为"已取消"
3. 当后端响应返回时，检查取消标记，如果已取消则丢弃响应
4. 显示"已取消生成"提示

**注意**：这不会减少后端的 API 调用费用，只是让用户感觉可以中断等待。后续如果要实现真正的后端取消，需要改为 `ipcMain.on` + `event.sender.send` 的事件模式，并使用 AbortController。

#### 6.2.3 发送按钮状态

- 发送中：发送按钮变为"停止"按钮（红色方块图标）
- 发送完成后恢复为发送按钮
- 空消息时发送按钮禁用

---

## 7. 快速启动方案（独立任务）

### 7.1 需求背景

用户需要在开发阶段频繁启动 Electron 应用进行 UI 验证，当前 `npm run electron:dev` 虽然可用，但需要每次打开终端并手动输入命令。用户希望有一种"一键启动"的方式，且不想每次都重新打包。

### 7.2 方案设计

#### 创建启动脚本

在项目根目录创建两个文件：

**`start-dev.bat`**（完整模式）

```bat
@echo off
title Project Manager - Dev Mode
cd /d "%~dp0"
echo ========================================
echo   Project Manager - Development Mode
echo ========================================
echo.

if not exist "node_modules" (
    echo [!] node_modules not found, running npm install...
    call npm install
    echo.
)

echo [*] Compiling Electron main process...
call npx tsc -p electron/tsconfig.json
echo.

echo [*] Starting dev server and Electron...
call npx concurrently "npx vite" "npx wait-on http://localhost:1234 && npx cross-env NODE_ENV=development npx electron ."

pause
```

**`start-dev-quick.bat`**（快速模式，跳过编译）

```bat
@echo off
title Project Manager - Dev Mode (Quick)
cd /d "%~dp0"
echo [*] Starting dev server and Electron (quick mode)...
call npx concurrently "npx vite" "npx wait-on http://localhost:1234 && npx cross-env NODE_ENV=development npx electron ."
pause
```

**`create-shortcut.ps1`**（创建桌面快捷方式）

```powershell
$WshShell = New-Object -ComObject WScript.Shell
$Desktop = [Environment]::GetFolderPath('Desktop')
$ProjectRoot = $PSScriptRoot

$Shortcut = $WshShell.CreateShortcut("$Desktop\项目管理助手 (Dev).lnk")
$Shortcut.TargetPath = "$ProjectRoot\start-dev.bat"
$Shortcut.WorkingDirectory = $ProjectRoot
$Shortcut.IconLocation = "shell32.dll,176"
$Shortcut.Description = "项目管理助手 - 开发模式（含编译）"
$Shortcut.Save()

$Shortcut2 = $WshShell.CreateShortcut("$Desktop\项目管理助手 (Quick).lnk")
$Shortcut2.TargetPath = "$ProjectRoot\start-dev-quick.bat"
$Shortcut2.WorkingDirectory = $ProjectRoot
$Shortcut2.IconLocation = "shell32.dll,176"
$Shortcut2.Description = "项目管理助手 - 快速启动（跳过编译）"
$Shortcut2.Save()

Write-Host "Desktop shortcuts created successfully!" -ForegroundColor Green
```

### 7.3 使用场景

| 场景 | 使用方式 |
|------|----------|
| 首次启动 / 依赖变更后 | 双击 `项目管理助手 (Dev).lnk` |
| 只改了前端代码 | 双击 `项目管理助手 (Quick).lnk` |
| 改了 Electron 主进程代码 | 双击 `项目管理助手 (Dev).lnk` |
| 只改了样式/CSS | 无需重启，Vite HMR 自动热更新 |

---

## 8. 执行顺序

建议按照以下顺序执行，每个 Task 独立可测试：

```
快速启动（可独立先行）
    ↓
T0 一键分类按钮（用户明确需求，优先）
    ↓
T3 StageNav Bug 修复（简单，影响基础数据一致性）
    ↓
T1 文件打开（后端+前端，用户高频操作）
    ↓
T2 SummaryCards（依赖文件列表数据）
    ↓
T4 错误处理（影响面最广，放中间）
    ↓
T5 空状态（依赖 T4 的组件）
    ↓
T6 聊天加载（独立功能）
```

---

## 9. 不做的事情（明确排除）

以下项不在本轮范围内，留给后续轮次：

| 项目 | 原因 | 目标轮次 |
|------|------|----------|
| 流式 AI 响应 | 需要重构 IPC 通信架构（从 handle 改为事件流），工作量大 | Round 3 |
| React Router 替换 useState | 架构变更，需要全面重构页面切换逻辑 | Round 3 |
| Zustand 状态管理 | 架构变更，当前 props drilling 尚可工作 | Round 3 |
| 暗色模式 | 需要额外设计规范和测试 | Round 3+ |
| framer-motion 动画 | 当前 CSS transition 已够用 | Round 3 |
| 单元测试/E2E 测试 | 功能稳定后再写测试 | Round 3 |
| electron-builder 打包 | 独立任务，不与其他优化耦合 | 随时可做 |
| PromptEditor 集成 | 已归档的组件，需要重新评估 | Round 3 |

---

## 10. 验收标准

1. "一键分类"按钮显示未分类文件数量，点击后批量分类所有未分类文件
2. 文件表格的"打开"按钮能用系统默认程序打开文件
3. SummaryCards 4 张卡片都显示真实数据或合理的降级显示（"—"而非"0"）
4. 自定义阶段添加后刷新不丢失
5. 所有 IPC 调用失败时用户能看到 Toast 提示
6. AI 聊天失败时有重试按钮
7. 各空状态场景有引导性设计
8. AI 聊天有明确的加载状态指示
9. 双击桌面快捷方式可启动开发模式
10. `npm run electron:dev` 和 `npm run build` 均无报错
