# AI功能落地设计文档

**日期：** 2026-06-08
**版本：** 1.0
**状态：** 设计完成，待实现

---

## 一、概述

本文档描述AI功能落地到Electron版本的设计方案，包括：
- 文件内容提取服务
- MiMo API集成
- AI自动分类流程
- 对话历史持久化
- 文件夹结构优化
- UI调整

### 1.1 设计目标

- **打通AI功能链路**：从文件上传到AI分析的完整流程
- **多供应商支持**：智谱AI + 小米MiMo
- **用户体验优先**：自动化流程，减少手动操作
- **数据持久化**：对话历史、文件内容提取结果永久保存

---

## 二、任务设计

### 2.1 文件内容提取服务

#### 2.1.1 提取模式

**混合模式（本地提取 + 云端OCR）：**

| 文件类型 | 格式 | 提取方式 | 提取库 |
|----------|------|----------|--------|
| 文本文件 | txt, md, json | 直接读取 | fs.readFile |
| PDF文字版 | pdf | 本地提取 | pdf-parse |
| Word | doc, docx | 本地提取 | mammoth |
| Excel | xls, xlsx | 本地提取 | xlsx |
| 图片 | png, jpg, jpeg | 云端OCR | MiMo多模态 |

#### 2.1.2 提取时机

**上传时自动提取：**
```
用户拖拽/选择文件
    ↓
前端上传文件
    ↓
后端保存文件到磁盘
    ↓
后端自动提取内容（本地库）
    ↓
存入 content_extracted 字段
    ↓
可选：自动触发AI分类
```

#### 2.1.3 依赖库

```json
{
  "pdf-parse": "^1.1.1",
  "mammoth": "^1.6.0",
  "xlsx": "^0.18.5"
}
```

#### 2.1.4 实现文件

- **新增：** `electron/services/file-extractor.ts`
- **修改：** `electron/ipc/file-handlers.ts`（上传后调用提取）

---

### 2.2 MiMo API集成

#### 2.2.1 配置信息

| 配置项 | 值 |
|--------|-----|
| **Endpoint** | `https://api.xiaomimimo.com/v1` |
| **模型** | `mimo-v2.5`（标准版，多模态支持更好，更省钱） |
| **认证方式** | Header `api-key` |
| **API Key** | `sk-clwzd502pqodv97h6i2aol0jhaaik6a6fuodsqgajk8pc11p` |
| **格式** | 兼容 OpenAI |

#### 2.2.2 已修复问题

| 问题 | 修复前 | 修复后 |
|------|--------|--------|
| 认证Header | `Authorization: Bearer` | `api-key` |
| 默认模型 | `mimo-v2.5` | `mimo-v2.5`（保持标准版） |

#### 2.2.3 实现文件

- **已修复：** `electron/services/ai-providers/mimo.ts`

---

### 2.3 AI自动分类流程

#### 2.3.1 三种分类方式（来自2026-06-06设计文档）

| 分类方式 | 说明 | 默认阶段 |
|----------|------|----------|
| **按阶段分类** | 默认11个阶段，用户可自定义 | 首页、售前、启动、需求、方案、构建、测试、上线、验收、转客户成功、关闭 |
| **按内容分类** | AI自动识别文件内容，创建分类 | AI根据内容自动创建 |
| **智能分类** | AI综合分析所有文件，动态创建和调整分类 | 更灵活但需要更多AI调用 |

#### 2.3.2 流程设计

```
用户上传文件
    ↓
文件保存到磁盘
    ↓
自动提取内容 → content_extracted
    ↓
根据项目的 category_type 决定分类方式：
  - stage（按阶段）：AI判断文件属于哪个阶段
  - content（按内容）：AI根据内容创建分类
  - smart（智能）：AI综合分析后创建分类
    ↓
自动调用AI分类（ai:classify）
    ↓
AI返回分类结果
    ↓
更新文件的 category 字段
    ↓
文件保存到对应文件夹
```

#### 2.3.3 触发方式

**上传后自动触发，无需用户确认**

#### 2.3.4 分类类别（按阶段分类时的11个阶段）

1. 首页
2. 售前
3. 启动
4. 需求
5. 方案
6. 构建
7. 测试
8. 上线
9. 验收
10. 转客户成功
11. 关闭

#### 2.3.5 阶段下属文件分类（未来扩展）

**文件夹结构扩展：**
```
projects/{项目名}/{阶段}/
├── {文件名}.{扩展名}          # 直接放在阶段下
├── 会议纪要/                  # 阶段下属分类
│   ├── 会议纪要-20260601.md
│   └── 会议纪要-20260608.md
├── 签字件/
│   └── 验收报告签字版.pdf
└── 汇报文件/
    └── 周报.docx
```

**设置页面配置项（预留）：**
```typescript
interface FileStructureConfig {
  stageSubcategories: string[]  // 阶段下属分类
  // 预置选项：会议纪要、签字件、汇报文件、设计稿、测试报告等
}
```

**实现方式：**
- 用户在设置页面勾选需要的下属分类
- 勾选后自动在AI分类prompt中增加该结构描述
- AI分类时同时判断文件属于哪个阶段和下属分类

#### 2.3.6 实现文件

- **修改：** `electron/ipc/file-handlers.ts`（上传后自动调用classify）
- **修改：** `electron/ipc/ai-handlers.ts`（分类prompt支持下属分类）
- **预留：** `src/components/Settings/SettingsPage.tsx`（文件结构设置）

---

### 2.4 对话历史持久化

#### 2.4.1 存储粒度

**每条消息独立存储：**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| project_id | INTEGER | 关联项目 |
| role | TEXT | user / assistant |
| content | TEXT | 消息内容 |
| token_count | INTEGER | 消耗token数 |
| created_at | DATETIME | 创建时间 |

#### 2.4.2 数据表

```sql
CREATE TABLE conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    role TEXT NOT NULL,  -- user 或 assistant
    content TEXT NOT NULL,
    token_count INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id)
);
```

#### 2.4.3 实现文件

- **修改：** `electron/ipc/ai-handlers.ts`（保存对话记录）
- **修改：** `src/components/Chat/ChatWindow.tsx`（加载历史记录）

---

### 2.5 项目文件夹结构

#### 2.5.1 按阶段分类时的路径格式（默认11个阶段）

```
projects/
├── {项目名}/
│   ├── 首页/
│   ├── 售前/
│   ├── 启动/
│   ├── 需求/
│   ├── 方案/
│   ├── 构建/
│   ├── 测试/
│   ├── 上线/
│   ├── 验收/
│   ├── 转客户成功/
│   └── 关闭/
```

#### 2.5.2 按内容/智能分类时的路径格式

```
projects/
├── {项目名}/
│   ├── {AI创建的分类1}/
│   │   ├── {文件名}.{扩展名}
│   │   └── ...
│   ├── {AI创建的分类2}/
│   └── ...
```

#### 2.5.3 阶段下属文件分类（扩展）

```
projects/{项目名}/{阶段}/
├── {文件名}.{扩展名}          # 直接放在阶段下
├── 会议纪要/                  # 阶段下属分类（可选）
├── 签字件/                    # 阶段下属分类（可选）
└── 汇报文件/                  # 阶段下属分类（可选）
```

#### 2.5.4 特殊处理

| 情况 | 处理方式 |
|------|----------|
| 项目名包含特殊字符 | 替换为下划线 |
| 项目名重复 | 追加时间戳后缀 |
| 权限问题 | 捕获错误，提示用户 |
| 分类名称包含特殊字符 | 替换为下划线 |

#### 2.5.5 实现文件

- **修改：** `electron/ipc/project-handlers.ts`（创建项目时创建文件夹）
- **修改：** `electron/ipc/file-handlers.ts`（上传时按分类方式存储）

---

### 2.6 文件拖拽区域优化

#### 2.6.1 布局设计

| 属性 | 值 |
|------|-----|
| 宽度 | 100%自适应 |
| 高度 | 40%自适应（占页面总高度的40%） |

#### 2.6.2 实现文件

- **修改：** `src/components/ProjectHome/ProjectHome.tsx`

---

### 2.7 AI分析触发按钮

#### 2.7.1 位置

**项目首页顶部摘要卡片区**

#### 2.7.2 功能

- 按钮文字："生成/更新摘要"
- 点击后调用 `ai:analyze`
- 增量分析：只分析未处理的文件
- 生成MD文件：`projects/{项目名}/.ai/project-summary.md`

#### 2.7.3 实现文件

- **修改：** `src/components/ProjectHome/ProjectHome.tsx`
- **修改：** `src/components/ProjectHome/SummaryCards.tsx`

---

## 三、文件变更清单

### 3.1 新增文件

| 文件 | 说明 |
|------|------|
| `electron/services/file-extractor.ts` | 文件内容提取服务 |

### 3.2 修改文件

| 文件 | 修改内容 |
|------|----------|
| `electron/services/ai-providers/mimo.ts` | 修复认证Header和默认模型 |
| `electron/ipc/file-handlers.ts` | 上传后自动提取内容、自动触发分类 |
| `electron/ipc/project-handlers.ts` | 创建项目时创建文件夹结构 |
| `electron/ipc/ai-handlers.ts` | 保存对话记录到数据库 |
| `src/components/Chat/ChatWindow.tsx` | 加载历史记录、保存新消息 |
| `src/components/ProjectHome/ProjectHome.tsx` | 文件拖拽区域优化、AI分析按钮 |
| `src/components/ProjectHome/SummaryCards.tsx` | 添加AI分析触发按钮 |
| `package.json` | 添加pdf-parse、mammoth、xlsx依赖 |

---

## 四、依赖安装

```bash
npm install pdf-parse mammoth xlsx
```

---

## 五、测试计划

### 5.1 单元测试

| 测试项 | 说明 |
|--------|------|
| 文件提取 | txt、pdf、word、excel文件内容提取 |
| MiMo API | API调用、认证、响应解析 |
| AI分类 | 文件分类结果准确性 |
| 对话持久化 | 消息保存和加载 |

### 5.2 集成测试

| 测试项 | 说明 |
|--------|------|
| 完整流程 | 上传文件 → 提取内容 → AI分类 → 保存 |
| 对话流程 | 发送消息 → 保存记录 → 刷新页面 → 加载历史 |

### 5.3 用户验收测试

| 测试项 | 说明 |
|--------|------|
| 文件上传 | 拖拽上传文件，自动提取内容 |
| AI分类 | 上传后自动分类，无需手动操作 |
| 对话历史 | 刷新页面后对话记录不丢失 |
| 文件夹结构 | 创建项目后，文件夹按阶段创建 |

---

## 六、风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 文件提取库兼容性 | 某些文件格式提取失败 | 提供手动分类备选 |
| MiMo API调用延迟 | 分类等待时间长 | 异步处理，不阻塞用户操作 |
| 大文件提取 | 内存溢出 | 限制文件大小，分块处理 |
| 特殊字符文件名 | 文件保存失败 | 路径规范化，错误处理 |

---

## 七、验收标准

### 7.1 文件内容提取
- [ ] txt/md/json文件可提取内容
- [ ] PDF文字版可提取内容
- [ ] Word文档可提取内容
- [ ] Excel表格可提取内容
- [ ] 提取结果存入content_extracted字段

### 7.2 MiMo API
- [ ] API调用成功
- [ ] 认证方式正确（api-key header）
- [ ] 模型为mimo-v2.5（标准版）

### 7.3 AI自动分类
- [ ] 上传后自动触发分类
- [ ] 支持三种分类方式（按阶段、按内容、智能分类）
- [ ] 按阶段分类时使用11个阶段
- [ ] 分类结果准确
- [ ] 文件保存到对应文件夹

### 7.4 对话历史
- [ ] 消息保存到数据库
- [ ] 刷新页面后历史记录不丢失
- [ ] 支持加载历史对话

### 7.5 文件夹结构
- [ ] 创建项目时根据分类方式创建文件夹
- [ ] 按阶段分类时创建11个阶段文件夹
- [ ] 按内容/智能分类时由AI创建分类文件夹
- [ ] 文件按分类方式存储到对应文件夹

### 7.6 UI调整
- [ ] 文件拖拽区域宽度100%自适应
- [ ] 文件拖拽区域高度40%自适应
- [ ] AI分析按钮在摘要卡片区显示

---

**文档完成时间：** 2026-06-08
**作者：** Claude Code
**审核人：** 待审核
