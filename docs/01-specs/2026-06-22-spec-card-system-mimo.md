# PMAer v0.2.0 卡片系统实现指南

> 最后更新：2026-06-25 | 状态：已确认，可进入开发

## 任务

实现 PMAer v0.2.0 卡片系统，包括统计行、10 个特色卡片（含弹窗/展开）、利润测算工具。

## 第一步：读取设计文档（按顺序）

1. `docs/design/card-ui-rules.md` — UI 规则总纲，必须严格遵守
2. `docs/design/design-tokens.md` — 颜色/字体/间距/阴影/阶段配色
3. `docs/design/ui-design-spec.md` — 布局/组件/交互/图标映射（重点看 §2.3-§2.4 卡片映射规则和 §3.4 特色卡片组件规范）
4. `docs/card-system-design-decisions.md` — 全部 10 个卡片的设计决策（定位/数据模型/UI/业务原因）
5. `docs/evaluation-algorithm.md` — 利润测算算法（项目评估卡片用）

## 第二步：读取 UI Mockup（对照实现）

**权威参考顺序**（冲突时以此为准）：
1. `.qoderwork/mockups/04-card-system-v020.html` — 主交互 mockup（最高优先级）
2. `outputs/card-system-v3.html` — 完整页面 mockup
3. `.qoderwork/mockups/05-all-cards-mockup.html` — 全部 10 个卡片收起状态
4. `.qoderwork/mockups/09-card-details.html` — 全部卡片的弹窗/展开详细 UI

**利润测算参考**：
- `.qoderwork/mockups/06-eval-card-web.html` — 网页版利润测算（完整计算逻辑，可参考）
- `.qoderwork/mockups/07-eval-card-card.html` — 卡片版利润测算（560px 适配）

## 第三步：读取现有代码了解项目结构

- `src/` 目录下的现有组件，了解项目技术栈和代码风格
- 特别关注现有的 `ProjectHome` 或类似页面组件

## 关键规则（违反任何一条都要返工）

1. CSS 变量必须用 `design-tokens.md` 的完整名称，`--color-primary` 不是 `--c1`
2. 图标用 SVG（对应 `@ant-design/icons`），禁止 emoji
3. 利润率阈值用小数比较（`0.40` 不是 `40`）
4. 特色卡片映射（4组）：售前→项目信息+合同概览+项目评估，进行中→需求跟踪+关键问题+签字追踪，转客户成功→签字追踪+拓展商机+交付物清单，关闭→拓展商机+交付物清单+项目总结
5. 统计行固定 4 张卡片（文件数量/里程碑/待处理/AI摘要），里程碑弹窗不在特色卡片中重复
6. 不做分包/类整包模式切换，统一红线（内部>0%，外包>40%）
7. 弹窗尺寸：标准弹窗 640px，AI 摘要弹窗 800px

## 数据源说明（已确认 2026-06-25）

### 统计行卡片数据源

| 卡片 | 数据源 | 存储位置 | 说明 |
|------|--------|----------|------|
| 文件数量 | `SELECT COUNT(*) FROM files WHERE project_id = ?` | files 表 | 直接查询 |
| 里程碑 | `project.milestones` JSON 字段 | projects 表 | AI 提取 + 手动编辑 |
| 待处理 | `SELECT COUNT(*) FROM files WHERE project_id = ? AND ai_analyzed = 0` | files 表 | 直接查询 |
| AI 摘要 | `.ai/project-summary.md` 文件 | 文件系统 | AI 生成 |

### 特色卡片数据源（已确认）

| 卡片 | 数据来源 | 存储位置 | 处理逻辑 |
|------|----------|----------|----------|
| **项目信息** | AI 提取 6 个字段 + 用户手动填写 | `project.metadata` | 手动修改优先级高于 AI，AI 不覆盖手动值 |
| **合同概览** | AI 从合同文件提取分项 + 用户可编辑 | `project.metadata` | 付款里程碑复用统计行数据，筛选 `type: 'payment'` |
| **项目评估** | 用户输入（利润测算工具） | `project.metadata.evaluation` | 与 web 版数据格式统一，单价表内置 |
| **需求跟踪** | AI 从需求文档/会议纪要/周报提取 + 手动录入 | `project.metadata.requirements` | 状态默认 `pending`，手动更新，自动填充时间戳 |
| **关键问题** | AI 根据关键词识别（问题/风险/阻塞） | `project.metadata.issues` | 优先级默认 `medium`，手动调整 |
| **签字追踪** | 根据项目金额档位自动生成 + 手动添加 | `project.metadata.signatures` | AI 判断优先，用户可修改 |
| **拓展商机** | AI 识别"二期"/"三期"/"追加需求"等关键词 | `project.metadata.opportunities` | 状态默认 `planned`，手动更新 |
| **交付物清单** | AI 提取 + 手动录入 | `project.metadata.deliverables` | 版本号格式 `v{主}.{次}`，不关联签字件 |
| **项目总结** | AI 基于全部文件生成初稿 + 用户编辑 | `project.metadata.summary` | 成果分类固定，复盘为自由文本 |

## 实现顺序建议

1. 先做统计行 4 张卡片 + 里程碑弹窗
2. 再做售前 3 张特色卡片（项目信息/合同概览/项目评估）
3. 然后进行中 3 张（需求跟踪/关键问题/签字追踪）
4. 转客户成功 3 张（签字追踪/拓展商机/交付物清单）
5. 最后关闭 3 张（拓展商机/交付物清单+项目总结）

> 注：项目评估卡片包含利润测算工具，参考 06/07 mockup 的计算逻辑，两个版本（web 版和卡片版）计算公式统一。

## 弹窗规范

| 弹窗类型 | 尺寸 | 适用卡片 |
|----------|------|----------|
| 标准弹窗 | 640px | 合同概览、需求跟踪、关键问题、签字追踪、交付物清单 |
| AI 摘要弹窗 | 800px | AI 摘要 |
| 折叠/展开 | 无弹窗 | 项目总结（4行折叠） |
| 纯展示 | 无弹窗 | 项目信息、项目评估、拓展商机 |

## 响应式设计

- `< 900px`：侧边栏折叠为图标模式，卡片网格 2 列
- `900px - 1200px`：卡片网格 2-3 列自适应
- `> 1200px`：卡片网格 3-4 列自适应
