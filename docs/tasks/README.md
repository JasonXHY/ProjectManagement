# 任务清单（基于 v3.1 未实现/未测试需求）

> 来源规格：`docs/specs/spec-unimplemented-requirements.md`
> 排序：依赖顺序（先做 G1，测试 G10 最后收口）
> **状态：G1–G10 全部完成（TDD），分支 `feat/v3.1-subcategories-and-fixes`。验证清单见 [HUMAN-VERIFICATION.md](HUMAN-VERIFICATION.md)。**

| ID | 任务 | 状态 | 优先级 | 依赖 | 关联需求 | 提交 |
|----|------|------|--------|------|----------|------|
| [G1](G01-subcategory-data-model.md) | 子分类数据模型 | ✅ 完成 | P0 | — | §1.1, F04.2 | `54f138c` |
| [G2](G02-nested-folder-creation.md) | 嵌套子分类文件夹创建 | ✅ 完成 | P1 | G1 | F01.1, F04.2 | `690b349` |
| [G3](G03-classify-prompt-subcategory.md) | 分类 Prompt 子分类 + 待签/已签 | ✅ 完成 | P1 | G1 | F03.3 | `b43411e` |
| [G4](G04-subcategory-management-ui.md) | 子分类管理 UI | ✅ 完成 | P2 | G1 | F14.1, F04.2 | `ec6178a` |
| [G5](G05-csv-image-extraction.md) | CSV + 图片内容提取 | ✅ 完成 | P2 | — | F02.1 | `443d699` |
| [G6](G06-manual-reclassify-dropdown.md) | 手动分类下拉 11 阶段 + 子分类 | ✅ 完成 | P2 | G1 | F02.5 | `ec84689` |
| [G7](G07-stage-reorder-ui.md) | 文件分类阶段排序 UI | ✅ 完成 | P3 | — | F14.1, F04.2 | `5f17c68` |
| [G8](G08-chat-timer-retry.md) | 对话计时 + retry 上限 2 | ✅ 完成 | P3 | — | F05.2 | `71df9ee` |
| [G9](G09-provider-list-complete.md) | 补全 AI 供应商（零一万物） | ✅ 完成 | P3 | — | F10.1 | `4b0b486` |
| [G10](G10-e2e-integration-tests.md) | E2E 集成测试框架 + 用例 | ✅ 完成 | P1 | G1,G2,G3,G6,G9 | F01–F09, N02/N04/N06 | `077cda7` |

## 执行批次（已全部完成）

1. ✅ **批次 1（基础）**：G1
2. ✅ **批次 2（依赖 G1，可并行）**：G2、G3、G4、G6
3. ✅ **批次 3（独立，可并行）**：G5、G7、G8、G9
4. ✅ **批次 4（收口）**：G10（真实 sql.js + 真实临时 fs E2E）

## 结果

- 测试数 79 → **151**（含 4 个 E2E 集成）；renderer + electron typecheck 0 error；eslint 0 error；`vite build` 通过。
- 顺带修复一个生产隐患：`closeDatabase()` 退出时丢数据（详见 spec §4.5 与 G10）。
- **待人工验证项**：见 [HUMAN-VERIFICATION.md](HUMAN-VERIFICATION.md)（GUI 视觉/交互、实时 AI 调用、打包产物、真实重启持久化）。
