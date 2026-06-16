# G6 — 手动分类下拉 11 阶段 + 子分类

> **状态：✅ 完成（TDD，commit `ec84689`，分支 feat/v3.1-subcategories-and-fixes）**

> 关联需求：F02.5
> 依赖：G1
> 阻塞：G10
> 优先级：P2

## 背景

F02.5 要求手动分类下拉提供 11 个文件分类阶段（含「未分类」），并（v3.1）应能选择子分类。当前 `FileListTable.tsx:124` 的下拉只有 10 个阶段，缺「未分类」，且无子分类。

## Scope

### 包含
1. `src/components/ProjectHome/FileListTable.tsx`：下拉数据源改为 G1 的阶段定义，补齐「未分类」，并以**级联/二级**方式选择子分类（阶段 → 子分类）。
2. 选择后调用 `fileService.updateCategory`（含子分类）→ 后端 `file:updateCategory` 物理移动到 `阶段/子分类/` 目录并同步 DB（沿用 B3 修复：移动失败不谎报成功）。
3. 下拉阶段列表去除硬编码，统一引用 G1 数据源（消除与 `StageSidebar` 的重复定义）。

### 不包含
- 后端移动逻辑的重写（已存在，仅扩展 subcategory 入参，G3 已加 DB 字段）。

## 成功标准
- [ ] 下拉含全部 11 阶段（含「未分类」）
- [ ] 可选择子分类，确认后文件物理移动到对应 `阶段/子分类/` 目录且 DB 同步
- [ ] 移动失败时给出错误提示，不显示"成功"
- [ ] 阶段列表来自 G1 单一数据源（无新硬编码）
- [ ] 组件测试：渲染 11 项；选择触发 `updateCategory` 携带正确参数
- [ ] `npm run typecheck && npm run lint && npm test` 全绿

## 验证命令
```bash
npm run typecheck && npm run lint && npm test
```
