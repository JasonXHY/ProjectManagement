# 协作指令 — 第一轮 UI 优化（修订版 v2）

## 角色分工

- **QoderWork**：方案设计与 UI 视觉原型输出方，负责设计规范、HTML mockup、实施计划
- **Claude Code**：代码实现方，负责审核方案可行性并执行代码改造
- **用户**：需求提出方与最终审核方，负责在两个 Agent 之间传递文档、做决策、测试验收

## 工作流程

**本轮你只需要做审核，不要开始执行任何代码改动。**

请按以下顺序阅读文件：

1. `.qoderwork/plans/round1-revision-v2.md` — **修订方案 v2（最重要，先读这个）**，包含针对你审核反馈的策略调整和简化方案
2. `.qoderwork/design-system/v1-design-tokens.md` — 完整设计规范（色彩、字体、间距、圆角、阴影、组件规范、Tailwind/AntD 配置）
3. `.qoderwork/plans/round1-ui-optimization.md` — 原始实施计划（修订方案未覆盖的细节参考此文件）
4. `.qoderwork/mockups/01-project-list.html` — 项目列表页视觉原型（浏览器打开查看）
5. `.qoderwork/mockups/02-project-home.html` — 项目详情页视觉原型（浏览器打开查看）
6. `.qoderwork/mockups/03-chat-window.html` — AI 对话页视觉原型（浏览器打开查看）

## 审核要求

请针对修订方案 v2 进行二次审核，重点关注以下问题，将审核结果写到 `.claude-code/reviews/round1-review-v2.md`：

1. **三层样式架构是否可行**：ConfigProvider（主题）+ Tailwind（布局，禁用 preflight）+ overrides.css（细节覆盖），这个分层是否足够清晰？你在实际开发中预判还会有边界模糊的地方吗？
2. **组件简化方案是否合理**：
   - 视图切换用 `Radio.Group buttonStyle="solid"` 替代自定义 toggle
   - 上下文面板用 AntD `Drawer` 替代常驻侧边栏
   - 文件上传用 `Upload.Dragger` 替代自定义拖拽区
   - StageNav 用 AntD `Menu` 替代自定义列表
   - 消息气泡纯自定义 div
   - 这些替代方案在 Ant Design 6 中是否能达到接近 mockup 的视觉效果？
3. **Task 1.5 样式验证页**：你认为需要额外验证哪些组件或样式场景？
4. **执行顺序确认**：调整后的顺序（0.1-0.3 → 1 → 1.5 → 2 → 3 → 4 → 5 → 6 → 0.4）是否合理？
5. **本轮不做事项**：是否同意将暗色模式、通用组件库、高级动画、虚拟滚动、PromptEditor 集成、单元测试延后？有没有你认为不能延后的？
6. **如果审核通过**：请明确声明"方案审核通过，可以开始执行"，并给出你建议的每步 commit 节点

## 审核完成后

将审核文档路径告知用户，用户会转发给 QoderWork 确认。双方对齐后，用户会给出开始执行的指令。

**再次强调：本轮只做审核，不要修改任何代码。**
