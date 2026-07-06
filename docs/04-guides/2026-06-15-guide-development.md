# 项目管理助手 — 开发指南

> 版本：1.0
> 日期：2026-06-14
> 状态：正式发布

---

## 一、开发环境

### 1.1 环境要求

- Node.js: 18+ 
- npm: 9+
- Windows: 10/11 (主要目标平台)

### 1.2 快速开始

```bash
# 1. 克隆仓库
git clone https://github.com/JasonXHY/ProjectManagement.git
cd ProjectManagement

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev

# 或使用快速启动脚本（跳过依赖检查）
start-dev-quick.bat
```

### 1.3 开发命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（Vite + Electron） |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 预览构建结果 |
| `npm run lint` | 代码检查 |
| `npm run typecheck` | TypeScript类型检查 |
| `npm run test` | 运行测试 |

---

## 二、项目结构

### 2.1 目录说明

```
├── src/                    # React前端代码
│   ├── components/         # 可复用组件
│   ├── pages/              # 页面组件
│   ├── services/           # 前端服务层
│   ├── types/              # TypeScript类型定义
│   └── styles/             # 样式文件
│
├── electron/               # Electron主进程
│   ├── main.ts             # 主进程入口
│   ├── preload.ts          # 预加载脚本（IPC桥接）
│   ├── ipc/                # IPC处理器
│   ├── services/           # 后端服务
│   └── database/           # 数据库schema
│
├── docs/                   # 项目文档
│   ├── requirements/       # 需求文档
│   ├── design/             # 设计文档
│   └── development/        # 开发文档
│
├── .mimo-code/             # MiMoCode工作区
├── .qoderwork/             # QoderWork工作区
```

### 2.2 关键文件

| 文件 | 说明 |
|------|------|
| `src/types/index.ts` | 类型定义，包含DEFAULT_STAGES等常量 |
| `src/components/ProjectHome/StageSidebar.tsx` | 文件分类阶段侧边栏 |
| `electron/ipc/project-handlers.ts` | 项目相关IPC处理 |
| `electron/ipc/file-handlers.ts` | 文件相关IPC处理 |
| `electron/services/ai-providers/` | AI服务提供商 |

---

## 三、编码规范

### 3.1 TypeScript规范

- 严格模式（strict: true）
- 禁止any类型
- 使用接口定义对象结构
- 函数参数和返回值必须有类型

### 3.2 React规范

- 使用函数组件 + Hooks
- 组件文件名使用PascalCase
- 自定义Hook以`use`开头
- 使用Ant Design组件库

### 3.3 样式规范

- 优先使用Ant Design主题Token
- 布局使用Tailwind CSS
- 避免内联样式
- 遵循设计规范 `docs/design/design-tokens.md`

### 3.4 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 文件名 | PascalCase | `ProjectList.tsx` |
| 组件名 | PascalCase | `ProjectList` |
| 函数名 | camelCase | `getProjectList` |
| 变量名 | camelCase | `projectList` |
| 常量名 | UPPER_SNAKE_CASE | `DEFAULT_STAGES` |
| 接口名 | PascalCase | `Project` |

---

## 四、Git工作流

### 4.1 分支策略

- `main`: 主分支，稳定版本
- `develop`: 开发分支
- `feature/*`: 功能分支
- `fix/*`: 修复分支

### 4.2 提交规范

使用语义化提交：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type类型**：
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具相关

**示例**：
```
feat(project): 添加自定义项目存储路径设置

- 设置页面新增存储路径配置项
- 支持浏览按钮选择路径
- 路径不存在时自动创建

Closes #123
```

### 4.3 协作流程

1. 从`develop`创建功能分支
2. 开发完成后提交PR
3. 代码审查通过后合并
4. 定期将`develop`合并到`main`

---

## 五、测试规范

### 5.1 测试框架

- 单元测试：Vitest
- 组件测试：React Testing Library

### 5.2 测试要求

- 核心业务逻辑必须有测试
- 组件测试覆盖主要交互
- 测试文件与源文件同目录，命名`*.test.ts`或`*.test.tsx`

### 5.3 运行测试

```bash
# 运行所有测试
npm run test

# 运行特定测试
npm run test -- src/path/to/test.test.ts

# 查看覆盖率
npm run test -- --coverage
```

---

## 六、调试技巧

### 6.1 Electron调试

```bash
# 启动开发模式（开启调试）
npm run dev

# 主进程调试
# 在VSCode中使用"F5"启动调试配置
```

### 6.2 日志查看

- 主进程日志：终端输出
- 渲染进程日志：Chrome DevTools（Ctrl+Shift+I）

### 6.3 常见问题

| 问题 | 解决方案 |
|------|----------|
| IPC调用失败 | 检查preload.ts是否正确暴露API |
| 数据库锁定 | 检查Promise队列是否正常工作 |
| AI服务超时 | 检查网络连接和API Key配置 |

---

## 七、文档贡献

### 7.1 文档位置

- 需求文档：`docs/requirements/`
- 设计文档：`docs/design/`
- 开发文档：`docs/development/`

### 7.2 文档更新

- 功能变更时同步更新相关文档
- 保持文档与代码一致
- 使用Markdown格式

---

## 八、版本历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| v1.0 | 2026-06-14 | 初始版本 |
