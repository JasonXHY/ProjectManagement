# 技术发现

> 最后更新：2026-06-13

---

## 环境相关

### Windows PowerShell 命令
- `mkdir -p` 不支持，使用 `New-Item -ItemType Directory -Force -Path`
- `Copy-Item` 到已存在子目录会失败，需先检查或使用 `Move-Item`
- 跨目录移动文件建议使用 `Copy-Item` + `Remove-Item` 组合

### Electron开发
- Vite dev server在Electron中正常工作，端口1234
- `electron:dev` 脚本：concurrently启动Vite + Electron
- `start-dev.bat`：双击即可启动（含TypeScript编译）
- `start-dev-quick.bat`：跳过编译的快速启动

---

## 数据库相关

### sql.js注意事项
- sql.js是同步操作，但fs.writeFileSync从IPC handler调用可能交错
- Promise链序列化：`saveQueue = saveQueue.then(() => { ... })`
- `saveDatabase()`每次调用都序列化整个数据库写磁盘
- 批量操作用`beginBatch()/endBatch()`跳过自动保存

### 迁移模式
- `CREATE TABLE IF NOT EXISTS`不修改已有表结构
- 新增列用 `ALTER TABLE ... ADD COLUMN` + try/catch（列已存在则忽略）
- 示例：`database/index.ts:80` 添加session_id列迁移

### 索引
- `idx_chat_project_session ON chat_messages(project_id, session_id)`
- `idx_files_project ON files(project_id)`
- `idx_files_category ON files(project_id, category)`

---

## AI服务相关

### OpenAI兼容协议
- 所有厂商走OpenAI兼容协议，通过base_url + chatPath区分
- `getProviderById(id)` 和 `getFullApiUrl(id)` 在 `shared/model-registry.ts`
- 通用Provider：`electron/services/ai-service.ts` 中的 `OpenAICompatibleProvider`

### safeStorage加密
- `electron.safeStorage.encryptString(value)` 返回Buffer，可base64编码存SQLite
- `electron.safeStorage.decryptString(buf)` 接受Buffer返回明文
- 迁移策略：读取时检测非base64格式 → 加密 → 回写
- API Key字段：ai_api_key、classify_api_key、zhipu_api_key、mimo_api_key

---

## 前端相关

### Tailwind v4兼容
- `@tailwindcss/vite` 插件支持v3风格config文件
- CSS入口使用 `@import "tailwindcss"` 而非旧版 `@tailwind base/components/utilities`
- `tailwind.config.ts` 中的content/theme/plugins配置均兼容

### AntD Form竞态
- `initialValue` 仅首渲染生效，异步数据到达后form不会更新
- 修复：异步加载完成后调用 `form.setFieldsValue()`
- 示例：SettingsPage.tsx prompts加载

### 组件拆分模式
- 大型组件可按 styles→hooks→子组件→主文件 组合拆分
- ProjectHome.tsx 1204行成功拆分为144行主文件+7个子组件
- 自定义Hook承载所有状态+业务逻辑

---

## 踩坑记录

### DEFAULT_STAGES vs 分类阶段
- `DEFAULT_STAGES = ['售前', '进行中', '关闭']` 是项目级别阶段（project status）
- 设计规范的11个阶段是分类阶段（classification）
- 两个是独立概念，不要混淆

### H2修复需要四点联动
- preload.ts（forward sessionId）
- ai-handlers.ts（WHERE加AND session_id=?）
- aiService.ts（pass sessionId）
- ChatWindow.tsx（pass currentSessionId）
- 只改一处会导致前后端参数不匹配

### 签字检测方案演变
- 原方案：pdfjs-dist getOperatorList（准确率60-70%，无法处理扫描件）
- 中间方案：Electron隐藏BrowserWindow渲染+截图（有安全风险）
- 当前方案：FileExtractor.pdfToImage + OffscreenCanvas（无额外依赖）
