# 协作指令 — 第一轮 UI 优化

## 角色分工

- **QoderWork**：方案设计与 UI 视觉原型输出方，负责设计规范、HTML mockup、实施计划
- **Claude Code**：代码实现方，负责审核方案可行性并执行代码改造
- **用户（你）**：需求提出方与最终审核方，负责在两个 Agent 之间传递文档、做决策、测试验收

## 工作流程

**本轮你只需要做审核，不要开始执行任何代码改动。**

请按以下顺序阅读文件：

1. `.qoderwork/design-system/v1-design-tokens.md` — 完整设计规范（色彩、字体、间距、圆角、阴影、组件规范、Tailwind/AntD 配置）
2. `.qoderwork/plans/round1-ui-optimization.md` — 第一轮实施计划（所有 Task 的详细改动要点和验收标准）
3. `.qoderwork/mockups/01-project-list.html` — 项目列表页视觉原型（浏览器打开查看）
4. `.qoderwork/mockups/02-project-home.html` — 项目详情页视觉原型（浏览器打开查看）
5. `.qoderwork/mockups/03-chat-window.html` — AI 对话页视觉原型（浏览器打开查看）

## 审核要求

读完以上文件后，请从以下角度审核方案，并将审核结果写到 `.claude-code/reviews/round1-review.md`：

1. **技术可行性**：每个 Task 在现有技术栈（React 19 + Ant Design 6 + Tailwind CSS 4 + Electron 42）下是否可行？有没有技术阻碍？
2. **Ant Design 主题覆盖**：ConfigProvider 的配置能否完全覆盖设计文档要求的视觉效果？哪些组件的默认样式难以覆盖？
3. **Tailwind 与 Ant Design 冲突风险**：两者并用时有没有已知的样式优先级问题？建议的解决方案？
4. **实施顺序合理性**：计划中的 Task 执行顺序是否合理？有没有依赖关系需要调整？
5. **遗漏风险**：有没有计划中未覆盖但实施时会遇到的问题（如现有组件的 props 变化、路由调整、状态管理变更等）？
6. **工作量评估**：每个 Task 你预估的工作量（大致时间）
7. **改进建议**：如果你认为某些设计或实现方案有更好的做法，请提出

## 审核完成后

将你的审核文档路径（`.claude-code/reviews/round1-review.md`）告知用户，用户会将路径转发给 QoderWork。QoderWork 会根据你的审核意见调整方案，双方对齐后再开始执行。

**再次强调：本轮只做审核，不要修改任何代码。**
