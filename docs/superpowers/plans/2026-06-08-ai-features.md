# AI功能落地方案实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 打通AI功能链路，实现文件内容提取、AI自动分类、对话历史持久化、文件夹结构优化和UI调整

**Architecture:** 采用Electron主进程处理文件提取和AI调用，前端通过IPC与后端通信，SQLite存储数据

**Tech Stack:** Electron 42, React 19, TypeScript, SQLite (sql.js), pdf-parse, mammoth, xlsx, MiMo API

---

## 文件结构

### 新增文件

| 文件 | 职责 |
|------|------|
| `electron/services/file-extractor.ts` | 文件内容提取服务（txt/pdf/word/excel） |

### 修改文件

| 文件 | 职责 |
|------|------|
| `electron/ipc/file-handlers.ts` | 文件上传、提取、分类流程 |
| `electron/ipc/project-handlers.ts` | 创建项目时创建文件夹 |
| `electron/ipc/ai-handlers.ts` | AI对话、分类、分析，保存对话记录 |
| `electron/ipc/settings-handlers.ts` | 设置读写（已存在） |
| `src/components/Chat/ChatWindow.tsx` | 对话窗口，加载历史 |
| `src/components/ProjectHome/ProjectHome.tsx` | 项目首页，拖拽区域优化 |
| `src/components/ProjectHome/SummaryCards.tsx` | 摘要卡片，添加AI分析按钮 |
| `electron/services/ai-providers/mimo.ts` | MiMo供应商（已修复） |
| `package.json` | 添加依赖 |

---

## Task 1: 安装依赖并创建文件提取服务

**Files:**
- Create: `electron/services/file-extractor.ts`
- Modify: `package.json`

- [ ] **Step 1: 安装依赖**

```bash
cd C:\NewProject
npm install pdf-parse mammoth xlsx
```

- [ ] **Step 2: 创建文件提取服务**

```typescript
// electron/services/file-extractor.ts
import * as fs from 'fs'
import * as path from 'path'
import mammoth from 'mammoth'
import * as XLSX from 'xlsx'

export class FileExtractor {
  /**
   * 提取文件内容
   * @param filePath 文件路径
   * @returns 提取的文本内容
   */
  static async extract(filePath: string): Promise<string | null> {
    const ext = path.extname(filePath).toLowerCase()

    try {
      switch (ext) {
        case '.txt':
        case '.md':
        case '.json':
          return await this.extractText(filePath)
        case '.pdf':
          return await this.extractPDF(filePath)
        case '.doc':
        case '.docx':
          return await this.extractWord(filePath)
        case '.xls':
        case '.xlsx':
          return await this.extractExcel(filePath)
        default:
          // 图片等需要云端OCR的文件，返回null
          return null
      }
    } catch (error) {
      console.error(`文件提取失败: ${filePath}`, error)
      return null
    }
  }

  /**
   * 提取文本文件内容
   */
  private static async extractText(filePath: string): Promise<string> {
    return fs.readFileSync(filePath, 'utf-8')
  }

  /**
   * 提取PDF内容
   */
  private static async extractPDF(filePath: string): Promise<string> {
    const pdfParse = require('pdf-parse')
    const buffer = fs.readFileSync(filePath)
    const data = await pdfParse(buffer)
    return data.text
  }

  /**
   * 提取Word文档内容
   */
  private static async extractWord(filePath: string): Promise<string> {
    const buffer = fs.readFileSync(filePath)
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }

  /**
   * 提取Excel内容
   */
  private static async extractExcel(filePath: string): Promise<string> {
    const buffer = fs.readFileSync(filePath)
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const allText: string[] = []

    workbook.SheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName]
      const text = XLSX.utils.sheet_to_csv(sheet)
      allText.push(`[${sheetName}]\n${text}`)
    })

    return allText.join('\n\n')
  }
}
```

- [ ] **Step 3: 测试文件提取（手动）**

创建测试文件并运行：
```bash
# 创建测试目录
mkdir -p C:\NewProject\test-files

# 创建测试文本文件
echo "这是一个测试文件" > C:\NewProject\test-files\test.txt
```

在Electron应用中测试：
```typescript
// 在主进程临时测试
const { FileExtractor } = require('./services/file-extractor')
const result = await FileExtractor.extract('C:\\NewProject\\test-files\\test.txt')
console.log(result) // 应输出：这是一个测试文件
```

- [ ] **Step 4: 提交**

```bash
git add electron/services/file-extractor.ts package.json package-lock.json
git commit -m "feat: 添加文件内容提取服务（txt/pdf/word/excel）"
```

---

## Task 2: 修改文件上传流程（集成提取服务）

**Files:**
- Modify: `electron/ipc/file-handlers.ts`

- [ ] **Step 1: 查看当前file-handlers.ts结构**

读取文件了解现有代码结构。

- [ ] **Step 2: 在file:upload中添加内容提取**

在 `file:upload` 处理器中，文件保存后调用 `FileExtractor.extract`：

```typescript
// 在 file:upload 处理器中，文件保存后添加：
import { FileExtractor } from '../services/file-extractor'

// 文件保存后，提取内容
const contentExtracted = await FileExtractor.extract(storedPath)

// 更新数据库中的 content_extracted 字段
db.run(
  'UPDATE files SET content_extracted = ? WHERE id = ?',
  [contentExtracted, fileId]
)
```

- [ ] **Step 3: 测试上传提取流程**

1. 启动应用：`npm run build && npx electron .`
2. 创建项目
3. 上传txt文件
4. 检查数据库中 content_extracted 字段是否有值

- [ ] **Step 4: 提交**

```bash
git add electron/ipc/file-handlers.ts
git commit -m "feat: 文件上传时自动提取内容"
```

---

## Task 3: 创建项目文件夹结构

**Files:**
- Modify: `electron/ipc/project-handlers.ts`

- [ ] **Step 1: 查看当前project-handlers.ts结构**

读取文件了解现有代码结构。

- [ ] **Step 2: 添加文件夹创建逻辑**

在 `project:create` 处理器中，创建项目后创建文件夹：

```typescript
import * as fs from 'fs'
import * as path from 'path'

// 默认11个阶段
const DEFAULT_STAGES = [
  '首页', '售前', '启动', '需求', '方案',
  '构建', '测试', '上线', '验收', '转客户成功', '关闭'
]

// 在 project:create 中，创建项目后添加：
const projectDir = path.join(projectsRoot, projectName)

// 创建项目根目录
if (!fs.existsSync(projectDir)) {
  fs.mkdirSync(projectDir, { recursive: true })
}

// 根据分类方式创建子文件夹
if (categoryType === 'stage') {
  // 按阶段分类：创建11个阶段文件夹
  for (const stage of DEFAULT_STAGES) {
    const stageDir = path.join(projectDir, stage)
    if (!fs.existsSync(stageDir)) {
      fs.mkdirSync(stageDir, { recursive: true })
    }
  }
}
// 按内容/智能分类时，文件夹由AI分类后动态创建
```

- [ ] **Step 3: 处理特殊字符**

```typescript
// 清理文件名中的特殊字符
function sanitizeFileName(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, '_')
}
```

- [ ] **Step 4: 测试文件夹创建**

1. 启动应用
2. 创建新项目
3. 检查文件系统中是否创建了11个阶段文件夹

- [ ] **Step 5: 提交**

```bash
git add electron/ipc/project-handlers.ts
git commit -m "feat: 创建项目时自动创建11个阶段文件夹"
```

---

## Task 4: AI自动分类流程

**Files:**
- Modify: `electron/ipc/file-handlers.ts`
- Modify: `electron/ipc/ai-handlers.ts`

- [ ] **Step 1: 查看当前分类逻辑**

读取 `ai:classify` 处理器的现有实现。

- [ ] **Step 2: 修改分类prompt支持11个阶段**

```typescript
const CLASSIFY_PROMPT_STAGES = `你是一个专业的文档分类专家。请根据以下文档内容，判断它属于哪个阶段：

阶段：
- 首页：项目总览、导航页面
- 售前：销售资料、客户沟通、报价单
- 启动：项目启动会、章程、团队组建
- 需求：需求文档、用户故事、用例
- 方案：技术方案、架构设计、选型
- 构建：开发文档、代码规范、接口定义
- 测试：测试用例、测试报告、缺陷
- 上线：部署文档、发布说明、运维
- 验收：验收标准、验收报告、签字
- 转客户成功：交接文档、培训资料、FAQ
- 关闭：项目总结、复盘、归档

文档内容：
{content}

请返回以下JSON格式：
{
  "category": "阶段名称",
  "confidence": 0.95,
  "summary": "文档内容摘要（50字以内）"
}`
```

- [ ] **Step 3: 在file:upload中添加自动分类调用**

```typescript
// 在 file:upload 处理器中，内容提取后添加：
if (contentExtracted) {
  // 获取项目的分类方式
  const project = db.get('SELECT category_type FROM projects WHERE id = ?', [projectId])

  // 根据分类方式调用AI分类
  const classifyPrompt = project.category_type === 'stage'
    ? CLASSIFY_PROMPT_STAGES
    : CLASSIFY_PROMPT_CONTENT

  // 调用AI分类（异步，不阻塞上传）
  aiService.chat([
    { role: 'user', content: classifyPrompt.replace('{content}', contentExtracted) }
  ]).then(async (result) => {
    const classification = JSON.parse(result.content)

    // 更新文件的category字段
    db.run(
      'UPDATE files SET category = ? WHERE id = ?',
      [classification.category, fileId]
    )

    // 移动文件到对应文件夹
    const targetDir = path.join(projectDir, classification.category)
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true })
    }
    fs.renameSync(storedPath, path.join(targetDir, filename))
  }).catch(err => {
    console.error('AI分类失败:', err)
  })
}
```

- [ ] **Step 4: 测试自动分类**

1. 启动应用
2. 上传txt文件（内容为需求文档相关）
3. 检查文件是否被分类到"需求"文件夹

- [ ] **Step 5: 提交**

```bash
git add electron/ipc/file-handlers.ts electron/ipc/ai-handlers.ts
git commit -m "feat: 文件上传后自动触发AI分类"
```

---

## Task 5: 对话历史持久化

**Files:**
- Modify: `electron/ipc/ai-handlers.ts`
- Modify: `src/components/Chat/ChatWindow.tsx`

- [ ] **Step 1: 查看conversations表结构**

确认数据库中已有conversations表。

- [ ] **Step 2: 在ai:chat中保存对话记录**

```typescript
// 在 ai:chat 处理器中，AI回复后添加：
const tokenCount = result.usage?.total_tokens || 0

// 保存用户消息
db.run(
  'INSERT INTO conversations (project_id, role, content, token_count) VALUES (?, ?, ?, ?)',
  [projectId, 'user', message, 0]
)

// 保存AI回复
db.run(
  'INSERT INTO conversations (project_id, role, content, token_count) VALUES (?, ?, ?, ?)',
  [projectId, 'assistant', result.content, tokenCount]
)
```

- [ ] **Step 3: 添加获取历史消息的IPC处理器**

```typescript
// 在 ai-handlers.ts 中添加新处理器：
ipcMain.handle('ai:get-history', async (_, projectId: number) => {
  const messages = db.all(
    'SELECT role, content, created_at FROM conversations WHERE project_id = ? ORDER BY created_at ASC',
    [projectId]
  )
  return messages
})
```

- [ ] **Step 4: 在preload.ts中暴露新接口**

```typescript
// 在 preload.ts 的 api.ai 中添加：
getHistory: (projectId: number) => ipcRenderer.invoke('ai:get-history', projectId)
```

- [ ] **Step 5: 修改ChatWindow.tsx加载历史**

```typescript
// 在 ChatWindow 组件中，加载时获取历史消息：
useEffect(() => {
  if (projectId) {
    window.api.ai.getHistory(projectId).then((history) => {
      setMessages(history.map(msg => ({
        role: msg.role,
        content: msg.content
      })))
    })
  }
}, [projectId])
```

- [ ] **Step 6: 测试对话持久化**

1. 启动应用
2. 发送几条消息
3. 刷新页面
4. 检查历史消息是否保留

- [ ] **Step 7: 提交**

```bash
git add electron/ipc/ai-handlers.ts electron/preload.ts src/components/Chat/ChatWindow.tsx
git commit -m "feat: 对话历史持久化到数据库"
```

---

## Task 6: 文件拖拽区域优化

**Files:**
- Modify: `src/components/ProjectHome/ProjectHome.tsx`

- [ ] **Step 1: 查看当前ProjectHome.tsx结构**

读取文件了解现有代码结构。

- [ ] **Step 2: 修改拖拽区域样式**

```typescript
// 找到文件拖拽区域的容器，修改样式：
<div
  style={{
    width: '100%',
    height: '40%',  // 改为40%自适应
    minHeight: '200px',  // 最小高度
    border: '2px dashed #d9d9d9',
    borderRadius: '8px',
    padding: '16px',
    textAlign: 'center',
    backgroundColor: '#fafafa',
    cursor: 'pointer'
  }}
  onDrop={handleDrop}
  onDragOver={handleDragOver}
>
  <UploadOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
  <p>拖拽文件到此处或点击上传</p>
</div>
```

- [ ] **Step 3: 测试拖拽区域**

1. 启动应用
2. 进入项目首页
3. 检查拖拽区域宽度100%、高度40%

- [ ] **Step 4: 提交**

```bash
git add src/components/ProjectHome/ProjectHome.tsx
git commit -m "fix: 文件拖拽区域宽度100%、高度40%自适应"
```

---

## Task 7: AI分析触发按钮

**Files:**
- Modify: `src/components/ProjectHome/SummaryCards.tsx`

- [ ] **Step 1: 查看当前SummaryCards.tsx结构**

读取文件了解现有代码结构。

- [ ] **Step 2: 添加AI分析按钮**

```typescript
// 在摘要卡片区添加按钮：
import { Button, message } from 'antd'
import { RobotOutlined } from '@ant-design/icons'

const handleAnalyze = async () => {
  try {
    message.loading('正在分析项目文件...', 0)
    await window.api.ai.analyze(projectId)
    message.success('项目摘要已生成')
    // 刷新页面数据
    refreshProject()
  } catch (error) {
    message.error('分析失败: ' + error.message)
  }
}

// 在卡片组件中添加按钮：
<Button
  type="primary"
  icon={<RobotOutlined />}
  onClick={handleAnalyze}
>
  生成/更新摘要
</Button>
```

- [ ] **Step 3: 测试AI分析按钮**

1. 启动应用
2. 进入项目首页
3. 点击"生成/更新摘要"按钮
4. 检查是否生成了 `.ai/project-summary.md` 文件

- [ ] **Step 4: 提交**

```bash
git add src/components/ProjectHome/SummaryCards.tsx
git commit -m "feat: 添加AI分析触发按钮"
```

---

## Task 8: 整体测试和验证

**Files:**
- None (测试任务)

- [ ] **Step 1: 构建并启动应用**

```bash
cd C:\NewProject
npm run build
npx electron .
```

- [ ] **Step 2: 测试完整流程**

1. **创建项目**
   - 输入项目名称
   - 选择"按阶段分类"
   - 验证创建了11个阶段文件夹

2. **上传文件**
   - 拖拽上传txt文件
   - 验证内容被提取（检查数据库content_extracted字段）
   - 验证AI自动分类（检查category字段）
   - 验证文件移动到对应阶段文件夹

3. **AI对话**
   - 发送几条消息
   - 刷新页面
   - 验证历史消息保留

4. **AI分析**
   - 点击"生成/更新摘要"按钮
   - 验证生成了 `.ai/project-summary.md` 文件

5. **UI验证**
   - 验证文件拖拽区域宽度100%
   - 验证文件拖拽区域高度40%

- [ ] **Step 3: 记录测试结果**

创建测试报告文档。

- [ ] **Step 4: 最终提交**

```bash
git add -A
git commit -m "feat: AI功能落地完成，包含文件提取、自动分类、对话持久化"
```

---

## 验收检查清单

### 文件内容提取
- [ ] txt/md/json文件可提取内容
- [ ] PDF文字版可提取内容
- [ ] Word文档可提取内容
- [ ] Excel表格可提取内容
- [ ] 提取结果存入content_extracted字段

### MiMo API
- [ ] API调用成功
- [ ] 认证方式正确（api-key header）
- [ ] 模型为mimo-v2.5（标准版）

### AI自动分类
- [ ] 上传后自动触发分类
- [ ] 支持三种分类方式（按阶段、按内容、智能分类）
- [ ] 按阶段分类时使用11个阶段
- [ ] 分类结果准确
- [ ] 文件保存到对应文件夹

### 对话历史
- [ ] 消息保存到数据库
- [ ] 刷新页面后历史记录不丢失
- [ ] 支持加载历史对话

### 文件夹结构
- [ ] 创建项目时根据分类方式创建文件夹
- [ ] 按阶段分类时创建11个阶段文件夹
- [ ] 文件按分类方式存储到对应文件夹

### UI调整
- [ ] 文件拖拽区域宽度100%自适应
- [ ] 文件拖拽区域高度40%自适应
- [ ] AI分析按钮在摘要卡片区显示

---

**计划完成时间：** 2026-06-08
**作者：** Claude Code
