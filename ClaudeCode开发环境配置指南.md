# Claude Code 开发环境配置指南

> 本文档包含 Superpowers 插件使用方法和常用开发软件信息
> 适用于新项目配置 Claude Code 开发环境

---

## 一、Superpowers 插件

### 1.1 插件简介

Superpowers 是一个 Claude Code 插件，提供 14 个行为指导 skills，帮助规范化开发流程。

### 1.2 安装方法

```bash
# 在 Claude Code 中运行以下命令安装插件
/plugin install superpowers@superpowers-marketplace
```

### 1.3 可用 Skills

| Skill | 用途 | 使用场景 |
|-------|------|----------|
| brainstorming | 头脑风暴 | 任何创意/功能开发前 |
| dispatching-parallel-agents | 并行 agent 调度 | 多任务并行执行 |
| executing-plans | 执行计划 | 按计划实施 |
| finishing-a-development-branch | 完成开发分支 | 合并前收尾 |
| receiving-code-review | 接收代码审查 | 被审查时 |
| requesting-code-review | 请求代码审查 | 完成任务后审查 |
| subagent-driven-development | 子 agent 驱动开发 | 按计划分派子任务 |
| systematic-debugging | 系统化调试 | 任何 bug/异常 |
| test-driven-development | 测试驱动开发 | 写代码前先写测试 |
| using-git-worktrees | 使用 git worktrees | 隔离工作区 |
| using-superpowers | 使用 superpowers | session 启动 |
| verification-before-completion | 完成前验证 | 声明完成前 |
| writing-plans | 编写计划 | brainstorming 后 |
| writing-skills | 编写 skills | 创建新 skill |

### 1.4 核心工作流

```
1. brainstorming → 理解需求 → 设计方案 → 用户批准
2. writing-plans → 创建实施计划
3. test-driven-development → 写代码前先写测试
4. subagent-driven-development → 分派子 agent 执行
5. requesting-code-review → 代码审查
6. verification-before-completion → 验证
7. finishing-a-development-branch → 收尾
```

### 1.5 Skill 调用方式

**重要**：Superpowers 的 skills 不是通过 `/skill-name` 调用的命令，而是在 session 启动时通过 hooks 注入的行为指导。

**正确调用方式**：
```python
# 使用 Skill 工具调用
{"skill": "brainstorming"}

# 或者在对话中直接使用自然语言
"使用 brainstorming 来讨论这个功能的设计"
```

### 1.6 关键原则

1. **brainstorming 是 HARD-GATE**：任何创意工作前必须先头脑风暴
2. **systematic-debugging**：先找根因再修，不允许猜测性修复
3. **一次一个问题**：多选优先
4. **YAGNI**：无情砍掉不必要的功能

### 1.7 文档结构规范

```
docs/
├── features/          # 功能需求文档
│   ├── INDEX.md       # 目录索引
│   └── ...
├── bugs/              # Bug 修复文档
│   ├── INDEX.md       # 目录索引
│   └── ...
├── superpowers/       # superpowers 相关文档
│   ├── specs/         # 设计规格
│   └── plans/         # 实施计划
└── ...
```

---

## 二、常用开发软件

### 2.1 Python

**版本**: Python 3.12.10
**路径**: `C:\Users\kingdee\AppData\Local\Programs\Python\Python312\python.exe`

**使用方法**:
```bash
# 运行 Python 脚本
python script.py

# 安装包
pip install package_name

# 虚拟环境
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
```

**常用包**:
- customtkinter - 现代化 GUI
- sounddevice - 音频录制
- soundfile - 音频文件处理
- numpy - 数值计算
- funasr - 语音识别

### 2.2 Node.js

**版本**: Node.js v24.15.0
**路径**: `C:\Program Files\nodejs\node.exe`

**使用方法**:
```bash
# 运行 JavaScript
node script.js

# 安装包
npm install package_name

# 运行脚本
npm run script_name
```

### 2.3 npm

**版本**: npm 11.12.1
**路径**: `C:\Program Files\nodejs\npm.cmd`

**使用方法**:
```bash
# 初始化项目
npm init

# 安装依赖
npm install

# 安装开发依赖
npm install --save-dev package_name

# 运行脚本
npm run script_name
```

### 2.4 Git

**版本**: Git 2.54.0
**路径**: `C:\Program Files\Git\bin\git.exe`

**使用方法**:
```bash
# 初始化仓库
git init

# 克隆仓库
git clone repository_url

# 添加文件
git add .

# 提交
git commit -m "commit message"

# 推送
git push origin branch_name

# 拉取
git pull origin branch_name
```

---

## 三、Claude Code 配置

### 3.1 记忆系统

Claude Code 使用基于文件的记忆系统，位于：
```
C:\Users\kingdee\.claude\projects\<project-name>\memory\
```

**记忆文件格式**:
```markdown
---
name: memory-name
description: 简短描述
metadata:
  type: user | feedback | project | reference
---

记忆内容
```

### 3.2 MEMORY.md 索引

每个项目的记忆索引文件位于：
```
C:\Users\kingdee\.claude\projects\<project-name>\memory\MEMORY.md
```

**格式**:
```markdown
# Memory Index

- [记忆标题](memory-file.md) — 简短描述
```

### 3.3 插件缓存

插件缓存位于：
```
C:\Users\kingdee\.claude\plugins\cache\
```

---

## 四、项目配置建议

### 4.1 新项目初始化

1. 创建项目目录
2. 初始化 Git 仓库
3. 创建 `CLAUDE.md` 文件（项目说明）
4. 安装 Superpowers 插件
5. 创建 `docs/` 目录结构

### 4.2 文档结构

```
project/
├── CLAUDE.md          # 项目说明
├── README.md          # 项目介绍
├── docs/
│   ├── features/      # 功能需求
│   ├── bugs/          # Bug 修复
│   └── superpowers/   # 设计和计划
├── src/               # 源代码
├── tests/             # 测试
└── .claude/           # Claude Code 配置
```

### 4.3 开发流程

1. **需求讨论**: 使用 `brainstorming` skill
2. **设计文档**: 保存到 `docs/superpowers/specs/`
3. **实施计划**: 使用 `writing-plans` skill
4. **代码实现**: 使用 `subagent-driven-development` skill
5. **代码审查**: 使用 `requesting-code-review` skill
6. **完成验证**: 使用 `verification-before-completion` skill

---

## 五、常见问题

### 5.1 如何安装 Superpowers 插件？

在 Claude Code 中运行：
```bash
/plugin install superpowers@superpowers-marketplace
```

### 5.2 如何调用 Superpowers skills？

使用 Skill 工具：
```python
{"skill": "brainstorming"}
```

### 5.3 如何查看已安装的插件？

插件缓存位于：
```
C:\Users\kingdee\.claude\plugins\cache\
```

### 5.4 如何更新插件？

在 Claude Code 中运行：
```bash
/plugin update superpowers
```

---

## 六、参考资源

- Claude Code 官方文档: https://docs.anthropic.com/claude-code
- Superpowers 插件市场: https://claude.ai/plugins
- Python 官方文档: https://docs.python.org/3/
- Node.js 官方文档: https://nodejs.org/en/docs
- Git 官方文档: https://git-scm.com/doc

---

*文档版本: 1.0*
*创建日期: 2026-06-03*
*作者: Claude Code*
