# 第一轮 UI 优化实施计划

> 版本: v1.0 | 日期: 2026-06-10

---

## 本轮范围

对全部 4 个页面（项目列表、项目详情、AI对话、设置）进行 UI 重构，建立统一设计系统。不涉及后端逻辑变更，纯前端视觉和交互改进。

## 前置工作（必须先完成）

### Task 0.1: 归档遗留代码

将以下文件移动到 `.archive/` 目录（保留但不删除）：

```
src/components/FileManager/     → .archive/components/FileManager/
src/components/ProjectList/ProjectTable.tsx  → .archive/components/ProjectTable.tsx
src/components/Chat/UploadZone.tsx  → .archive/components/UploadZone.tsx
src/components/Settings/PromptEditor.tsx  → .archive/components/PromptEditor.tsx
src/mocks/  → .archive/mocks/
```

### Task 0.2: 安全修复

- 从 `src-tauri/src/config.rs` 第 21 行移除硬编码的 API Key `sk-clwzd502pqodv97h6i2aoll0jhaaik6a6fuodsqgajk8pc11p`
- 替换为 `std::env::var("ZHIPU_API_KEY").unwrap_or_default()`

### Task 0.3: 类型修复

- 在 `src/types/windowApi.ts`（或等效文件）中补充缺失的类型声明：
  ```typescript
  file: {
    // ... existing methods
    getSummary: (projectId: number) => Promise<{ success: boolean; data?: string; error?: string }>;
    openFolder: (projectId: number) => Promise<{ success: boolean; error?: string }>;
  }
  ```

- 修复 `src/types/index.ts` 中 `DEFAULT_ANALYZE_PROMPT` 模板字符串的条件判断 Bug（第157-158行，`${'{existingSummary}' ? ... : ''}` 始终为真）

### Task 0.4: 归档 Tauri 后端

- 将 `src-tauri/` 重命名为 `src-tauri-archived/`
- 更新 README 或相关文档说明此目录已归档

---

## Task 1: 建立设计系统

### 1.1 Tailwind 配置扩展

修改 `tailwind.config.ts`（或等效文件），按照 `.qoderwork/design-system/v1-design-tokens.md` 的规范扩展主题。具体配置参见设计文档 §12。

### 1.2 Ant Design ConfigProvider

在 `src/App.tsx` 中用 `ConfigProvider` 包裹整个应用，按照 `.qoderwork/design-system/v1-design-tokens.md` §13 的配置覆盖 Ant Design 默认主题。

### 1.3 全局样式

在 `src/index.css`（或全局样式文件）中设置：
- `body` 背景色为 `#F8F7F4`（`--bg-app`）
- 字体族按设计文档 §2.1 设置
- 移除 Ant Design 默认的蓝色主题影响

---

## Task 2: App.tsx 布局重构

**参考原型**: 所有 mockup 文件的 header 部分

### 当前问题
- `max-w-6xl mx-auto` 限制了内容宽度，浪费屏幕空间
- 外层 `p-6` padding 过大
- Header 和 Content 的视觉分隔不够清晰

### 改动要点
- **移除** `max-w-6xl mx-auto` 限制和额外的 content wrapper padding
- **Header**: 高度 56px，白色背景，底部 1px `#E5E7EB` 分隔线。内部使用 `padding: 0 24px`
- **Content**: 背景 `#F8F7F4`，`padding: 0`（各页面自行控制内部 padding）
- **面包屑**: 简化为 `首页图标 > 项目名 > 页面名` 格式，放在 header 右侧
- **设置按钮**: 改为图标按钮（不带文字），放在 header 右侧

---

## Task 3: 项目列表页重构

**参考原型**: `.qoderwork/mockups/01-project-list.html`

### 当前组件: `src/components/ProjectList/ProjectList.tsx`

### 改动要点

1. **新增卡片视图**:
   - 默认显示卡片视图，可切换到表格视图
   - 卡片使用 `display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px`
   - 每张卡片包含: 顶部彩色条（4px，颜色跟随项目状态）、项目名称、状态标签、文件数量、分类方式标签、当前阶段、更新时间、hover 时显示编辑/删除按钮
   - 卡片样式: 白色背景、`border-radius: 12px`、`border: 1px solid #E5E7EB`、hover 时 `box-shadow` 增强 + `translateY(-2px)`

2. **视图切换**:
   - 在工具栏右侧增加卡片/表格切换按钮组（参考原型中的 `.view-toggle`）
   - 使用状态管理当前视图模式

3. **工具栏调整**:
   - 左侧: 搜索框（`width: 240px`）、状态筛选下拉、排序下拉
   - 右侧: 视图切换按钮组 + 新建项目按钮
   - 所有控件使用设计系统的间距（`gap: 12px`）

4. **新建项目弹窗优化**:
   - 分类方式选择改为卡片式单选（参考原型中的 `.category-options`）
   - 每个选项包含标题和描述文字
   - 选中态: 边框变为主色，背景变为 `#EEF2FF`

5. **空状态**:
   - 项目列表为空时显示居中的空状态（参考原型中的 `.empty-state`）
   - 圆形图标背景 + "还没有项目" 文案 + "创建你的第一个项目" 描述 + CTA 按钮

6. **色彩规范**:
   - 项目状态标签颜色按设计文档 §1.4 阶段标签配色
   - 卡片顶部彩色条: 进行中=`linear-gradient(90deg, #4F46E5, #6366F1)`、售前=`linear-gradient(90deg, #F59E0B, #FBBF24)`、关闭=`#D1D5DB`

---

## Task 4: 项目详情页重构

**参考原型**: `.qoderwork/mockups/02-project-home.html`

### 4.1 StageNav 重构
**组件**: `src/components/ProjectHome/StageNav.tsx`

改动:
- **移除 emoji 图标**，改用 `@ant-design/icons`（映射关系见设计文档 §11）
- **选中状态**: 背景 `#EEF2FF`、文字 `#4F46E5`、左侧 3px 宽主色指示条
- **hover 状态**: 背景 `#F9FAFB`
- **badge**: 圆形/药丸形，选中时底色 `rgba(79,70,229,0.12)`
- **侧边栏标题**: "项目阶段"（小字大写风格），右侧加号按钮
- **底部按钮**: "上传文件"（次按钮）+ "打开文件夹"（文字按钮），给"上传文件"按钮绑定文件选择器 click handler
- **整体**: 白色背景、右侧 1px 分隔线、padding `8px`

### 4.2 SummaryCards 重构
**组件**: `src/components/ProjectHome/SummaryCards.tsx`

改动:
- **卡片样式**: 白色背景、`border-radius: 12px`、`border: 1px solid #E5E7EB`
- **每个卡片**: 左侧彩色图标（32px 圆角方形背景）+ 标签 + 数值（24px 粗体）
- **第4张卡片（AI摘要）**: 包含"查看摘要"和"生成/更新"两个按钮
- **布局**: 4列等宽网格，`gap: 16px`
- **图标颜色**: 文件数量=蓝色底(#DBEAFE)、关键问题=红色底(#FEE2E2)、待处理=黄色底(#FEF3C7)、AI摘要=紫色底(#EDE9FE)

### 4.3 拖拽上传区重构
**组件**: `src/components/ProjectHome/ProjectHome.tsx` 内联

改动:
- **默认态**: `border: 2px dashed #E5E7EB`、白色背景、`border-radius: 12px`
- **hover 态**: 边框变为主色 `#4F46E5`、背景变为 `#FAFAFF`
- **拖拽态（dragover）**: 边框变为主色实线、背景变为 `#EEF2FF`
- **内容**: 上传图标（48px，默认灰色，hover 时主色 + 上移 2px）+ "拖拽文件到此处，或点击上传" + "AI 将自动识别文件内容并分类到对应阶段" + 文件格式标签行（PDF/Word/Excel/PPT/TXT/MD）
- **min-height**: 160px

### 4.4 文件列表表格重构

改动:
- **表格容器**: 白色背景、`border-radius: 12px`、`border: 1px solid #E5E7EB`
- **表头**: 背景 `#F3F4F6`、文字 `#6B7280` 12px 500 字重
- **文件名列**: 左侧文件类型图标（32px 方形圆角，按文件类型配色：PDF 红、DOC 蓝、XLS 绿、PPT 黄、TXT 灰、MD 紫）+ 文件名（500字重）+ 文件类型描述（12px 灰色）
- **分类列**: 药丸标签，按设计文档 §1.4 配色
- **操作列**: 默认隐藏，行 hover 时显示 4 个图标按钮（AI分类、预览、编辑、删除），删除按钮 hover 时红色背景
- **移除** zebra striping

### 4.5 整体布局

- **侧边栏**: 固定 200px 宽度（可折叠为 56px 图标模式）
- **内容区**: `padding: 24px`，flex: 1
- **Header**: 返回箭头 + 项目名 + 面包屑信息（"构建阶段 · 23 个文件"），右侧"对话"主按钮 + "设置"次按钮

---

## Task 5: AI 对话页重构

**参考原型**: `.qoderwork/mockups/03-chat-window.html`

### 组件: `src/components/Chat/ChatWindow.tsx`

### 改动要点

1. **布局翻转**: 上下文文件面板从**左侧**移到**右侧**
   - 对话区: `flex: 1`，左侧
   - 上下文面板: 右侧，宽度 240px，可折叠

2. **消息气泡重新设计**:
   - 用户消息: 右对齐，背景 `#4F46E5`，白色文字，`border-radius: 16px` 但右下角 `4px`
   - AI 消息: 左对齐，背景 `#F3F4F6`，主文字色，`border-radius: 16px` 但左下角 `4px`
   - 最大宽度 70%
   - 头像: 32px 圆形，用户=主色底白色用户图标，AI=绿色底白色机器人图标
   - 时间戳: 气泡下方，11px 灰色

3. **空状态**:
   - 居中显示: 64px 圆形灰色背景+机器人图标 → "开始对话" → "选择右侧文件作为上下文，向 AI 助手提问"
   - 下方增加 2-3 个建议问题标签（chip），点击后填入输入框

4. **输入区域**:
   - 固定在底部，白色背景，上方 1px 分隔线
   - 上方: 上下文提示（"已附加 N 个文件作为对话上下文"）
   - 输入框: `border-radius: 12px`、min-height 44px、max-height 120px
   - 发送按钮: 44px 方形、主色背景、圆角 12px
   - 底部: "Enter 发送 · Shift+Enter 换行" 提示（11px 灰色）

5. **上下文面板（右侧）**:
   - 头部: "上下文文件" + 已选数量 badge + 全选 checkbox
   - 文件列表: 每行包含 checkbox + 文件类型图标（24px 方形）+ 文件名 + 分类/大小
   - 选中项背景 `#EEF2FF`
   - 底部: "选中文件的内容将作为 AI 对话的参考上下文"

6. **头部**:
   - 左侧: 返回箭头 + 项目名（大号） + "AI 对话"（小号灰色）
   - 右侧: "清空历史"（红色文字按钮）+ "文件面板"（切换按钮）

---

## Task 6: 设置页重构

### 组件: `src/components/Settings/SettingsPage.tsx`

### 改动要点

1. **Tab 导航**: 将 Ant Design Tabs 改为 Segmented 控件样式（分段按钮），水平排列在内容区顶部
2. **内容区**: `max-width: 720px`、居中、`padding: 24px`
3. **每个配置区块**: 用卡片包裹（白色背景、`border-radius: 12px`、`border: 1px solid #E5E7EB`、`padding: 24px`）
4. **卡片内**: 标题（16px 600 字重）+ 描述文字（14px 灰色）+ 表单字段
5. **底部按钮**: 右对齐，"重置"（次按钮）+ "保存配置"（主按钮）
6. **AI配置 Tab**: 供应商选择可用卡片式选择器或标准下拉框，API Key 用 `Input.Password`
7. **Prompt配置 Tab**: 将现有 TextArea 替换为集成 PromptEditor 组件（支持变量标签插入）

---

## 验收标准

1. 所有 4 个页面的视觉效果与 HTML 原型一致（打开原型文件对比）
2. 色彩、间距、圆角、阴影严格遵循设计文档 v1-design-tokens.md
3. 所有可交互元素有 hover 和 active 状态
4. 页面切换流畅（无闪烁）
5. 窗口在 800px - 1920px 范围内自适应
6. 空状态正确显示
7. 不破坏任何现有功能（项目CRUD、文件上传、AI对话、设置保存）

---

## 需要 Claude Code 审核的重点

1. Ant Design ConfigProvider 的主题覆盖是否能完全去除默认蓝色主题
2. Tailwind CSS 4 与 Ant Design 6 的样式优先级是否有冲突
3. 侧边栏折叠动画的实现方式建议
4. 卡片视图与表格视图切换是否需要引入新依赖
5. PromptEditor 集成到 SettingsPage 的技术可行性
