# 变更记录

> 本文档记录所有需求、设计、代码变更，标注更新人和时间

---

## v0.2.0 体验深化版本（2026-06-22 MiMoCode）

### 规划目标
1. 详情页卡片系统 — 按项目阶段差异化展示关键信息
2. 项目转交功能 — 支持整体打包和AI辅助选择性转交
3. Markdown预览 — 统一渲染能力，提升文档查看体验

### 设计变更
- 详情页统计行：文件数量 + 里程碑 + 待处理 + AI摘要
- 特色卡片系统：侧边栏驱动，售前/进行中/关闭三组
- 里程碑展示：不使用进度比例，显示下一步节点
- 首页卡片简化：移除里程碑时间轴，右上角阶段标签
- 转交包格式：.pmaer.zip（ZIP压缩包）
- 转交模式：整体转交 + 协作转交（AI智能选择文件）

### 文档新增
- `docs/development/v0.2.0-design.md` — 设计文档
- `docs/development/v0.2.0-dev-guide.md` — 开发指南
- `docs/requirements/v0.2.0-requirements.md` — 需求文档
- `docs/v0.2.0-plan-final.md` — 版本规划终稿（Qoder审核）
- `docs/design/ui-design-spec.md` v1.1 — UI设计规范更新
- `.qoderwork/mockups/04-card-system-v020.html` — 卡片系统Mockup

### 测试
- 183个测试全通过
- TypeScript编译通过

---

## v0.1.2 首版内部发版（2026-06-18 MiMoCode）

### 发版说明
首个内部验证版本，安装包分发给同事体验测试。

### Bug修复（7项）
1. **手动推进阶段修复** — DB旧阶段值自动迁移（启动/需求→进行中，转客户成功→关闭）+ console.warn调试日志
2. **自动推进闭包过期** — file-handlers.ts .then()中重新getProject()获取最新阶段
3. **侧边栏文件数归0** — loadFiles移除selectedCategory依赖，files改用useMemo客户端过滤
4. **上传区域高度过大** — minHeight 100→64px, maxHeight 80px, 图标缩小, 去掉多余格式标签
5. **API Key不可修改** — ai_key_source加入白名单 + "使用自己的Key"按钮 + 移除防复制拦截
6. **Prompt显示旧版** — 后端settings:resetPrompts删除旧值 + UI添加"恢复默认"按钮
7. **Invalid Date** — time.ts统一处理SQLite格式和ISO格式日期

### 功能新增
- 项目阶段自动推进：文件上传后AI判断阶段变化，弹窗确认推进
- 隐藏Electron菜单栏（autoHideMenuBar）
- 安装向导使用专用横幅图（164x314），提升清晰度
- 生成用户操作手册（docs/用户操作手册-PMAer.md）

### 打包配置
- NSIS安装包：PMAer-0.1.0-Setup.exe（148MB）
- 文件存储默认路径改为安装目录/projects（便携模式）
- 图标资源通过extraResources随包分发
- electron-builder.yml更新：ICO重新生成 + header使用专用PNG

### 测试
- 183个测试全通过
- TypeScript编译通过
- 安装包构建验证通过

---

## 2026-06-11 MiMoCode — UI调整需求记录

### 需求来源：用户反馈（项目详情页验证）

#### 1. 拖拽上传区域过大

**当前状态**：
- `minHeight: 160px`
- 图标 `fontSize: 48px`
- 内边距 `padding: 24px`

**期望调整**：
- 降低最小高度（建议 100-120px）
- 图标适当缩小
- 整体更紧凑

**代码位置**：`src/components/ProjectHome/ProjectHome.tsx` 第 645-694 行

---

#### 2. 增加"一键分类"按钮

**需求描述**：
- 位置：文件列表上方，"打开文件夹"和"刷新"按钮同一行
- 功能：对所有未分类的文件批量触发AI分类
- 逻辑：已分类的文件不重复触发

**当前状态**：
- 文件列表上方有"打开文件夹"和"刷新"两个按钮
- 每个文件有单独的"AI分类"按钮

**期望效果**：
```
[打开文件夹] [刷新] [一键分类(3)]
                ↑ 未分类文件数量
```

**代码位置**：`src/components/ProjectHome/ProjectHome.tsx` 第 698-723 行

---

## 更新记录

| 日期 | 更新人 | 内容 |
|------|--------|------|
| 2026-06-11 | MiMoCode | 记录用户UI调整需求 |
| 2026-06-11 | MiMoCode | 拖拽区域高度从160px改为80px |
| 2026-06-11 | MiMoCode | 搭建Vitest测试框架和ESLint配置 |
| 2026-06-11 | MiMoCode | 创建公共模板库（测试+ESLint），记录到全局记忆 |
| 2026-06-11 | MiMoCode | 完成第二轮方案审核，用户确认决策点 |
| 2026-06-11 | QoderWork | 提交第二轮优化方案 |
| 2026-06-11 | MiMoCode | T0 一键分类按钮完成（后端文件移动逻辑 + 前端按钮） |
| 2026-06-11 | MiMoCode | T3 StageNav Bug修复：支持自定义阶段显示 |
| 2026-06-11 | MiMoCode | T0安全修复：路径穿越漏洞（category校验） |
| 2026-06-11 | MiMoCode | T1 文件打开功能：新增file:open IPC + 前端打开按钮 |
| 2026-06-11 | MiMoCode | 第一阶段严重BUG修复：file:open变量引用 + require改为import |
| 2026-06-11 | MiMoCode | T2 SummaryCards真实数据：关键问题显示—，待处理显示未分析数量 |
| 2026-06-11 | MiMoCode | T4 错误处理：notification.ts + ErrorBoundary组件 |
| 2026-06-11 | MiMoCode | 第二阶段审核修复：stageItems动态计数 + 摘要按钮实现 |
| 2026-06-11 | MiMoCode | T5 空状态组件：EmptyState + 文件列表空状态 |
| 2026-06-11 | MiMoCode | 快速启动脚本：start-dev.bat + start-dev-quick.bat |
| 2026-06-11 | MiMoCode | 第三阶段审核通过（7.8/10），根据建议优化启动脚本 |
| 2026-06-11 | MiMoCode | 项目文件架构整理方案设计完成，待用户确认后执行 |
| 2026-06-11 | MiMoCode | 项目文件审计完成（155个源文件，144+构建产物） |
| 2026-06-11 | MiMoCode | 文件架构整理执行完成（归档+文档整合+README重写） |
| 2026-06-11 | MiMoCode | 全面盘点完成：技术债7项+前后端一致性3项+千问3项+业务优化5项+体验5项+代码质量3项 |
| 2026-06-11 | MiMoCode | 子agent评估：技术审查(2个)+PM视角评估(1个)+可行性评估(1个) |
| 2026-06-11 | 用户 | 确认所有优化方案：11家AI供应商、文件触发式阶段推进、删除smart类型、用户角色预留、对话保存、甘特图+签字识别+关键信息提取、批量操作、3种状态筛选 |
| 2026-06-11 | MiMoCode | 规格书编写完成：11份任务规格书 + 方法论 |
| 2026-06-11 | MiMoCode | 双审机制完成：程序员审核(4份需修改)+架构师审核(全部通过) |
| 2026-06-11 | MiMoCode | 规格书根据审核意见更新：百度URL、加密方案、session_id、ALTER TABLE等 |
| 2026-06-11 | MiMoCode | TD技术债修复完成：7项全部修复，lint通过 |
| 2026-06-11 | MiMoCode | FB前后端一致性修复完成：3项全部修复，lint通过 |
| 2026-06-11 | MiMoCode | ROLE用户角色预留完成：类型定义+设置页+Prompt动态化 |
| 2026-06-11 | MiMoCode | AI多AI供应商完成：11家厂商+通用Provider+设置页UI |
| 2026-06-11 | MiMoCode | BT批量操作完成：复选框+批量分类/删除+阶段下拉+IPC进度 |
| 2026-06-11 | MiMoCode | CH对话记录保存完成：session_id分组+历史列表+会话切换 |
| 2026-06-11 | MiMoCode | ST阶段推进完成：3阶段简化+触发式弹窗+手动按钮+数据迁移 |
| 2026-06-11 | MiMoCode | KI关键信息提取完成：AI提取+双写+ProjectInfoCard组件 |
| 2026-06-11 | MiMoCode | SG签字识别完成：PDF转图片+多模态AI检测+UI标记 |
| 2026-06-11 | MiMoCode | PG项目进度卡片完成：Timeline甘特图+星星标记+AI里程碑提取 |
| 2026-06-11 | MiMoCode | UX+CQ体验优化+代码质量完成：自动刷新+摘要数据+导入清理+自定义阶段 |
| 2026-06-11 | MiMoCode | Plan模式审查完成：项目规划、需求管理、风险控制、资源协调四个角度 |
| 2026-06-11 | MiMoCode | Title模式审查完成：代码质量、架构设计、最佳实践、可维护性、安全五个角度 |
| 2026-06-11 | MiMoCode | 优化清单更新至v5.0：全部任务完成，审查发现9项待改进 |
| 2026-06-12 | MiMoCode | 深度审查完成：三路子agent审查发现28项新问题，更新计划至28项 |
| 2026-06-12 | 用户 | 确认决策19-23：AI判断阶段推进、项目独立会话、Timeline进度卡片、用户自定义Prompt、Electron渲染签字检测 |
| 2026-06-12 | MiMoCode | 制作进度卡片效果图3个（docs/mockups/）和签字检测方案分析文档 |
| 2026-06-12 | MiMoCode | Phase1-P0完成：编译错误修复+Electron安全(CSP/sandbox)+数据库优化(索引/外键/批量写入)+API Key加密 |
| 2026-06-12 | MiMoCode | Phase2-P0完成：组件拆分ProjectHome.tsx 1204行→144行，8个子组件 |
| 2026-06-12 | MiMoCode | Phase3-P1完成：IPC验证+前后端边界修复+错误处理统一+Prompt外部化+React性能优化+死代码清理 |
| 2026-06-12 | MiMoCode | Phase4用户决策变更完成：AI判断阶段+项目独立会话+状态显示+用户自定义Prompt+Electron渲染签字检测 |
| 2026-06-12 | MiMoCode | Phase5-P2完成：清理冗余依赖+硬编码清理+数据库备份+reload替换+electron-builder配置 |
| 2026-06-12 | MiMoCode | 全面代码审查完成：发现2严重+8中等+4低优先级问题 |
| 2026-06-12 | MiMoCode | 严重问题修复：preload sessionId参数+SignatureDetector资源销毁+file:delete错误返回+stack泄露+conversations表引用 |
| 2026-06-12 | MiMoCode | P2+P3完成：重复代码清理+CSS变量+Prettier+结构化日志+阶段持久化+文档 |
| 2026-06-12 | MiMoCode | 方法论更新：新增代码审查检查清单（安全/错误处理/性能/质量/架构/Electron） |
| 2026-06-12 | QoderWork | 代码审查反馈：发现47项问题（11严重+22中等+14低） |
| 2026-06-12 | MiMoCode | 修复12项确认问题：S1-S3功能Bug+M1/M2/M5/M11/M12/M18/M19/M20代码质量+L1/L12 |
| 2026-06-12 | MiMoCode | 反馈文档：docs/qoderwork-review-response.md（已修复12项+需讨论10项+延后25项） |
| 2026-06-12 | MiMoCode | 今日工作总结：第四轮优化全部完成+代码审查修复+方法论更新，明日继续讨论 |
| 2026-06-14 | MiMoCode | v10.5全部完成（22项）：UI修复+质量底座+P2功能+样式迁移+测试底座+文档更新，已推送到GitHub |
| 2026-06-14 | MiMoCode | 修复：项目详情页+对话页项目名称与标签同行显示（flex布局+文字截断） |
| 2026-06-15 | MiMoCode | 模型注册表全面更新：10家厂商模型更新+零一万物移除+接口扩展+文档建立 |
| 2026-06-15 | MiMoCode | PMAer v0.1.0内测版：应用重命名+内置小米MiMo V2.5 API Key+UI防复制+首次打开弹窗+负鼠图标 |
| 2026-06-15 | MiMoCode | 添加内测版说明文档：docs/beta-version-notes.md（特殊配置说明+未来更新计划） |
| 2026-06-16 | MiMoCode | v11.1：8项bug修复（缩进/preload categoryType/model-registry去重/阶段空状态/搜索空状态/hover位移/字体/CSS hover迁移+EmptyState颜色） |
| 2026-06-16 | MiMoCode | v11.2：首次启动两步引导+AI预检+设置页模型修复+分类fallback+操作按钮修复+需求文档v3.1+Qoder审核 |
| 2026-06-16 | MiMoCode | v11.3：API Key明文存储+MiMo URL修复+billing mode选择器+stage计数修复+自定义阶段→文件分类管理+79测试通过 |
