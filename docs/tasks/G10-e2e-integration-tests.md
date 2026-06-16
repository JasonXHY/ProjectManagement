# G10 — E2E 集成测试框架 + 用例

> **状态：✅ 完成（TDD，commit `077cda7`，分支 feat/v3.1-subcategories-and-fixes）**

> 关联需求：F01–F09 验收标准、N02/N04/N06
> 依赖：G1、G2、G3、G6、G9（功能稳定后再覆盖）
> 阻塞：无
> 优先级：P1（与功能并行推进，功能定稿后补齐断言）

## 背景

当前**端到端集成测试数量为 0**。所有测试在 jsdom 中把 `window.api` 全 mock，从不触达真实 IPC 主进程、SQLite、文件系统。需求中大量"价值在主进程"的验收标准（文件夹创建/回滚、级联删除、路径安全、50MB、持久化、saveQueue）完全无自动化保障。

## Scope

### 包含
1. **测试框架**：新增 Node 环境的 vitest project（与现有 jsdom project 并存），可直接 import 并调用 `electron/` 的 IPC handler 逻辑或其底层 service/db 函数，使用：
   - 真实 sql.js DB（指向临时文件，afterEach 清理）
   - 真实临时目录作为 projects root（`os.tmpdir()` 下随机目录）
   - 对 Electron 专有 API（`app.getPath`、`safeStorage`、`shell`、`nativeImage`）做最小桩，但 DB 与 fs 用真实实现
   - 对 AI provider 网络调用做 mock（返回固定 JSON），其余真实
2. **覆盖用例**（按需求验收标准）：
   - F01.1 创建项目 → 断言目录树（阶段+子分类，依赖 G2）、`.ai/` 存在、默认阶段=售前
   - F01.1 回滚 → 模拟 fs 失败 → 断言 DB 无孤儿
   - F01.4 删除 → 断言 DB 记录 + 物理目录 + 对话记录级联清除（N04）
   - F02.1 上传 → 50MB 后端拒绝；正常文件写盘 + content_extracted（含 CSV，依赖 G5）
   - F02.3 删除文件路径安全（N02）：构造越界 stored_path → 拒绝
   - F02.5 / F03 分类移动 → 断言 DB subcategory + 磁盘 `阶段/子分类/` 路径（依赖 G3/G6）；移动失败返回 MOVE_FAILED
   - F08 关键信息双写 → 断言 DB metadata + `.ai/project-info.md`
   - N06 持久化：写入后重开 DB → 数据仍在
3. **CI 串联**：`package.json` 增加 `test:integration` 脚本；文档说明运行方式。

### 不包含
- 完整 GUI 自动化（Playwright 驱动真实窗口）——本任务聚焦主进程逻辑层 E2E；GUI E2E 可作为后续独立任务。
- 真实 AI 网络调用。

## 成功标准
- [ ] 新增 Node 环境集成测试 project，可运行真实 DB + 真实临时 fs
- [ ] 上述每条用例均有对应 `it(...)` 且通过
- [ ] 每个测试自包含、可重复（临时目录/DB 隔离、afterEach 清理）
- [ ] `npm run test:integration` 全绿；与现有 jsdom 单测互不干扰
- [ ] 覆盖矩阵更新：在 `docs/specs/spec-unimplemented-requirements.md` 第四节把已补测需求标记为 E2E-INTEGRATION

## 验证命令
```bash
npm run test:integration && npm test
```
