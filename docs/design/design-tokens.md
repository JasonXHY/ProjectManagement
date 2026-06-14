# 设计系统规范 v1.0

> 本文件定义了项目管理助手的完整设计规范。所有 UI 组件必须严格遵循本规范。

---

## 1. 色彩体系

### 1.1 品牌色

| 用途 | 变量名 | 色值 | 说明 |
|------|--------|------|------|
| 主色 | `--color-primary` | `#4F46E5` | Indigo-600，用于主按钮、选中状态、链接 |
| 主色悬浮 | `--color-primary-hover` | `#4338CA` | Indigo-700，按钮 hover |
| 主色按下 | `--color-primary-active` | `#3730A3` | Indigo-800，按钮 active |
| 主色浅底 | `--color-primary-light` | `#EEF2FF` | Indigo-50，选中行背景、标签底色 |
| 主色极浅 | `--color-primary-50` | `#F5F3FF` | 拖拽区域悬浮态背景 |
| 强调色 | `--color-accent` | `#F59E0B` | Amber-500，用于星标、高亮提示 |
| 强调色浅底 | `--color-accent-light` | `#FEF3C7` | Amber-100 |

### 1.2 语义色

| 用途 | 色值 | 浅底色 | 使用场景 |
|------|------|--------|---------|
| 成功 | `#10B981` | `#D1FAE5` | 操作成功提示、完成状态 |
| 警告 | `#F59E0B` | `#FEF3C7` | 待处理事项、需注意 |
| 错误 | `#EF4444` | `#FEE2E2` | 删除、错误提示、关键问题 |
| 信息 | `#3B82F6` | `#DBEAFE` | 提示信息、帮助文字 |

### 1.3 中性色

| 用途 | 变量名 | 色值 |
|------|--------|------|
| 应用背景 | `--bg-app` | `#F8F7F4` |
| 卡片/面板背景 | `--bg-surface` | `#FFFFFF` |
| 次级背景 | `--bg-secondary` | `#F3F4F6` |
| 悬停背景 | `--bg-hover` | `#F9FAFB` |
| 边框 | `--border-default` | `#E5E7EB` |
| 边框（浅） | `--border-light` | `#F3F4F6` |
| 主文字 | `--text-primary` | `#111827` |
| 次文字 | `--text-secondary` | `#6B7280` |
| 占位文字 | `--text-placeholder` | `#9CA3AF` |
| 禁用文字 | `--text-disabled` | `#D1D5DB` |

### 1.4 阶段标签配色（11个阶段）

每个阶段有固定的前景色和背景色：

| 阶段 | 前景色 | 背景色 |
|------|--------|--------|
| 售前 | `#92400E` | `#FEF3C7` |
| 启动 | `#065F46` | `#D1FAE5` |
| 需求 | `#1E40AF` | `#DBEAFE` |
| 方案 | `#92400E` | `#FEF3C7` |
| 构建 | `#5B21B6` | `#EDE9FE` |
| 测试 | `#9D174D` | `#FCE7F3` |
| 上线 | `#065F46` | `#D1FAE5` |
| 验收 | `#9D174D` | `#FCE7F3` |
| 转客户成功 | `#374151` | `#F3F4F6` |
| 关闭 | `#374151` | `#F3F4F6` |
| 未分类 | `#6B7280` | `#F9FAFB` |

---

## 2. 字体系统

### 2.1 字体族

```css
--font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", 
               "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", 
               Helvetica, Arial, sans-serif;
--font-mono: "SF Mono", "Fira Code", "Fira Mono", "Roboto Mono", 
             "Courier New", monospace;
```

### 2.2 字体层级

| 层级 | 大小 | 行高 | 字重 | 用途 |
|------|------|------|------|------|
| 页面标题 | 22px | 28px | 600 (semibold) | 页面主标题 |
| 区块标题 | 16px | 24px | 600 (semibold) | 卡片标题、区块标题 |
| 正文（常规） | 14px | 22px | 400 (regular) | 主要内容文字 |
| 正文（中等） | 14px | 22px | 500 (medium) | 文件名、阶段名 |
| 辅助文字 | 12px | 18px | 400 (regular) | 时间戳、文件数量、说明文字 |
| 极小文字 | 11px | 16px | 400 (regular) | badge 数字、标签 |

### 2.3 中文排版注意

- `letter-spacing` 保持默认（0），不要对中文加 letter-spacing
- 中英文混排时，英文和数字使用 `font-feature-settings: "tnum"` 等宽数字
- 段落间距用 margin-bottom: 16px

---

## 3. 间距系统

基于 4px 基准，使用倍数递增：

| Token | 值 | 用途 |
|-------|---|------|
| `--space-1` | 4px | 图标与文字间距、紧凑元素内间距 |
| `--space-2` | 8px | 列表项内部 padding、小组件间距 |
| `--space-3` | 12px | 卡片内 padding（紧凑）、表单元素间距 |
| `--space-4` | 16px | 卡片内 padding、区块内间距 |
| `--space-5` | 20px | 卡片之间间距 |
| `--space-6` | 24px | 页面边距、区块之间间距 |
| `--space-8` | 32px | 大区块分隔 |
| `--space-10` | 40px | 页面顶部/底部留白 |

---

## 4. 圆角

| Token | 值 | 用途 |
|-------|---|------|
| `--radius-sm` | 6px | 标签 Tag、小按钮、输入框 |
| `--radius-md` | 8px | 按钮、下拉菜单、模态框 |
| `--radius-lg` | 12px | 卡片、面板 |
| `--radius-xl` | 16px | 消息气泡（对话页） |
| `--radius-full` | 9999px | 圆形头像、圆形 badge、药丸标签 |

---

## 5. 阴影系统

所有阴影使用暖色调（rgba 中使用 0,0,0 但降低不透明度），追求轻柔效果：

| Token | CSS 值 | 用途 |
|-------|--------|------|
| `--shadow-xs` | `0 1px 2px rgba(0,0,0,0.04)` | 输入框、标签 |
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.03)` | 卡片默认 |
| `--shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.06), 0 2px 4px -2px rgba(0,0,0,0.04)` | 卡片 hover、弹出面板 |
| `--shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.06), 0 4px 6px -4px rgba(0,0,0,0.04)` | 模态框、下拉菜单 |
| `--shadow-xl` | `0 20px 25px -5px rgba(0,0,0,0.06), 0 8px 10px -6px rgba(0,0,0,0.04)` | 对话框 |

---

## 6. 动效与过渡

| 属性 | 值 | 用途 |
|------|---|------|
| 快速过渡 | `150ms cubic-bezier(0.4, 0, 0.2, 1)` | 按钮 hover、标签状态变化 |
| 标准过渡 | `200ms cubic-bezier(0.4, 0, 0.2, 1)` | 面板展开、下拉菜单 |
| 慢速过渡 | `300ms cubic-bezier(0.4, 0, 0.2, 1)` | 页面切换、侧边栏收起 |

**关键规则**：
- 所有可交互元素必须有 hover 和 active 状态过渡
- 面板展开/收起使用 `width` 或 `max-height` 过渡
- 新增列表项使用 `opacity + translateY` 入场动画
- 删除列表项使用 `opacity + scale` 退出动画

---

## 7. 组件规范

### 7.1 按钮

**主按钮**：
- 背景色: `--color-primary`，文字白色
- 高度: 36px，padding: 0 16px
- 圆角: `--radius-md` (8px)
- hover: 背景变为 `--color-primary-hover`
- active: 背景变为 `--color-primary-active`
- 禁用: opacity 0.5，cursor not-allowed

**次按钮**：
- 背景色: `--bg-surface`，边框 1px `--border-default`
- 文字色: `--text-primary`
- hover: 背景变为 `--bg-hover`，边框颜色加深

**文字按钮**：
- 无边框无背景，文字色 `--text-secondary`
- hover: 文字变为 `--text-primary`，背景变为 `--bg-hover`

**危险按钮**：
- 背景色: 白色，边框 1px `#FCA5A5`（红色-300）
- 文字色: `#EF4444`（红色-500）
- hover: 背景变为 `#FEF2F2`（红色-50）

### 7.2 卡片

- 背景: `--bg-surface`
- 边框: 1px `--border-default`
- 圆角: `--radius-lg` (12px)
- 阴影: `--shadow-sm`
- padding: `--space-4` (16px) 或 `--space-6` (24px)
- hover（可交互时）: 阴影变为 `--shadow-md`，`transform: translateY(-1px)`

### 7.3 输入框

- 高度: 36px（单行），padding: 8px 12px
- 边框: 1px `--border-default`
- 圆角: `--radius-sm` (6px)
- 聚焦: 边框变为 `--color-primary`，外加 `0 0 0 3px rgba(79,70,229,0.1)` 光晕
- placeholder: `--text-placeholder`

### 7.4 标签 Tag

- padding: 2px 10px
- 圆角: `--radius-full`（药丸形）
- 字号: 12px
- 无边框，使用阶段配色的前景色和背景色

### 7.5 表格

- 表头: 背景 `--bg-secondary`，文字 `--text-secondary`，字重 500
- 行高: 52px
- 行 padding: 12px 16px
- 行分隔线: 1px `--border-light`
- hover 行: 背景 `--bg-hover`
- 不使用 zebra striping（斑马纹）

### 7.6 侧边栏导航项

- 高度: 40px，padding: 0 12px
- 圆角: `--radius-md` (8px)
- 默认: 背景透明，文字 `--text-secondary`
- hover: 背景 `--bg-hover`，文字 `--text-primary`
- 选中: 背景 `--color-primary-light`，文字 `--color-primary`
- 选中时左侧有 3px 宽的 `--color-primary` 指示条
- 右侧 badge: 背景 `--bg-secondary`（默认），选中时背景为 `rgba(79,70,229,0.15)`

### 7.7 消息气泡

- 最大宽度: 70%
- padding: 12px 16px
- 用户消息: 右对齐，背景 `--color-primary`，文字白色，圆角 `--radius-xl` 但右下角 `4px`
- AI消息: 左对齐，背景 `--bg-secondary`，文字 `--text-primary`，圆角 `--radius-xl` 但左下角 `4px`
- 头像: 32px 圆形，用户蓝色底，AI 绿色底

### 7.8 模态框

- 宽度: 480px（标准）、640px（宽）、800px（摘要查看）
- 圆角: `--radius-lg` (12px)
- 阴影: `--shadow-xl`
- 标题区: padding 20px 24px，底部 1px `--border-default` 分隔
- 内容区: padding 24px
- 底部按钮区: padding 16px 24px，按钮右对齐

### 7.9 空状态

- 居中显示
- 图标/插图: 48px-64px，颜色 `--text-disabled`
- 主文案: 16px `--text-secondary`，"还没有 xxx"
- 副文案: 14px `--text-placeholder`，引导操作
- CTA 按钮（如有）: 主按钮样式

---

## 8. 布局系统

### 8.1 全局布局

```
┌──────────────────────────────────────────┐
│  Header (56px 高)                         │
├──────────────────────────────────────────┤
│                                          │
│  Content Area (全宽，flex: 1)             │
│                                          │
└──────────────────────────────────────────┘
```

- **Header**: 高度 56px，背景 `--bg-surface`，底部 1px `--border-default` 分隔线
- **Content**: 占满剩余高度，背景 `--bg-app`，内部 padding `--space-6` (24px)
- **不使用** `max-width` 限制，让内容自然撑满

### 8.2 项目列表页布局

```
┌──────────────────────────────────────────┐
│  [Logo] 项目管理助手       [搜索] [新建]  │  Header
├──────────────────────────────────────────┤
│                                          │
│  工具栏: [视图切换] [筛选] [排序]         │  padding 24px
│                                          │
│  ┌────────┐ ┌────────┐ ┌────────┐       │
│  │ 项目卡 │ │ 项目卡 │ │ 项目卡 │       │  卡片网格
│  │  片    │ │  片    │ │  片    │       │  gap: 20px
│  └────────┘ └────────┘ └────────┘       │
│  ┌────────┐ ┌────────┐                  │
│  │ 项目卡 │ │ 项目卡 │                  │
│  └────────┘ └────────┘                  │
│                                          │
└──────────────────────────────────────────┘
```

卡片网格: `display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px;`

### 8.3 项目详情页布局

```
┌──────────────────────────────────────────┐
│  [← ] 项目名称            [对话] [设置]  │  Header
├─────────┬────────────────────────────────┤
│         │                                │
│  侧边栏  │  [摘要卡片区域]                │
│  200px  │  ┌────┐┌────┐┌────┐┌────┐     │
│         │  │    ││    ││    ││    │     │
│  阶段列表│  └────┘└────┘└────┘└────┘     │
│         │                                │
│         │  [拖拽上传区域]                 │
│         │  ┌──────────────────────────┐  │
│         │  │                          │  │  min-height: 160px
│         │  └──────────────────────────┘  │
│         │                                │
│         │  [文件列表表格]                 │
│         │                                │
└─────────┴────────────────────────────────┘
```

- 侧边栏: 固定宽度 200px，背景 `--bg-surface`，右侧 1px `--border-default` 分隔
- 侧边栏可折叠（点击折叠按钮后宽度变为 56px，只显示图标）
- 内容区: flex: 1，padding 24px
- 摘要卡片行: 4个卡片，等宽排列，gap 16px
- 拖拽区: 100% 宽，min-height 160px（只在"所有文件"视图显示）
- 文件表格: 100% 宽

### 8.4 对话页布局（已实现 v10.3）

```
┌──────────────────────────────────────────┬──────────┐
│  [← ] 项目名称 - 对话                    │          │
├───────────────────────────────┬──────────┤          │
│  会话历史        │            │          │          │
│  (可折叠)        │  对话区域   │ 上下文    │          │
│                  │ (flex: 1)  │ 文件面板  │          │
│  [会话1]         │            │  240px   │          │
│  [会话2]         │ [AI 消息]  │          │          │
│                  │            │ ☑ 文件1  │          │
│                  │ [用户消息]  │ ☑ 文件2  │          │
│                  │            │ ☐ 文件3  │          │
│                  ├────────────┤          │          │
│                  │[📎][输入][发送][清空]│          │
└──────────────────┴────────────┴──────────┴──────────┘
```

**布局结构**：
- 左侧会话历史: 48px（折叠）↔ 280px（展开），点击按钮切换
- 对话区域: flex: 1，垂直排列（消息列表 + 输入区）
- 右侧上下文面板: 240px，点击📎按钮切换显示/隐藏
- 输入区: 固定在底部，高度自适应（min 44px, max 120px）

**交互设计**：
- 文件面板: 选择文件作为AI对话上下文，选中文件ID传入 `aiService.chat()`
- 取消按钮: AI生成过程中显示，点击调用 `AbortController.abort()`
- 重试按钮: AI响应失败时显示在最后一条用户消息下方

**设计决策**：
- 文件面板默认收起，避免占用对话空间
- 选择文件后在输入区下方显示"已选择N个文件作为上下文"
- 会话切换时清空文件选择，避免上下文混淆

### 8.5 设置页布局

```
┌──────────────────────────────────────────┐
│  [← ] 设置                               │  Header
├──────────────────────────────────────────┤
│                                          │
│  [AI模型] [文件提取] [Prompt配置]         │  Tab 导航（分段控制器样式）
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  AI模型配置                        │  │  卡片
│  │  ──────────────                    │  │
│  │  配置说明文字...                    │  │
│  │                                    │  │
│  │  [供应商选择]  [模型选择]           │  │
│  │  [API Key    ]                     │  │
│  │  [API地址    ]                     │  │
│  └────────────────────────────────────┘  │
│                                          │
│                        [重置] [保存配置]  │
└──────────────────────────────────────────┘
```

- 内容区: max-width 720px，居中
- Tab: 使用分段控制器（Segmented）样式而非传统 Tab
- 每个配置区块用卡片包裹
- 底部操作按钮: 右对齐

---

## 9. 响应式规则

桌面应用窗口可能在 800px - 1920px 之间变化：

| 断点 | 规则 |
|------|------|
| < 900px | 项目卡片网格变为 2 列，侧边栏折叠为图标模式 |
| 900px - 1200px | 项目卡片 2-3 列自适应 |
| > 1200px | 项目卡片 3-4 列自适应 |
| 对话页 | 上下文面板始终可折叠，对话区域始终占满 |
| 设置页 | 表单始终单列，max-width 720px |

---

## 10. 图标规范

- 统一使用 `@ant-design/icons` 图标库
- 默认大小: 16px（内联）、20px（按钮内）、24px（标题旁）
- 默认颜色: 跟随文字颜色（`currentColor`）
- 特殊图标颜色使用语义色（如成功用绿色、错误用红色）
- **不再使用 emoji** 作为图标（StageNav 中的 emoji 全部替换为 antd icons）

### 图标映射表

| 场景 | 图标 |
|------|------|
| 项目 | `ProjectOutlined` |
| 文件 | `FileTextOutlined` |
| 文件夹 | `FolderOutlined` |
| 上传 | `UploadOutlined` 或 `InboxOutlined` |
| 删除 | `DeleteOutlined` |
| 编辑 | `EditOutlined` |
| 搜索 | `SearchOutlined` |
| 设置 | `SettingOutlined` |
| AI/机器人 | `RobotOutlined` |
| 对话 | `MessageOutlined` |
| 返回 | `ArrowLeftOutlined` |
| 新建/添加 | `PlusOutlined` |
| 打开文件夹 | `FolderOpenOutlined` |
| 预览 | `EyeOutlined` |
| 刷新 | `ReloadOutlined` |
| 清空 | `ClearOutlined` |
| 发送 | `SendOutlined` |
| 附件 | `PaperClipOutlined` |
| 用户 | `UserOutlined` |
| 阶段-售前 | `FundOutlined` |
| 阶段-启动 | `RocketOutlined` |
| 阶段-需求 | `FileSearchOutlined` |
| 阶段-方案 | `SolutionOutlined` |
| 阶段-构建 | `ToolOutlined` |
| 阶段-测试 | `ExperimentOutlined` |
| 阶段-上线 | `CloudUploadOutlined` |
| 阶段-验收 | `CheckCircleOutlined` |
| 阶段-转客户成功 | `HandshakeOutlined`(无则用 `TeamOutlined`) |
| 阶段-关闭 | `FolderOutlined` |
| 所有文件 | `AppstoreOutlined` |
| 未分类 | `QuestionCircleOutlined` |

---

## 11. 阶段图标与配色速查

（结合 §1.4 阶段配色和 §10 图标）

| 阶段 | 图标 | 前景色 | 背景色 |
|------|------|--------|--------|
| 所有文件 | `AppstoreOutlined` | `#4F46E5` | `#EEF2FF` |
| 售前 | `FundOutlined` | `#92400E` | `#FEF3C7` |
| 启动 | `RocketOutlined` | `#065F46` | `#D1FAE5` |
| 需求 | `FileSearchOutlined` | `#1E40AF` | `#DBEAFE` |
| 方案 | `SolutionOutlined` | `#92400E` | `#FEF3C7` |
| 构建 | `ToolOutlined` | `#5B21B6` | `#EDE9FE` |
| 测试 | `ExperimentOutlined` | `#9D174D` | `#FCE7F3` |
| 上线 | `CloudUploadOutlined` | `#065F46` | `#D1FAE5` |
| 验收 | `CheckCircleOutlined` | `#9D174D` | `#FCE7F3` |
| 转客户成功 | `TeamOutlined` | `#374151` | `#F3F4F6` |
| 关闭 | `FolderOutlined` | `#374151` | `#F3F4F6` |
| 未分类 | `QuestionCircleOutlined` | `#6B7280` | `#F9FAFB` |

---

## 12. Tailwind CSS 集成方案

在 `tailwind.config.js`（或 `tailwind.config.ts`）中扩展主题，将设计 Token 映射到 Tailwind 类名：

```js
theme: {
  extend: {
    colors: {
      primary: {
        50: '#EEF2FF',
        100: '#E0E7FF',
        500: '#6366F1',
        600: '#4F46E5',
        700: '#4338CA',
        800: '#3730A3',
      },
      accent: {
        100: '#FEF3C7',
        500: '#F59E0B',
      },
      surface: '#FFFFFF',
      'bg-app': '#F8F7F4',
    },
    borderRadius: {
      'xs': '4px',
      'sm': '6px',
      'md': '8px',
      'lg': '12px',
      'xl': '16px',
    },
    boxShadow: {
      'xs': '0 1px 2px rgba(0,0,0,0.04)',
      'sm': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.03)',
      'md': '0 4px 6px -1px rgba(0,0,0,0.06), 0 2px 4px -2px rgba(0,0,0,0.04)',
      'lg': '0 10px 15px -3px rgba(0,0,0,0.06), 0 4px 6px -4px rgba(0,0,0,0.04)',
    },
    fontFamily: {
      sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'PingFang SC', 
             'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', 'sans-serif'],
    },
  },
},
```

## 13. Ant Design ConfigProvider 主题定制

通过 ConfigProvider 全局覆盖 Ant Design 的主题 Token：

```tsx
<ConfigProvider theme={{
  token: {
    colorPrimary: '#4F46E5',
    colorBgContainer: '#FFFFFF',
    colorBgLayout: '#F8F7F4',
    colorText: '#111827',
    colorTextSecondary: '#6B7280',
    colorBorder: '#E5E7EB',
    colorBorderSecondary: '#F3F4F6',
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
    fontSize: 14,
    controlHeight: 36,
  },
  components: {
    Button: {
      primaryShadow: 'none',
      defaultShadow: 'none',
      dangerShadow: 'none',
    },
    Table: {
      headerBg: '#F3F4F6',
      headerColor: '#6B7280',
      rowHoverBg: '#F9FAFB',
      borderColor: '#F3F4F6',
    },
    Card: {
      paddingLG: 16,
    },
    Modal: {
      titleFontSize: 16,
      headerBg: 'transparent',
    },
  },
}}>
  <App />
</ConfigProvider>
```
