# 任务清单（基于 v3.1 未实现/未测试需求）

> 来源规格：`docs/specs/spec-unimplemented-requirements.md`
> 排序：依赖顺序（先做 G1，测试 G10 最后收口）

| ID | 任务 | 优先级 | 依赖 | 关联需求 |
|----|------|--------|------|----------|
| [G1](G01-subcategory-data-model.md) | 子分类数据模型 | P0 | — | §1.1, F04.2 |
| [G2](G02-nested-folder-creation.md) | 嵌套子分类文件夹创建 | P1 | G1 | F01.1, F04.2 |
| [G3](G03-classify-prompt-subcategory.md) | 分类 Prompt 子分类 + 待签/已签 | P1 | G1 | F03.3 |
| [G4](G04-subcategory-management-ui.md) | 子分类管理 UI | P2 | G1 | F14.1, F04.2 |
| [G5](G05-csv-image-extraction.md) | CSV + 图片内容提取 | P2 | — | F02.1 |
| [G6](G06-manual-reclassify-dropdown.md) | 手动分类下拉 11 阶段 + 子分类 | P2 | G1 | F02.5 |
| [G7](G07-stage-reorder-ui.md) | 文件分类阶段排序 UI | P3 | — | F14.1, F04.2 |
| [G8](G08-chat-timer-retry.md) | 对话计时 + retry 上限 2 | P3 | — | F05.2 |
| [G9](G09-provider-list-complete.md) | 补全 AI 供应商（零一万物） | P3 | — | F10.1 |
| [G10](G10-e2e-integration-tests.md) | E2E 集成测试框架 + 用例 | P1 | G1,G2,G3,G6,G9 | F01–F09, N02/N04/N06 |

## 建议执行批次

1. **批次 1（基础）**：G1
2. **批次 2（依赖 G1，可并行）**：G2、G3、G4、G6
3. **批次 3（独立，可并行）**：G5、G7、G8、G9
4. **批次 4（收口）**：G10（功能稳定后补齐 E2E 断言）

> 任务状态同步在任务跟踪器（TaskList）中，ID 对应：G1=#5 … G10=#14。
