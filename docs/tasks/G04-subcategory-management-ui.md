# G4 — 子分类管理 UI

> **状态：✅ 完成（TDD，commit `ec6178a`，分支 feat/v3.1-subcategories-and-fixes）**

> 关联需求：F14.1、F04.2（§4.2 第5条 子分类自定义）
> 依赖：G1
> 阻塞：无
> 优先级：P2

## 背景

F04.2 要求子分类支持用户自定义（新增、删除），F14.1 的「文件分类管理」tab 当前只能管理阶段（增/删/保护默认），不能管理子分类。

## Scope

### 包含
1. `src/components/Settings/SettingsPage.tsx`「文件分类管理」tab：在每个阶段下展示其子分类列表，支持新增/删除子分类。
2. 默认阶段与默认子分类受保护（不可删除），与现有阶段保护逻辑一致（`closable={!isDefault}` + tooltip）。
3. 持久化：子分类配置写入 settings（如 `custom_subcategories` JSON），加入 `settings-handlers.ts` 白名单。
4. 保存后应用于**新建项目**的文件夹结构（与 G2 衔接），已有项目不受影响。

### 不包含
- 子分类排序（可作为后续；本任务只增/删）。
- 文件夹创建本身（G2）。

## 成功标准
- [ ] 设置页可查看每个阶段的子分类并增/删
- [ ] 默认阶段与默认子分类不可删除（UI 禁用 + 提示）
- [ ] 自定义子分类持久化（`custom_subcategories` 入白名单），重启后保留
- [ ] 新建项目时按自定义子分类建目录（与 G2 联动验证）
- [ ] 组件级测试：增/删子分类、默认项不可删、保存调用 `configService.update`
- [ ] `npm run typecheck && npm run lint && npm test` 全绿

## 验证命令
```bash
npm run typecheck && npm run lint && npm test
```
