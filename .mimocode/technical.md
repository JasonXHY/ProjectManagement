# 技术发现

> 最后更新：2026-06-30

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
- 修改 `electron/` 目录下的TypeScript后，必须在 `electron/` 目录执行 `npx tsc` 重新编译

---

## 数据库相关

### sql.js注意事项
- sql.js是同步操作，但fs.writeFileSync从IPC handler调用可能交错
- **metadata-queue**：`electron/utils/metadata-queue.ts`，所有metadata写入通过 `enqueueMetadataWrite` 串行化
- `saveDatabase()`每次调用都序列化整个数据库写磁盘
- 批量操作用`beginBatch()/endBatch()`跳过自动保存

### 迁移模式
- `CREATE TABLE IF NOT EXISTS`不修改已有表结构
- 新增列用 `ALTER TABLE ... ADD COLUMN` + try/catch（列已存在则忽略）
- folder_uuid列迁移：自动为缺少 `folder_uuid` 的旧项目生成UUID

---

## AI服务相关

### OpenAI兼容协议
- 所有厂商走OpenAI兼容协议，通过base_url + chatPath区分
- 通用Provider：`electron/services/ai-service.ts` 中的 `OpenAICompatibleProvider`

### safeStorage加密
- API Key在本地SQLite中明文存储（桌面本地应用安全风险可控）
- safeStorage加密链断裂，已移除加密方案

### AI内容截断
- 已移除所有 `substring()` 截断，全量发送文件内容给AI
- 当前支持的AI模型上下文窗口均≥128K

---

## 前端相关

### Tailwind v4兼容
- `@tailwindcss/vite` 插件支持v3风格config文件
- CSS入口使用 `@import "tailwindcss"`

### Ant Design 6 迁移发现
- `Space` `direction` prop deprecated — use `orientation`
- Button CJK text has internal space — 测试用 regex `/测\s*算/`
- `CheckboxValueType` removed — use `(string | number | boolean)[]`
- `Spin` `tip` renamed to `description`
- `Input` `addonAfter` deprecated — use `Space.Compact`

### 组件拆分模式
- styles → hooks → 子组件 → 主文件组合
- ProjectHome.tsx 1204行 → 144行主文件 + 7个子组件

---

## 踩坑记录

### UUID文件夹标识方案（D52）
- 文件夹名：仅 `{sanitized_name}`（无编号）
- 数据库新增 `folder_uuid` 字段
- `resolveProjectPath` 4级fallback：UUID→scan .uuid→旧 _${id} 后缀→名称匹配

### metadata竞态修复
- 5个handler并发写入metadata导致数据丢失
- 新建 `electron/utils/metadata-queue.ts`，串行化所有写入

### 360拦截electron二进制
- 360企业版在v0.1.2到v0.2.0之间更新了监控规则
- 新规则拦截electron二进制文件解压
- 非目录位置问题，非electron版本问题

### 构建相关
- CSC_IDENTITY_AUTO_DISCOVERY=false 跳过代码签名
- NODE_TLS_REJECT_UNAUTHORIZED=0 绕过SSL证书问题
- build/目录不打入asar，运行时图标需通过 extraResources 分发
