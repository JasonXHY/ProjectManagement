# 评审记录

> 最后更新：2026-06-13

---

## 评审v1-cn核实结果

**评审人**：Claude（独立工程师视角）
**核实日期**：2026-06-13
**位置**：`C:\Users\kingdee\Desktop\v1-cn.md`

### 确认真实问题（13项）— 全部已修复

| 编号 | 问题 | 修复文件 | 状态 |
|------|------|---------|------|
| H1 | preload丢弃sessionId | preload.ts:33 | ✅ |
| H2 | 清空对话清全部 | ai-handlers.ts:454 + preload.ts:35 + aiService.ts:24 + ChatWindow.tsx:200 | ✅ |
| H3 | user_role/custom_stages不在白名单 | settings-handlers.ts:9 | ✅ |
| H4 | Prompt编辑器initialValue竞态 | SettingsPage.tsx:85-88 | ✅ |
| H5 | MIN(content)字典序标题 | conversations.ts:51-64 | ✅ |
| H6 | FileExtractor忽略extraction设置 | file-extractor.ts:35 + file-handlers.ts:62-67 | ✅ |
| B1 | 缺少index.html | 新建index.html | ✅ |
| L1 | StyleTest生产可见 | App.tsx:312 | ✅ |
| L2 | selectedProject.id! | App.tsx:304 | ✅ |
| M5 | 签字检测隐藏窗口 | signature-detector.ts（重写） | ✅ |
| -- | 缺少vitest.config.ts | 新建 | ✅ |
| -- | 缺少tsconfig.node.json | 新建 | ✅ |
| -- | 缺少.gitignore | 新建 | ✅ |

### 评审误判（2项）— 不修复

| 编号 | 评审声称 | 实际情况 |
|------|---------|---------|
| B2 | ai-service.ts引入不存在的导出 | getProviderById/getFullApiUrl在model-registry.ts:147-155已存在 |
| -- | app无法运行 | dev模式下Vite自动生成index.html，已验证可运行 |

### 分类阶段恢复

- 设计规范定义11个分类阶段（售前/启动/需求/方案/构建/测试/上线/验收/转客户成功/关闭/未分类）
- 之前被简化为3个（售前/进行中/关闭），现已恢复
- 修改：StageSidebar.tsx、projectHome.styles.ts、FileListTable.tsx
- 注意：DEFAULT_STAGES=['售前','进行中','关闭']是项目级别阶段（project status），与分类阶段（classification）是独立概念

---

## 未修复的评审问题（需后续处理）

| 编号 | 问题 | 优先级 |
|------|------|--------|
| M1 | IPC校验样板代码（可引入声明式包装器） | P1 |
| M2 | IPC错误处理不一致（部分缺try/catch） | P1 |
| M3 | logger已定义未使用 | P1 |
| M4 | 类型/实现漂移（windowApi vs preload） | P1 |
| M7 | 重复代码（MD模板、Provider chat） | P2 |
| M8 | 上传后端无大小/类型校验 | P1 |
| M9 | resolveProjectPath脆弱且昂贵 | P2 |
| L3 | 空catch块 | P2 |
| L4 | 魔法数字 | P2 |
| L5 | getModelList类型any | P2 |
| L6 | tencent hunyuan-lite isFree标记 | P3 |
| L7 | ESLint规则不严格 | P2 |

---

## 非功能性需求差距

| 需求 | 状态 | 差距 |
|------|------|------|
| N01 API Key加密 | ✅ safeStorage已实现 | — |
| N02 文件大小限制 | ⚠️ | 后端应纵深防御 |
| N03 CSP/沙箱 | ⚠️ | 部分实现 |
| N04 并发写保护 | ✅ saveQueue已实现 | — |
| N05 用户体验 | ⚠️ | 缺Markdown渲染、文件上下文选择 |
| N06 数据持久化 | ✅ | — |

---

## 评审材料位置

- 桌面需求文档：`C:\Users\kingdee\Desktop\project-manager-requirements\`
  - `01-业务需求规格说明书-v2.md`
  - `02-评审指南-v2.md`
- 评审包：`C:\Users\kingdee\Desktop\project-manager-review-v2.zip`
