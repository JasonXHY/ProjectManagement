# PMAer 启动崩溃问题排查文档

**日期**：2026-06-17
**报告人**：用户
**现象**：上午测试时启动软件，等待一段时间后崩溃，无法正常测试

---

## 1. 环境信息

| 项目 | 值 |
|------|-----|
| Electron版本 | 42.3.3 |
| Node.js | - |
| 操作系统 | Windows |
| 分支 | main |
| 最新commit | 7bc07ae |

## 2. 今日代码变更（可能相关）

| Commit | 变更内容 |
|--------|----------|
| 83b7014 | fix: custom_stages旧值检测 + 子分类50字符长度限制 |
| c973011 | feat(P1): signature_status字段 + AI返回字段完整保存 + 移除内容截断 |
| 3f75c51 | feat(P1): UI适配 + .doc旧格式支持 |
| 7bc07ae | fix: TypeScript类型修复 + word-extractor类型声明 |

### 变更文件清单

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| electron/database/index.ts | 修改 | 新增signature_status/ai_summary/ai_key_info字段+迁移 |
| electron/database/files.ts | 修改 | FileRecord接口+createFile函数 |
| electron/ipc/ai-handlers.ts | 修改 | 分类时保存AI结果到数据库 |
| electron/ipc/file-handlers.ts | 修改 | 分类时保存AI结果 |
| electron/services/file-extractor.ts | 修改 | 新增.doc格式支持(word-extractor) |
| src/components/ProjectHome/FileListTable.tsx | 修改 | signature_status显示+AI摘要tooltip |
| src/types/index.ts | 修改 | FileRecord类型新增字段 |
| package.json | 修改 | 新增word-extractor依赖 |

## 3. 已知排查结果

### 3.1 Electron沙箱错误

**控制台输出**：
```
Electron sandboxed_renderer.bundle.js script failed to run
TypeError: Cannot destructure property 'preloadScripts' of 'binding.startupData' as it is null
```

**分析**：
- 这是Electron框架层面的错误
- 与应用代码无直接关系
- 可能是Electron 42.3.3的已知问题

### 3.2 图标文件缺失

**控制台输出**：
```
Failed to load image from path 'C:\NewProject\electron\build\icon.ico'
```

**分析**：
- electron/build/icon.ico 不存在
- 不会导致崩溃，仅警告

### 3.3 TypeScript编译

- 主进程编译：通过
- 前端类型检查：通过
- 测试：167/167 全通过

### 3.4 数据库迁移

新增3个字段的迁移代码已添加，使用try-catch处理字段已存在的情况：
```typescript
// 迁移：为 files 表添加 signature_status 字段
try {
  db.run(`ALTER TABLE files ADD COLUMN signature_status TEXT DEFAULT 'unsigned'`)
  saveDatabase()
} catch {
  // 字段已存在，忽略
}
```

## 4. 怀疑方向

1. **Electron 42.3.3 沙箱问题**：可能是该版本的已知bug
2. **新增依赖word-extractor**：可能与Electron环境有冲突
3. **数据库迁移**：旧数据库升级时可能有问题
4. **预加载脚本**：preload.js的加载方式可能有问题

## 5. 需要协助排查

1. 确认Electron 42.3.3是否有已知的沙箱崩溃问题
2. 检查word-extractor依赖是否与Electron兼容
3. 检查preload.ts的配置是否正确
4. 是否需要降级Electron版本

## 6. 复现步骤

1. `npm install`
2. `npm run electron:dev`
3. 等待应用启动
4. 等待一段时间后崩溃

---

**相关文件**：
- electron/main.ts
- electron/preload.ts
- electron/database/index.ts
- electron/services/file-extractor.ts

---

## 7. Qoder 二次排查意见

> 审核人：Qoder
> 日期：2026-06-17

### 7.1 对 MiMo 原始结论的评估

MiMo 将崩溃归因于 **Electron 42.3.3 沙箱问题**（§3.1），并建议"是否需要降级 Electron 版本"。

**该结论不成立**，理由如下：

1. 用户明确反馈"昨天同版本下可正常测试"，说明 Electron 42.3.3 本身并非崩溃根因。
2. `preload.ts` 和 `main.ts` 在今天的 4 个 commit 中**没有任何改动**，preload 路径配置正确（`path.join(__dirname, 'preload.js')` → `electron/dist/preload.js`），且编译输出已验证存在。
3. sandboxed_renderer 错误是一个 Electron 已知的**间歇性控制台警告**，在 sandbox:true 模式下偶发出现，但不会直接导致崩溃。MiMo 把症状当成了病因。

### 7.2 真正的崩溃嫌疑分析

通过 `git diff 8f33aa5..7bc07ae` 确认，今天的 4 个 commit 修改了以下关键文件：

| 文件 | 变更 | 风险等级 |
|------|------|---------|
| `electron/database/index.ts` | 新增 3 个 ALTER TABLE 迁移（signature_status, ai_summary, ai_key_info） | **中** |
| `electron/services/file-extractor.ts` | 新增 `import WordExtractor from 'word-extractor'` 模块级导入 | **高** |
| `electron/ipc/file-handlers.ts` | AI分类结果保存时写入新字段 | 低 |
| `electron/ipc/ai-handlers.ts` | 移除内容截断（2000字符限制） | 低 |
| `package.json` | 新增 word-extractor 依赖 | 低 |

#### 嫌疑一（高）：word-extractor 模块级导入

`file-extractor.ts` 第 4 行新增了 `import WordExtractor from 'word-extractor'`，这是一个**模块级导入**，意味着：

- Electron 主进程启动时，加载 `file-extractor.ts` 就会立即执行 `require('word-extractor')`
- word-extractor v1.0.4 依赖 `yauzl`（ZIP解析库）和 `saxes`（XML解析器），它们会在 require 时初始化内部状态
- 如果 `word-extractor` 或其子依赖在当前 Node.js/Electron 环境下有兼容性问题（例如 Buffer API 变化），**主进程加载阶段就会失败**

**验证方法**：
```bash
# 在终端单独测试 word-extractor 能否正常加载
cd C:\NewProject
node -e "const WE = require('word-extractor'); console.log('OK:', typeof WE)"
```

如果输出错误，说明 word-extractor 在当前环境无法加载，这就是崩溃原因。

**修复方案**：将 `import WordExtractor` 改为**动态导入**（lazy loading），仅在真正需要处理 .doc 文件时才加载：

```typescript
// file-extractor.ts 中删除顶部的 import
// import WordExtractor from 'word-extractor'  ← 删除

// 在 extractWord 方法中改为动态导入
private static async extractWord(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.doc') {
    const { default: WordExtractor } = await import('word-extractor')
    const extractor = new WordExtractor()
    const doc = await extractor.extract(filePath)
    return doc.getText()
  }
  // .docx 用 mammoth...
}
```

#### 嫌疑二（中）：数据库迁移链式写入

`initDatabase()` 中新增了 3 个 `ALTER TABLE` + `saveDatabase()` 调用（第 174-194 行）。对于已有数据库：

- 每个 ALTER TABLE 成功后立即调用 `saveDatabase()` 写磁盘
- `saveDatabase()` 是异步队列化的（`saveQueue.then(...)`），但 `initDatabase()` 没有 await 这些 save
- 如果数据库文件较大（已有大量数据），连续 3 次 ALTER TABLE + 3 次 save 可能导致启动延迟
- 极端情况下，`app.whenReady()` 中的 `await initDatabase()` 完成后，save 队列仍在执行，后续操作可能读到不一致状态

**但这不太可能导致"崩溃"**，更可能导致数据不一致。暂列为次要嫌疑。

#### 嫌疑三（低）：移除内容截断

`ai-handlers.ts` 和 `file-handlers.ts` 中移除了 `.substring(0, 2000)` 的内容截断：

```typescript
// 之前
const classifyPrompt = promptTemplate.replace(/\{content\}/g, contentExtracted.substring(0, 2000))
// 之后
const classifyPrompt = promptTemplate.replace(/\{content\}/g, contentExtracted)
```

如果上传了一个非常大的文件（例如 10MB 的文本），整个文件内容会被拼入 AI Prompt 字符串。这可能导致：
- 内存暴涨（字符串拼接创建巨大字符串）
- AI API 请求超时或返回错误

但这发生在分类操作时，不在启动阶段，与"启动后崩溃"的时间线不完全匹配。

### 7.3 建议排查步骤

1. **首先验证 word-extractor**：
   ```bash
   cd C:\NewProject
   node -e "const WE = require('word-extractor'); console.log('word-extractor loaded OK')"
   ```
   如果报错 → 确认是嫌疑一，按修复方案改为动态导入。

2. **临时注释 word-extractor 导入**：
   在 `electron/services/file-extractor.ts` 中临时注释掉第 4 行 `import WordExtractor`，并将 `.doc` 处理改为返回 null。重启应用看是否恢复正常。

3. **检查完整控制台日志**：
   启动应用后查看完整的 Electron 主进程控制台输出（不是 DevTools），找到 sandbox 错误之外是否还有其他错误信息，特别是：
   - `Error: Cannot find module 'word-extractor'`
   - `Uncaught Exception`
   - `Unhandled Rejection`

4. **检查 npm install 是否完整**：
   ```bash
   cd C:\NewProject
   npm ls word-extractor
   ```
   确认 word-extractor 及其子依赖（saxes, yauzl）完整安装。

### 7.4 总结

| 项目 | MiMo 结论 | Qoder 评估 |
|------|----------|-----------|
| Electron 42.3.3 版本问题 | 是 | **不是** — 同版本昨天正常 |
| word-extractor 兼容性 | 列为嫌疑但未深入 | **高度嫌疑** — 新增模块级导入，启动时即加载 |
| preload 配置问题 | 列为嫌疑 | **排除** — preload 代码和路径均未变更 |
| 数据库迁移 | 列为嫌疑 | **次要嫌疑** — 有 try-catch 保护，不太可能崩溃 |

**最终建议**：优先将 `word-extractor` 改为动态导入（lazy import），消除启动时的模块加载风险。这是最可能的崩溃原因，且修复成本极低。
