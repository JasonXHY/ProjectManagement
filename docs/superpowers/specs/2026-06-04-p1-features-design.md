# P1功能设计文档

**日期**：2026-06-04
**版本**：1.0
**状态**：设计完成，待实现

---

## 1. 概述

本文档描述P1功能的设计方案，包括：
- 自动创建项目文件夹
- 文件实际存储
- AI自动分类文件

### 1.1 设计目标

- **自动化**：减少用户手动操作
- **智能化**：AI辅助文件分类
- **可扩展**：prompt可配置，支持多种文件格式
- **轻量级**：本地只负责上传，解析交给云端

---

## 2. 功能设计

### 2.1 自动创建项目文件夹

#### 2.1.1 需求描述

创建项目时，自动创建项目文件夹结构，包含10个阶段子文件夹。

#### 2.1.2 文件夹结构

```
projects/
├── {项目名}/
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

#### 2.1.3 实现方式

- 修改 `create_project` 命令
- 创建项目后，使用 `std::fs::create_dir_all` 创建文件夹
- 文件夹路径：`projects/{项目名}/`

#### 2.1.4 边界情况

- 项目名包含特殊字符：替换为下划线
- 项目名重复：追加时间戳后缀
- 权限问题：捕获错误，提示用户

---

### 2.2 文件实际存储

#### 2.2.1 需求描述

上传文件时，将文件保存到磁盘，而非仅创建数据库记录。

#### 2.2.2 支持的文件格式

| 类型 | 格式 | 说明 |
|------|------|------|
| 文档 | txt, md, doc, docx | Word文档 |
| 表格 | xls, xlsx | Excel表格 |
| 演示 | ppt, pptx | PowerPoint演示 |
| PDF | pdf | PDF文档 |

#### 2.2.3 存储路径

```
projects/{项目名}/{阶段}/{文件名}
```

#### 2.2.4 实现方式

- 修改 `create_file` 命令
- 接收文件内容（base64编码）
- 解码并保存到磁盘
- 更新数据库path字段为真实路径

#### 2.2.5 数据库变更

文件表 `files` 已有 `path` 字段，存储真实路径。

---

### 2.3 AI自动分类文件

#### 2.3.1 需求描述

上传文件时，自动调用云端大模型分析文件内容，返回分类建议。

#### 2.3.2 分类类别

| 类别 | 说明 |
|------|------|
| 售前 | 销售资料、客户沟通、报价单 |
| 启动 | 项目启动会、章程、团队组建 |
| 需求 | 需求文档、用户故事、用例 |
| 方案 | 技术方案、架构设计、选型 |
| 构建 | 开发文档、代码规范、接口定义 |
| 测试 | 测试用例、测试报告、缺陷 |
| 上线 | 部署文档、发布说明、运维 |
| 验收 | 验收标准、验收报告、签字 |
| 转客户成功 | 交接文档、培训资料、FAQ |
| 关闭 | 项目总结、复盘、归档 |

#### 2.3.3 实现方式

**新增服务**：`src-tauri/src/services/file_classifier.rs`

**接口设计**：
```rust
pub struct ClassificationResult {
    pub category: String,      // 分类结果
    pub confidence: f32,       // 置信度
    pub summary: String,       // 内容摘要
    pub file_type: String,     // 文件类型
}

pub async fn classify_file(
    file_path: &str,
    file_content: &str,        // base64编码
    prompt: &str,
    api_key: &str,
    api_url: &str,
) -> Result<ClassificationResult, String>
```

**流程**：
1. 读取文件内容（base64编码）
2. 构建prompt：将文件内容插入prompt模板
3. 调用智谱AI API
4. 解析AI响应，提取分类结果
5. 返回ClassificationResult

#### 2.3.4 Prompt设计

**默认prompt**：
```
你是一个专业的文档分类专家。请根据以下文档内容，判断它属于哪个类别：

类别：
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
  "category": "类别名称",
  "confidence": 0.95,
  "summary": "文档内容摘要（50字以内）",
  "file_type": "文件类型（如：需求文档、测试报告等）"
}
```

**Prompt可配置**：
- 存储在配置文件中
- 设置页面可编辑
- 提供"恢复默认"按钮

---

### 2.4 设置页面

#### 2.4.1 需求描述

提供设置页面，允许用户配置分类prompt。

#### 2.4.2 功能列表

- 显示当前分类prompt
- 允许编辑prompt
- 保存到本地配置文件
- 恢复默认prompt

#### 2.4.3 配置文件

**位置**：`~/.config/ai-project-manager/config.json`

**格式**：
```json
{
  "classification_prompt": "...",
  "api_key": "...",
  "api_url": "..."
}
```

---

## 3. 前端设计

### 3.1 文件上传流程

1. 用户点击"上传文件"按钮
2. 弹出文件选择对话框
3. 用户选择文件（支持批量）
4. 前端读取文件内容（base64编码）
5. 调用后端 `create_file` 命令
6. 显示上传进度
7. 上传完成后，调用 `classify_file`
8. 显示AI分类加载状态
9. AI返回分类建议
10. 显示分类建议确认对话框
11. 用户确认或手动修改
12. 保存分类结果

### 3.2 UI组件

**上传进度组件**：
- 显示当前上传文件名
- 显示上传进度条
- 显示批量上传进度（如：2/5）

**AI分类状态组件**：
- 显示"正在分析文件内容..."
- 显示加载动画

**分类建议确认对话框**：
- 显示AI分类建议
- 显示置信度
- 显示内容摘要
- 提供"确认"和"修改"按钮
- 点击"修改"弹出手动选择对话框

**手动选择对话框**：
- 显示所有分类类别
- 用户选择一个类别
- 确认保存

### 3.3 错误处理

| 错误类型 | 处理方式 |
|----------|----------|
| 文件格式不支持 | 提示用户，跳过分类 |
| AI调用失败 | 显示错误，弹出手动选择对话框 |
| 网络超时 | 重试一次，仍失败则提示 |
| 文件过大 | 提示用户，限制文件大小 |

---

## 4. 后端设计

### 4.1 命令接口

**新增命令**：

```rust
#[tauri::command]
pub async fn classify_file(
    db: State<'_, Database>,
    config: State<'_, AppConfig>,
    http_client: State<'_, reqwest::Client>,
    file_path: String,
    file_content: String,  // base64编码
) -> Result<ClassificationResult, String>
```

**修改命令**：

```rust
#[tauri::command]
pub async fn create_file(
    db: State<'_, Database>,
    project_id: i64,
    name: String,
    path: String,
    category: Option<String>,
    content: Option<String>,  // 新增：base64编码的文件内容
) -> Result<File, String>
```

### 4.2 文件存储服务

**新增服务**：`src-tauri/src/services/file_storage.rs`

```rust
pub fn save_file(
    project_name: &str,
    stage: &str,
    file_name: &str,
    content: &[u8],
) -> Result<String, String>
```

### 4.3 配置服务

**新增服务**：`src-tauri/src/services/config_service.rs`

```rust
pub struct AppConfig {
    pub zhipu_api_key: String,
    pub zhipu_api_url: String,
    pub model_name: String,
    pub classification_prompt: String,
}

impl AppConfig {
    pub fn load() -> Self;
    pub fn save(&self) -> Result<(), String>;
}
```

---

## 5. 数据库设计

### 5.1 现有表结构

文件表 `files` 已有字段：
- `id`: INTEGER PRIMARY KEY
- `project_id`: INTEGER REFERENCES projects(id)
- `name`: TEXT NOT NULL
- `path`: TEXT NOT NULL
- `category`: TEXT
- `tags`: TEXT
- `version`: INTEGER DEFAULT 1
- `content_hash`: TEXT
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP
- `updated_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

### 5.2 变更说明

无需新增字段，复用现有 `path` 和 `category` 字段。

---

## 6. 实现计划

### 6.1 第一阶段：自动创建文件夹（30分钟）

1. 修改 `create_project` 命令
2. 添加文件夹创建逻辑
3. 测试：创建项目，验证文件夹

### 6.2 第二阶段：文件实际存储（45分钟）

1. 新增 `file_storage.rs` 服务
2. 修改 `create_file` 命令
3. 修改前端文件上传组件
4. 测试：上传文件，验证存储

### 6.3 第三阶段：AI自动分类（60分钟）

1. 新增 `file_classifier.rs` 服务
2. 新增 `classify_file` 命令
3. 修改前端上传流程
4. 添加分类确认对话框
5. 测试：上传文件，验证分类

### 6.4 第四阶段：设置页面（30分钟）

1. 新增 `config_service.rs` 服务
2. 创建设置页面组件
3. 实现prompt编辑功能
4. 测试：修改prompt，验证生效

---

## 7. 测试计划

### 7.1 单元测试

- 文件夹创建：验证10个子文件夹
- 文件存储：验证文件保存到磁盘
- AI分类：验证分类结果解析

### 7.2 集成测试

- 完整流程：创建项目 → 上传文件 → AI分类 → 确认分类
- 错误处理：网络失败、文件格式不支持

### 7.3 用户验收测试

- 创建项目，验证文件夹结构
- 上传不同类型文件，验证分类
- 修改prompt，验证分类效果

---

## 8. 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| AI分类不准确 | 用户体验差 | 提供手动修改，支持prompt优化 |
| 网络超时 | 上传失败 | 重试机制，离线提示 |
| 文件过大 | 内存溢出 | 限制文件大小，分块上传 |
| 特殊字符路径 | 文件保存失败 | 路径规范化，错误处理 |

---

## 9. 附录

### 9.1 相关文件

- 后端命令：`src-tauri/src/commands/project.rs`, `src-tauri/src/commands/file.rs`
- 服务：`src-tauri/src/services/file_classifier.rs`, `src-tauri/src/services/file_storage.rs`
- 前端组件：`src/components/FileManager/FileManager.tsx`
- 配置：`src-tauri/src/config.rs`

### 9.2 参考文档

- 智谱AI API文档：https://open.bigmodel.cn/dev/api
- Tauri文件系统API：https://tauri.app/v1/api/js/fs

---

**文档完成时间**：2026-06-04
**作者**：AI助手
**审核人**：待审核
