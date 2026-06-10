# 项目管理助手

轻量级 AI 项目管理工具（Windows 版）

## 技术栈

- **前端**: React 19 + Ant Design 6 + Tailwind CSS 4 + TypeScript
- **后端**: Electron 42
- **数据库**: SQLite (sql.js)
- **AI 服务**: OpenAI 兼容协议（智谱AI、小米 MiMo）

## 开发环境

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 项目结构

```
src/
├── components/          # React 组件
│   ├── Chat/           # AI 对话组件
│   ├── ProjectHome/    # 项目详情页组件
│   ├── ProjectList/    # 项目列表组件
│   └── Settings/       # 设置页组件
├── pages/              # 页面组件
├── services/           # 服务层
├── types/              # TypeScript 类型定义
├── styles/             # 样式文件
│   ├── index.css       # 全局样式
│   └── overrides.css   # Ant Design 样式覆盖
└── main.tsx            # 应用入口

electron/               # Electron 主进程
└── services/           # 后端服务
    └── ai-providers/   # AI 服务提供商
```

## 设计系统

本项目使用三层样式架构：

1. **Ant Design ConfigProvider（主题层）**: 负责所有 AntD 组件的颜色、圆角、字号、间距等主题 Token
2. **Tailwind CSS（布局层）**: 仅用于布局相关：flex、grid、padding、margin、width、height
3. **CSS 覆盖文件（细节层）**: 处理 ConfigProvider 无法覆盖的样式

设计规范详见 `.qoderwork/design-system/v1-design-tokens.md`

## 页面说明

1. **项目列表页**: 显示所有项目，支持卡片/表格视图切换
2. **项目详情页**: 显示项目阶段导航、摘要卡片、文件列表
3. **AI 对话页**: 与 AI 助手对话，支持文件上下文
4. **设置页**: 配置 AI 模型、文件提取、Prompt 等

## 开发说明

### 归档的 Tauri 后端

`src-tauri-archived/` 目录包含已归档的 Tauri 后端代码。该项目已迁移到 Electron 架构，Tauri 后端不再使用。

### 样式验证页

开发过程中可访问 `/style-test` 页面验证样式效果。该页面仅用于开发调试，不打包到生产环境。

## 许可证

私有项目
