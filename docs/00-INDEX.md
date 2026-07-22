# PMAer 文档索引

> 最后更新：2026-06-30
> 用途：AI Agent 文档导航入口
> 方法论：参照 `侧耳倾听` 项目文档组织指南

---

## 快速查找

| 类型 | 目录 | 用途 | Agent 何时读取 |
|------|------|------|---------------|
| 需求规格 | `01-specs/` | 功能需求、接口规格、数据模型 | 做技术决策时 |
| 实施方案 | `02-plans/` | 实施方案、架构设计、重构计划 | 执行任务前 |
| 复盘报告 | `03-reports/` | 复盘报告、审查报告、测试报告 | 总结进度时 |
| 开发指南 | `04-guides/` | 开发规范、工作流程、工具使用 | 新会话开始 |
| 问题记录 | `05-issues/` | Bug 记录、问题排查、根因分析 | 排查问题时 |
| 历史归档 | `06-archive/` | 已完成方案、过时文档、旧版记录 | 查历史时 |
| UI 原型 | `99-mockups/` | HTML 原型、设计稿 | 对比实现时 |

---

## 文件命名规范

```
[日期]-[类型]-[简述].md
```

| 类型代码 | 含义 | 对应目录 |
|---------|------|---------|
| `spec` | 需求规格 | 01-specs/ |
| `plan` | 实施方案 | 02-plans/ |
| `report` | 复盘报告 | 03-reports/ |
| `guide` | 开发指南 | 04-guides/ |
| `issue` | 问题记录 | 05-issues/ |
| `task` | 已完成任务 | 06-archive/ |

---

## 01-specs/ 需求规格 (25 files)

| 日期 | 文件 | 说明 |
|------|------|------|
| 2026-06-14 | spec-business-requirements.md | 业务需求文档 |
| 2026-06-14 | spec-feasibility-analysis.md | 可行性分析 |
| 2026-06-15 | spec-model-registry-update.md | 模型注册表更新规范 |
| 2026-06-15 | spec-ui-design.md | UI 设计规范 |
| 2026-06-16 | spec-operation-buttons-fix.md | 操作按钮修复规格 |
| 2026-06-22 | spec-card-system-analysis.md | 卡片系统现状分析 |
| 2026-06-22 | spec-card-system-design.md | 卡片系统设计决策 |
| 2026-06-22 | spec-card-system-mimo.md | 卡片系统 MiMo 版 |
| 2026-06-22 | spec-card-ui-rules.md | 卡片 UI 规则 |
| 2026-06-22 | spec-mermaid-rendering.md | Mermaid 渲染规格 |
| 2026-06-22 | spec-signature-detection.md | 签字检测分析 |
| 2026-06-22 | spec-unimplemented-requirements.md | 未实现需求清单 |
| 2026-06-22 | spec-v0.2.0-requirements.md | v0.2.0 需求规格 |
| 2026-06-25 | spec-card-data-source.md | 卡片数据源讨论 |
| 2026-06-25 | spec-card-system-optimization.md | 卡片系统优化方案 |
| 2026-06-25 | spec-evaluation-algorithm.md | 利润测算算法 |
| 2026-06-27 | spec-opt5-opt6-opt2-design.md | OPT-5/OPT-6/OPT-2 设计 |
| 2026-06-28 | spec-bugfix-solutions.md | Bug 修复方案集 |
| 2026-06-28 | spec-test-revision-plan.md | 测试修订计划 |
| 2026-06-28 | spec-third-round-fixes.md | 第三轮修复规格 |
| 2026-06-29 | spec-card-system-fix-plan.md | 卡片系统修复计划 |
| 2026-06-29 | spec-card-ui-gaps-and-fixes.md | 卡片 UI 差距分析 |
| 2026-06-29 | spec-handover-import-fixes.md | 转交导入修复规格 |
| 2026-06-29 | spec-import-dialog-fix.md | 导入弹窗修复规格 |
| 2026-06-29 | spec-test-round-fixes.md | 测试轮次修复规格 |

## 02-plans/ 实施方案 (20 files)

| 日期 | 文件 | 说明 | 状态 |
|------|------|------|------|
| 2026-06-14 | plan-documentation-rewrite.md | 文档重写方案 | 已完成 |
| 2026-06-16 | plan-subcategory-proposal.md | 子分类提案 v3.1 | 已完成 |
| 2026-06-22 | plan-optimization-roadmap.md | 优化路线图 | 参考 |
| 2026-06-22 | plan-quick-launch.md | 快速启动方案 | 已完成 |
| 2026-06-22 | plan-v0.2.0-design.md | v0.2.0 设计方案 | 已完成 |
| 2026-06-22 | plan-v0.2.0-dev-guide.md | v0.2.0 开发指南 | 已完成 |
| 2026-06-22 | plan-v0.2.0-draft.md | v0.2.0 草案 | 已完成 |
| 2026-06-22 | plan-v0.2.0-final.md | v0.2.0 最终方案 | 已完成 |
| 2026-06-22 | plan-v0.2.0-implementation.md | v0.2.0 实施方案 | 已完成 |
| 2026-06-26 | plan-card-data-model.md | 卡片数据模型补全 | 已完成 |
| 2026-06-26 | plan-code-quality.md | 代码质量优化 | 已完成 |
| 2026-06-26 | plan-phase2-handler-split.md | Phase2 handler 拆分 | 已完成 |
| 2026-06-26 | plan-phase3-type-safety.md | Phase3 类型安全 | 已完成 |
| 2026-06-26 | plan-round1.md | 第一轮修复方案 | 已完成 |
| 2026-06-26 | plan-round2.md | 第二轮修复方案 | 已完成 |
| 2026-06-26 | plan-style-migration-test.md | 样式迁移测试方案 | 已完成 |
| 2026-06-28 | plan-bugfix.md | Bug 修复计划 | 已完成 |
| 2026-06-28 | plan-verification.md | 验证计划 | 已完成 |
| 2026-06-29 | plan-card-ui-implementation.md | 卡片 UI 实施方案 | 已完成 |
| 2026-06-30 | plan-v0.3-planning.md | **v0.3.0 规划方案** | 待执行 |

## 03-reports/ 复盘报告 (10 files)

| 日期 | 文件 | 说明 |
|------|------|------|
| 2026-06-14 | report-documentation-rewrite.md | 文档重写复盘 |
| 2026-06-22 | report-code-review.md | 代码审查报告 |
| 2026-06-26 | report-code-review-v3.md | 代码审查报告 v3 |
| 2026-06-26 | report-code-review-v3-response.md | 审查反馈回复 |
| 2026-06-26 | report-daily-summary.md | 每日总结 |
| 2026-06-26 | report-phase2.md | Phase2 复盘 |
| 2026-06-26 | report-phase3.md | Phase3 复盘 |
| 2026-06-26 | report-qoder-review-response.md | Qoder 审查回复 |
| 2026-06-26 | report-qwen-review-instructions.md | 通义审查指引 |
| 2026-06-30 | report-v0.2.0-release-summary.md | **v0.2.0 发布总结** |

## 04-guides/ 开发指南 (10 files)

| 日期 | 文件 | 说明 |
|------|------|------|
| 2026-06-14 | guide-architecture.md | 架构设计 |
| 2026-06-14 | guide-tech-selection.md | 技术选型 |
| 2026-06-15 | guide-beta-version-notes.md | Beta 版本说明 |
| 2026-06-15 | guide-design-tokens.md | 设计规范 Token |
| 2026-06-15 | guide-development.md | 开发指南 |
| 2026-06-15 | guide-technical-decisions.md | 技术决策记录 |
| 2026-06-15 | guide-testing.md | 测试指南 |
| 2026-06-22 | guide-optimization-checklist.md | 优化检查清单 |
| — | 用户操作手册-PMAer.md | 用户操作手册 (MD) |
| — | 用户操作手册-PMAer-v0.2.0.docx | 用户操作手册 (Word) |

## 05-issues/ 问题记录 (2 files)

| 日期 | 文件 | 说明 | 状态 |
|------|------|------|------|
| 2026-06-18 | issue-bugfix-investigation.md | 5 个 Bug 排查 | 已修复 |
| 2026-06-27 | issue-comprehensive-audit.md | 综合审计报告 | 活跃 |

## 06-archive/ 历史归档 (18 files)

| 日期 | 文件 | 说明 |
|------|------|------|
| 2026-06-15 | icon-design-options.html | 图标设计选项 |
| 2026-06-15 | 用户操作手册-PMAer-v0.1.2-backup.md | 旧版手册备份 |
| 2026-06-16 | task-G01-subcategory-data-model.md | 子分类数据模型任务 |
| 2026-06-16 | task-G02-nested-folder-creation.md | 嵌套文件夹创建任务 |
| 2026-06-16 | task-G03-classify-prompt.md | 分类Prompt任务 |
| 2026-06-16 | task-G04-subcategory-ui.md | 子分类管理UI任务 |
| 2026-06-16 | task-G05-csv-image-extraction.md | CSV/图片提取任务 |
| 2026-06-16 | task-G06-manual-reclassify.md | 手动重分类任务 |
| 2026-06-16 | task-G07-stage-reorder.md | 阶段排序任务 |
| 2026-06-16 | task-G08-chat-timer-retry.md | 对话计时重试任务 |
| 2026-06-16 | task-G09-provider-list.md | 供应商列表任务 |
| 2026-06-16 | task-G10-e2e-tests.md | E2E测试任务 |
| 2026-06-16 | task-human-verification.md | 人工验证任务 |
| 2026-06-16 | task-readme.md | 任务说明 |
| 2026-06-17 | bugfix-proposal.md | 早期 Bug 修复提案 |
| 2026-06-17 | crash-investigation.md | 崩溃调查 |
| 2026-06-17 | crash-investigation-v2.md | 崩溃调查 v2 |
| 2026-06-17 | issues-and-requirements-v2.md | 早期问题需求 v2 |

## 99-mockups/ UI 原型 (3 files)

| 文件 | 说明 |
|------|------|
| gantt-option-a.html | 甘特图方案 A |
| gantt-option-b.html | 甘特图方案 B |
| gantt-option-c.html | 甘特图方案 C |

## screenshots/ 截图 (24 files)

见 `screenshots/` 目录，按编号排序（01-24）。

---

## 最近更新

| 日期 | 文件 | 说明 |
|------|------|------|
| 2026-06-30 | 02-plans/plan-v0.3-planning.md | v0.3.0 规划方案 |
| 2026-06-30 | 03-reports/report-v0.2.0-release-summary.md | v0.2.0 发布总结 |
| 2026-06-30 | 00-INDEX.md | 文档索引（本文件） |

---

## Agent 使用指南

1. **启动时**：读 `00-INDEX.md` 了解文档结构
2. **排查问题时**：去 `05-issues/` 找相关问题记录
3. **执行任务前**：去 `02-plans/` 找实施方案
4. **总结进度时**：去 `03-reports/` 找复盘报告
5. **新会话开始**：读 `04-guides/` 了解开发规范
6. **对比实现时**：去 `99-mockups/` 找 UI 原型

### 创建文档规则

1. 先查索引确认无同主题文档
2. 命名遵循 `[日期]-[类型]-[简述].md`
3. 创建后在本索引添加条目
