# 第一轮 UI 优化 — 方案修订 v2

> 基于 Claude Code 审核报告的反馈，本文件对原方案进行风险规避调整。
> 原方案 `.qoderwork/plans/round1-ui-optimization.md` 中未被本文件修改的部分继续有效。

---

## 一、核心策略调整：样式分层方案

### 问题

Claude Code 审核指出 Tailwind CSS 4 的 preflight 会与 Ant Design 6 的基础样式冲突，部分 AntD 组件（Input 聚焦光晕、Tag 药丸形、Segmented 控件）的样式覆盖有难度。

### 解决方案：三层样式架构

明确划分每层的职责边界，避免 Tailwind 和 AntD 在同一个元素上"打架"：

**第一层：Ant Design ConfigProvider（主题层）**
- 负责所有 AntD 组件的颜色、圆角、字号、间距等主题 Token
- 这是主战场，尽可能通过 Token 覆盖而非 CSS 覆盖
- ConfigProvider 配置见设计文档 §13，不变

**第二层：Tailwind CSS（布局层）**
- 仅用于布局相关：flex、grid、padding、margin、width、height、display
- **禁用 Tailwind preflight**：在 `tailwind.config.ts` 中设置 `corePlugins: { preflight: false }`
- **不用于**覆盖 AntD 组件的视觉样式（颜色、边框、阴影等）

**第三层：CSS 覆盖文件（细节层）**
- 新建 `src/styles/overrides.css`，专门处理 ConfigProvider 无法覆盖的样式
- 每个覆盖必须写明注释说明为什么需要覆盖
- 使用 `.ant-xxx` 选择器 + 适当优先级，避免滥用 `!important`

### 具体冲突解决方案

| 问题组件 | 原方案 | 调整后方案 |
|---------|--------|-----------|
| Input 聚焦光晕 | ConfigProvider | ConfigProvider 设置 `controlOutline` Token 为主色透明值，若仍不行在 overrides.css 中覆盖 `.ant-input:focus` |
| Tag 药丸形无边框 | 自定义 CSS | 直接使用自定义 `<span>` + Tailwind 类名，不依赖 AntD Tag 组件 |
| Segmented 控件 | AntD Segmented | 使用 AntD Segmented + ConfigProvider 主题覆盖，若样式差异大则改用 `Radio.Group` 的 `buttonStyle="solid"` 模式 |
| 消息气泡 | 自定义 div | 纯自定义 div + CSS，不引入 AntD X 的对话组件，完全自控 |
| Empty 空状态 | AntD Empty | 纯自定义 div，不用 AntD Empty 组件，按 mockup 自己写 |

---

## 二、组件实现简化方案

以下针对 Claude Code 指出的实现难点，给出具体的简化替代方案。**视觉效果保持与 mockup 一致，但实现路径更简单。**

### 2.1 项目列表页 — 卡片视图

**原方案**：自定义卡片网格组件 + 视图切换
**调整**：
- 卡片视图和表格视图通过一个 state 变量切换，条件渲染不同组件
- 卡片组件用纯 div + Tailwind 布局类实现，不封装通用组件库
- 视图切换按钮用 AntD `Radio.Group` + `buttonStyle="solid"` + `size="small"` 实现，比自定义 toggle 更稳定

### 2.2 新建项目弹窗 — 分类方式选择

**原方案**：自定义卡片式单选组件（`.category-options`）
**调整**：
- 使用 AntD `Radio.Group`，每个选项用自定义渲染（包含标题 + 描述的 div）
- 视觉效果通过给 Radio 选项添加 padding 和 border 实现选中态
- 比从零写自定义 radio 组件更稳定，且自动处理受控状态

### 2.3 StageNav 侧边栏

**原方案**：完全自定义的导航列表
**调整**：
- 使用 AntD `Menu` 组件，`mode="inline"` 模式
- 通过 ConfigProvider 的 `Menu` 组件 Token 定制：`itemSelectedBg`、`itemSelectedColor`、`itemHoverBg` 等
- 选中指示条效果：如果 Menu 的 `itemSelectedBg` 不够，在 overrides.css 中用 `::before` 伪元素添加左侧 3px 指示条
- 文件数量 badge 用 `Menu` 的自定义 item render 实现
- 折叠功能：利用 Menu 的 `inlineCollapsed` 属性（在 Sider 内使用时自动支持）

### 2.4 文件上传拖拽区

**原方案**：自定义拖拽区域
**调整**：
- 使用 AntD `Upload.Dragger` 组件作为基础
- 通过 ConfigProvider 和 CSS 覆盖自定义其内部样式（图标大小、文字内容、边框样式）
- 文件格式标签行作为 Dragger 的 children 自定义渲染
- 拖拽态样式变化通过覆盖 `.ant-upload-drag-hover` 类实现

### 2.5 AI 对话页

**原方案**：自定义消息气泡 + 右侧上下文面板
**调整**：
- **消息气泡**：纯自定义 div 实现（不用任何 AntD 组件），用 CSS 控制气泡形状和颜色。这是最灵活的方案，mockup 已经给了完整的样式定义
- **上下文面板**：使用 AntD `Drawer` 组件从右侧弹出（`placement="right"`），而不是常驻侧边栏。好处是：
  - 不需要处理面板折叠/展开的布局动画
  - 移动端/小窗口下自动表现良好
  - 关闭时对话区自动占满宽度
  - 面板内文件列表用 AntD `List` + `Checkbox` 实现
- **输入区**：`Input.TextArea` + 自定义发送按钮，用 flex 布局水平排列

### 2.6 设置页

**原方案**：Segmented Tab + 卡片包裹
**调整**：
- Tab 导航：先用 AntD `Tabs` 组件（已经是最稳定的选择），通过 ConfigProvider 的 `Tabs` Token 定制样式。如果效果不满意再考虑替换为 Segmented
- 配置区块：直接用 div + 边框 + 圆角实现卡片效果，不需要封装通用 Card 组件
- **PromptEditor 集成降级为 P2**：本轮设置页的 Prompt 编辑继续用 `Input.TextArea`，只是改善其外观（增大行数、等宽字体）。PromptEditor 组件的集成放到后续迭代

---

## 三、执行顺序调整

采纳 Claude Code 建议，调整执行顺序：

```
Task 0.1-0.3（前置工作）
→ Task 1（设计系统 + ConfigProvider + Tailwind 配置 + overrides.css）
→ Task 1.5（样式验证页 — 新增）
→ Task 2（App.tsx 布局重构）
→ Task 3（项目列表页）
→ Task 4（项目详情页）
→ Task 5（AI 对话页）
→ Task 6（设置页）
→ Task 0.4（归档 Tauri — 延后到最后）
```

### 新增 Task 1.5：样式验证页

在 Task 1 完成后，创建一个临时的样式验证页面 `src/pages/StyleTest.tsx`，包含：
- 各种按钮样式（主按钮、次按钮、文字按钮、危险按钮）
- Input 输入框（验证聚焦光晕）
- Tag/标签（验证药丸形）
- Table 表头和行 hover
- Menu 导航（验证选中态和指示条）
- Upload.Dragger（验证拖拽区样式）

**目的**：在进入正式页面开发前，确认 ConfigProvider + Tailwind + CSS 覆盖的三层方案是否工作正常。如果某个组件样式有问题，在这里解决，避免在页面开发中途返工。

**此页面验证完成后删除，不打包到生产环境。**

---

## 四、本轮明确不做的事项

以下事项从第一轮范围中移除，放入后续迭代：

| 事项 | 原因 | 计划迭代 |
|------|------|---------|
| 暗色模式 | 需要额外的设计规范和测试，当前阶段聚焦亮色模式 | Round 3+ |
| 通用组件封装库 | 先在各页面内实现，等样式稳定后再抽取公共组件 | Round 2 |
| 高级动画（framer-motion） | 先保证基础 CSS transition 效果，复杂动画后续迭代 | Round 2 |
| 虚拟滚动 | 当前文件数量级别（<100）不需要，数据量增长后再加 | Round 3+ |
| 视觉回归测试（Chromatic） | 基础设施搭建成本高，先用人工对比 mockup 验收 | Round 3+ |
| PromptEditor 集成 | 组件在归档目录中，集成需要评估和修改，非核心 UI 问题 | Round 2 |
| 单元测试 | 本轮聚焦 UI 视觉，测试在功能稳定后补充 | Round 2 |

---

## 五、Claude Code 提出的遗漏风险回应

| 风险项 | 现状 | 应对方案 |
|--------|------|---------|
| 路由调整 | 当前使用 useState 管理页面切换，不涉及路由库 | 本轮不改变路由机制，保持 useState 方式 |
| 状态管理 | 当前各页面内部 useState，跨页面通过 props 传递 | 本轮不改变状态管理方式，保持现状 |
| 文件上传功能 | Electron 后端已实现完整上传流程 | 仅改前端样式，不碰上传逻辑。每完成一个 Task 后测试上传功能 |
| AI 对话功能 | Electron 后端已集成智谱+MiMo | 仅改前端样式，不碰 AI 调用逻辑 |
| 数据库迁移 | Electron 已使用 sql.js，数据库文件位置正确 | 不涉及数据库变更 |
| 文件系统访问 | Electron 后端已实现完整的文件操作 | 不涉及后端变更 |
| 响应式设计 | HTML mockup 未完全展示响应式效果 | 实施时在 800px、1024px、1280px、1440px 四个宽度下验证，记录问题 |
| 图标库依赖 | `@ant-design/icons` 已在 package.json 中 | 确认版本兼容性，不需要额外安装 |

---

## 六、修订后的验收标准

1. 所有 4 个页面的视觉效果与 HTML 原型**整体风格一致**（允许微小差异，不要求像素级完美）
2. 色彩、间距、圆角遵循设计文档（以 ConfigProvider Token 为准）
3. 所有可交互元素有 hover 和 active 状态反馈
4. 页面切换无闪烁、无报错
5. 窗口在 900px - 1440px 范围内布局合理（缩小响应式验证范围）
6. 空状态正确显示
7. **所有现有功能不受影响**：项目 CRUD、文件上传与 AI 分类、AI 对话、设置保存、文件预览/编辑/删除
8. `npm run dev` 和 `npm run build` 均无报错无警告
