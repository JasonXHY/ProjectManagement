# 规格说明：未实现 / 未测试需求清单（基于 v3.1）

> 日期：2026-06-16
> 基准需求：`docs/requirements/business-requirements.md` v3.1
> 基准代码：mainline（含 R1–R4 修复分支）
> 验证方式：逐文件审查代码 + 全量测试清单核对（非依据 commit message）
> 关联任务文件：`docs/tasks/G01..G10-*.md`

---

## 一、结论摘要（回答三个问题）

### Q1：每个需求是否都有端到端集成测试？

**否。当前端到端集成测试数量为 0。**

- 全部测试运行在 `jsdom` 环境，`src/test/setup.ts` 将整个 `window.api`（Electron IPC 桥）替换为 `vi.fn()` 桩。
- 没有任何测试启动真实 Electron 主进程、打开真实 SQLite、或操作真实文件系统。
- 唯一引用 `electron/` 源码的测试是 `ai-response.test.ts`，但它只测一个纯字符串解析函数 `parseClassifyResponse`，不涉及 IPC。
- 未安装/配置任何 E2E 工具（无 Playwright / `_electron` / Spectron）。

**测试类型分布（按需求计）：**

| 测试类型 | 含义 | 覆盖需求数 |
|----------|------|-----------|
| E2E-INTEGRATION | 驱动真实 IPC + sqlite + 文件系统 | **0** |
| UNIT-PURE | 测真实纯函数（如 `checkStageProgression`、时间格式化） | ~5 |
| UNIT-MOCKED | 测 hook/service/组件，但 `window.api` 全 mock，不触达真实后端 | ~11 |
| NONE | 完全无测试 | ~20+ |

> 所有"价值在主进程"的需求（真实 IPC、sqlite、文件系统、加密、签字检测、持久化）目前要么仅有 boundary-mock 的管线断言，要么完全无测试。

### Q2：每个需求是否都已实现？

**大部分已实现，但 v3.1 的旗舰特性「子分类体系」完全缺失，另有若干部分实现项。**

全仓库 grep `subcateg|子分类|待签|已签` → **0 命中**。子分类在数据模型、DB schema、文件夹创建、分类 prompt、设置 UI、类型定义中均不存在。

### Q3：未实现 / 未测试需求（按依赖顺序）

见下方第三节。每项对应一个任务文件。

---

## 二、需求实现状态矩阵（验证版）

✅ 已实现 / ⚠️ 部分 / ❌ 未实现

| 需求 | 状态 | 证据 / 差距 |
|------|------|-------------|
| F01.1 创建项目 | ⚠️ | 仅建 10 个**扁平**阶段文件夹（非 11、非嵌套子分类）`project-handlers.ts:55` |
| F01.2 项目列表 | ✅ | 卡片/表格/搜索/筛选/排序齐全 `ProjectList.tsx` |
| F01.3 编辑项目 | ✅ | name+current_stage+category_type `ProjectList.tsx:129` |
| F01.4 删除项目 | ✅ | 二次确认 + 级联 + fs.rm `project-handlers.ts:157` |
| F01.5 打开文件夹 | ✅ | `file-handlers.ts:436` |
| F02.1 上传文件 | ⚠️ | 50MB 前后端✅、自动提取✅；**CSV 与图片内容不提取**（`file-extractor.ts:63` default→null） |
| F02.2 文件列表 | ✅ | 列+侧栏分组计数+多选+操作 `FileListTable.tsx`/`StageSidebar.tsx` |
| F02.3 删除文件 | ✅ | 确认+物理+DB+路径校验 `file-handlers.ts:285` |
| F02.4 打开文件 | ✅ | `file-handlers.ts:400` |
| F02.5 手动分类 | ⚠️ | 下拉**仅 10 阶段**（缺未分类）、**无子分类**；物理移动✅ `FileListTable.tsx:124` |
| F03.1 单文件分类 | ✅ | stage+项目阶段+摘要+关键信息+推进 `ai-handlers.ts:124`（未判子分类） |
| F03.2 一键分类 | ✅ | 进度+取消+刷新 `projectHome.hooks.ts:146` |
| F03.3 分类 Prompt | ❌ | prompt **无子分类、无待签/已签、无会议纪要规则** `classify.ts` |
| F04.1 项目阶段定义 | ✅ | 固定 3 个 `stages.ts:5` |
| F04.2 文件分类阶段定义 | ❌ | 扁平 10 串数组，**无子分类、无嵌套、无排序** `stages.ts:10` |
| F04.3 自动阶段推进 | ✅ | `checkStageProgression` + modal |
| F04.4 手动阶段推进 | ✅ | `projectHome.hooks.ts:354` |
| F04.5 阶段展示 | ✅ | 侧栏计数 + 标签配色 |
| F05.1 对话窗口 | ✅ | 240px 可折叠上下文面板 `ChatWindow.tsx:619` |
| F05.2 发送消息 | ⚠️ | markdown✅/autoscroll✅/stop✅；**缺「已等待 X 秒」、retry 无 max-2、stop 非红方块图标** |
| F05.3 对话上下文 | ✅ | 摘要 + 选中文件 `ai-handlers.ts:82` |
| F05.4 会话管理 | ✅ | 持久化/切换/新建/按会话清空 |
| F06.1 时间线 | ✅ | `ProjectTimeline.tsx` |
| F06.2 里程碑数据 | ✅ | `ai-handlers.ts:362` |
| F07.1 签字检测 | ✅ | `signature-detector.ts` + 上传自动触发 |
| F08.1 关键信息提取 | ✅ | 6 字段 + 双写 + 合并 `ai-handlers.ts:183` |
| F09.1 批量操作 | ✅ | 多选+进度+取消+删除确认 `BatchActionBar.tsx` |
| F10.1 AI 供应商管理 | ⚠️ | 10 厂商 + custom（**缺 零一万物/01.ai**）；联动下拉✅、掩码✅ |
| F11.1 用户角色 | ✅ | 角色注入 prompt `ai-handlers.ts:19` |
| F13.1 项目统计 | ✅ | 4 卡等宽 gap16 `ProjectStats.tsx` |
| F14.1 文件分类管理 | ⚠️ | 增/删+保护默认✅；**无排序、无子分类管理** `SettingsPage.tsx:528` |
| N01 数据安全（明文+掩码） | ✅ | v3.1 接受明文 `settings.ts:13`；掩码✅ |
| N02 文件安全 | ⚠️ | 后端 50MB✅、路径校验✅；**侧栏 Dragger 上传路径无前端 50MB 校验** |
| N03 应用安全 | ✅ | sandbox✅ CSP✅ setWindowOpenHandler deny✅ 权限拒绝✅ `main.ts` |
| N04 数据一致性 | ✅ | saveQueue✅ `index.ts:9/185`；级联删除✅ |
| N05 用户体验 | ✅ | 加载/确认/进度/取消/markdown 齐全 |
| N06 数据持久化 | ✅ | SQLite + 文件系统 |

**已实现且稳固**：项目 CRUD、文件列表/删除/打开（含路径安全）、单+批量分类与推进、会话/上下文、签字检测、关键信息+里程碑、统计卡、角色 prompt、时间线、N01/N03/N04/N06。

---

## 三、未实现 / 未测试清单（依赖顺序）

> 排序原则：基础数据模型 → 依赖它的功能 → 独立功能 → 横切测试。
> 每项 = 一个任务文件，含范围与成功标准。

### 阶段 1：基础（阻塞后续）

| ID | 标题 | 类型 | 关联需求 | 阻塞 | 任务文件 |
|----|------|------|----------|------|----------|
| **G1** | 子分类数据模型 | 实现 | §1.1, F04.2 | → G2,G3,G4,G6,G10 | `docs/tasks/G01-subcategory-data-model.md` |

### 阶段 2：依赖 G1 的功能

| ID | 标题 | 类型 | 关联需求 | 依赖 | 任务文件 |
|----|------|------|----------|------|----------|
| **G2** | 嵌套子分类文件夹创建 | 实现 | F01.1, F04.2 | G1 | `docs/tasks/G02-nested-folder-creation.md` |
| **G3** | 分类 Prompt 支持子分类 + 待签/已签 | 实现 | F03.3 | G1 | `docs/tasks/G03-classify-prompt-subcategory.md` |
| **G4** | 子分类管理 UI | 实现 | F14.1, F04.2 | G1 | `docs/tasks/G04-subcategory-management-ui.md` |
| **G6** | 手动分类下拉 11 阶段 + 子分类 | 实现 | F02.5 | G1 | `docs/tasks/G06-manual-reclassify-dropdown.md` |

### 阶段 3：独立功能（无强依赖，可并行）

| ID | 标题 | 类型 | 关联需求 | 任务文件 |
|----|------|------|----------|----------|
| **G5** | CSV + 图片内容提取 | 实现 | F02.1 | `docs/tasks/G05-csv-image-extraction.md` |
| **G7** | 文件分类阶段排序 UI | 实现 | F14.1, F04.2 | `docs/tasks/G07-stage-reorder-ui.md` |
| **G8** | 对话「已等待 X 秒」+ retry 上限 2 | 实现 | F05.2 | `docs/tasks/G08-chat-timer-retry.md` |
| **G9** | 补全 AI 供应商（零一万物） | 实现 | F10.1 | `docs/tasks/G09-provider-list-complete.md` |

### 阶段 4：横切测试（依赖功能稳定）

| ID | 标题 | 类型 | 关联需求 | 依赖 | 任务文件 |
|----|------|------|----------|------|----------|
| **G10** | E2E 集成测试框架 + 用例 | 测试 | F01–F09, N02/N04/N06 | G1,G2,G3,G6,G9 | `docs/tasks/G10-e2e-integration-tests.md` |

---

## 四、测试缺口专项（Q1 展开）

即使排除子分类，以下需求**完全无测试（NONE）**，应在 G10 中优先补齐 E2E：

- F01.4 删除级联（DB+文件夹+对话）、F01.5 打开文件夹
- F02.4 打开文件、F02.5 手动分类物理移动
- F03.2 批量分类进度/取消、F03.3 prompt 行为
- F04.4 手动推进确认
- F05.1/F05.3/F05.4 对话窗口/上下文/会话管理
- F06 时间线/里程碑、F07 签字检测、F08 关键信息提取
- F09 批量操作、F11 角色、F13 统计、F14 分类管理
- N01–N06 全部（加密掩码、50MB/路径、CSP/sandbox、saveQueue/级联、UX、持久化）

---

## 五、备注

- 本规格只列**未达标**项；已 ✅ 项不重复展开。
- 各任务文件含明确 Scope（含/不含）与可验证的 Success Criteria。
- 子分类默认值以需求 §1.1 表格为准（每阶段 3–7 个）。
