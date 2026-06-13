# 开发进度

> 最后更新：2026-06-13

---

## 已完成轮次

### 第一轮（UI重构）✅
- commit `970e2b4`
- 114个文件变更，+16363/-1217行
- 设计系统 + 4个页面重构（ProjectList、ProjectHome、ChatWindow、SettingsPage）
- 三层样式架构：ConfigProvider + Tailwind(preflight:false) + overrides.css

### 第二轮（功能补全）✅
- T0：一键分类按钮（含路径安全校验）
- T1：文件打开功能（shell.openPath）
- T2：SummaryCards真实数据
- T3：StageNav Bug修复（custom_stages加载）
- T4：错误处理（ErrorBoundary + notification）
- T5：空状态组件
- T6：AI对话加载状态 + 取消
- 快速启动脚本（start-dev.bat）

### 第三轮（高级功能）✅
- TD：技术债修复（7项）
- FB：前后端一致性修复（3项）
- AI：多AI供应商支持（11家厂商）
- ST：阶段推进（文件触发+手动）
- BT：批量操作（分类/删除）
- ROLE：用户角色预留
- CH：对话记录保存（session_id分组）
- PG：项目进度Timeline + 里程碑
- SG：签字识别（PDF→图→多模态AI）
- KI：关键信息提取（双写）
- UX+CQ：体验优化 + 代码质量

### 第四轮（加固+质量）✅
**P0（5项）**：编译错误修复、Electron安全加固、数据库性能优化、组件拆分、API Key加密
**P1（10项）**：IPC校验、前后端边界、错误处理、Prompt外部化、React性能、上传优化、死代码清理
**P2（7项）**：依赖清理、数据库备份、electron-builder、重复代码、CSS变量、Prettier

### 第五轮（评审修复）✅
- S5：API Key safeStorage加密
- S4：CSP生产环境加固
- M3：Electron安全加固
- M6：xlsx→exceljs替换
- S9：ChatWindow竞态条件修复
- S10：批量操作取消机制
- M4/M21/M22/M15/M13/M9/S11：质量/UX修复

### 评审v1-cn修复（2026-06-13）✅
**13项全部修复并验证（typecheck+lint通过）：**
1. H1：preload sessionId转发
2. H2：clear-history会话级作用域（preload+handler+service+UI四点联动）
3. H3：settings白名单 user_role + custom_stages
4. H4：Prompt编辑器 form.setFieldsValue
5. H5：会话标题改用 MIN(id) 子查询
6. H6：FileExtractor extractionSettings参数
7. B1：index.html创建
8. L1：StyleTest DEV守卫
9. L2：去除 id! 断言
10. M5：signature-detector 改用 OffscreenCanvas
11. 配置文件：vitest.config.ts、tsconfig.node.json、.gitignore

### 分类阶段恢复（2026-06-13）✅
- STAGE_STYLE：11个分类阶段配色（与设计规范 §1.4 一致）
- StageSidebar：11个阶段+图标+计数
- FileListTable：下拉10个分类选项
- 新增 PROJECT_STAGE_STYLE：区分项目阶段和分类阶段

---

## 当前状态（2026-06-13）

| 项目 | 状态 |
|------|------|
| 代码编译 | ✅ electron:compile + tsc --noEmit 通过 |
| 评审材料 | ✅ 需求v2 + 评审指南v2 已放桌面 |
| 评审包 | ✅ project-manager-review-v2.zip 已打包 |
| 待办 | 评审方按最新代码评审 → 根据结果修复 → 新增需求NF-01~NF-06 |

---

## 需求缺口（待实现）

### P0 — 用户明确要求
- **NF-01 自定义项目存储路径**：用户希望项目文件放D盘等自定义位置

### P1 — 评审/功能完善
- NF-02 AI回复Markdown渲染
- NF-03 对话上下文文件选择面板
- NF-04 项目名称/分类方式编辑
- NF-05 角色差异化Prompt
- NF-06 手动分类文件物理移动

### 设计规范偏差（待确认）
- 上传区域高度：80px vs 规范160px
- 卡片默认阴影：无 vs 规范shadow-sm
- 空状态颜色：#111827 vs 规范#6B7280
- 对话窗口：缺少右侧文件上下文面板（240px）
- StageSidebar字体：13px不在规范字体层级中
