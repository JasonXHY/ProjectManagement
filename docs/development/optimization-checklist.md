# 待办优化清单 v6.0

> 创建时间：2026-06-11
> 更新时间：2026-06-12
> 创建人：MiMoCode
> 状态：第三轮已完成，第四轮计划已制定，用户决策已确认

---

## 一、第三轮已完成任务

| 编号 | 任务 | 状态 |
|------|------|------|
| TD | 技术债修复（7项） | ✅ 完成 |
| FB | 前后端一致性修复（3项） | ✅ 完成 |
| AI | 多AI供应商支持（11家厂商） | ✅ 完成 |
| ST | 阶段推进+文件分类联动 | ✅ 完成 |
| BT | 批量操作+文件分类优化 | ✅ 完成 |
| ROLE | 用户角色设置预留 | ✅ 完成 |
| CH | 对话记录保存 | ✅ 完成 |
| PG | 项目进度卡片（甘特图+星星） | ✅ 完成 |
| SG | 签字文件识别 | ✅ 完成 |
| KI | 关键信息自动提取卡片 | ✅ 完成 |
| UX+CQ | 用户体验优化+代码质量 | ✅ 完成 |

---

## 二、用户决策变更（需额外修改）

| 编号 | 变更内容 | 原方案 | 新方案 | 影响范围 |
|------|----------|--------|--------|----------|
| C1 | 阶段推进触发 | 关键词匹配 | AI分类时大模型判断 | ST规格书、ai-handlers.ts |
| C2 | 对话分组 | session_id自动分组 | 每个项目独立会话窗口 | CH规格书、ChatWindow.tsx、数据库 |
| C3 | 进度卡片显示 | 百分比 | 项目状态 | PG规格书、ProjectGantt.tsx |
| C4 | Prompt管理 | 后端集中管理 | 支持用户自定义 | ai-handlers.ts、SettingsPage.tsx |
| C5 | 签字检测方案 | pdfjs-dist getOperatorList | Electron渲染+截图 | SG规格书、signature-detector.ts |
| C6 | 对话功能排查 | 无 | 排查现有代码改动需求 | 需新增排查任务 |

---

## 三、第四轮优化待办（28项，12-15人天）

### P0 必须立即修复（5项，4天）

| 编号 | 问题 | 优先级 |
|------|------|--------|
| 1 | 编译级错误修复（ChatWindow.tsx、ProjectHome.tsx） | 🔴 崩溃 |
| 2 | Electron安全加固（CSP、sandbox、全局异常捕获） | 🔴 高危 |
| 3 | 数据库性能优化（索引、外键、批量写入） | 🔴 高危 |
| 4 | 组件拆分（ProjectHome.tsx 1203行→200行） | 🔴 架构 |
| 5 | API Key加密存储（safeStorage） | 🔴 高危 |

### P1 应该修复（10项，5天）

| 编号 | 问题 |
|------|------|
| 6 | IPC参数验证 + settings白名单 |
| 7 | 前后端边界修复（model-registry移至共享模块） |
| 8 | 错误处理统一（AppError类型、统一格式） |
| 9 | Prompt外部化（支持用户自定义，预留对话修正按钮） |
| 10 | React性能优化（memo/useMemo/useCallback） |
| 11 | window.location.reload()替换 |
| 12 | 大文件上传优化 |
| 13 | 死代码清理 |
| 14 | 数据库外键和孤儿记录 |
| 15 | windowApi类型重复声明 |

### P2 可以改进（8项，4天）

| 编号 | 问题 |
|------|------|
| 16 | 虚拟滚动 |
| 17 | 状态管理（Zustand） |
| 18 | CSS变量统一 |
| 19 | 清理冗余依赖（Tauri包、未使用包） |
| 20 | 重复代码清理 |
| 21 | 硬编码数据清理 |
| 22 | 数据库写入备份 |
| 23 | electron-builder配置 |

### P3 锦上添花（5项，2天）

| 编号 | 问题 |
|------|------|
| 24 | Prettier配置 |
| 25 | 结构化日志 |
| 26 | 性能测试 |
| 27 | 文档完善 |
| 28 | SettingsPage阶段持久化 |

---

## 四、规格书待更新

以下规格书需根据用户决策更新：
1. `ST-stage-progression.md` — 触发逻辑从关键词改为AI判断
2. `CH-chat-history.md` — 从session_id改为项目独立会话
3. `PG-project-progress.md` — 百分比改为状态显示
4. `SG-signature-detection.md` — 从getOperatorList改为Electron渲染
5. 新增：对话功能排查任务

---

## 五、效果图和方案文档

- `docs/mockups/gantt-option-a.html` — 进度卡片方案A（用户已选）
- `docs/mockups/gantt-option-b.html` — 进度卡片方案B
- `docs/mockups/gantt-option-c.html` — 进度卡片方案C
- `docs/mockups/signature-detection-analysis.md` — 签字检测方案分析
