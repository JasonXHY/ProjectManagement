
## 2026-06-07 Electron项目初始化完成

### 完成的工作
- 安装了Electron和相关依赖
- 创建了electron/main.ts和electron/preload.ts
- 更新了package.json，添加了electron相关脚本
- 更新了vite.config.ts，配置了开发服务器端口
- 创建了electron/tsconfig.json用于编译TypeScript

### 关键发现
1. Electron不支持直接运行TypeScript，需要先编译
2. 使用cross-env设置NODE_ENV环境变量
3. 端口冲突问题需要手动清理
4. Electron GPU缓存错误是Windows上的无害警告

### 文件结构
```
electron/
├── main.ts          # 主进程入口
├── preload.ts       # 预加载脚本
├── tsconfig.json    # TypeScript配置
└── dist/            # 编译后的JavaScript文件
    ├── main.js
    └── preload.js
```

### 开发命令
- `npm run dev` - 启动Vite开发服务器
- `npm run electron:dev` - 启动Electron开发模式
- `npm run electron:compile` - 编译Electron TypeScript文件

## 2026-06-07 AI服务统一接口创建

### 完成的工作
- 创建了AI供应商基础接口（base.ts）
- 实现了智谱AI供应商（zhipu.ts）
- 实现了小米MiMo供应商（mimo.ts），支持api/token两种模式
- 创建了统一的AI服务接口（ai-service.ts），支持单例模式

### 关键发现
1. **TypeScript strict模式下`response.json()`返回`unknown`**：必须使用`as Type`断言，不能用类型注解
2. **electron/tsconfig.json的rootDir限制**：不能导入`src/types`等外部文件，需要在electron目录内重新定义类型
3. **OpenAI兼容API格式**：智谱和MiMo都使用相同的请求/响应格式，可以共享`OpenAIResponse`类型

### 文件结构
```
electron/services/
├── ai-providers/
│   ├── base.ts          # 基础接口定义
│   ├── zhipu.ts         # 智谱AI实现
│   └── mimo.ts          # 小米MiMo实现
└── ai-service.ts        # 统一服务接口
```

### 使用方式
```typescript
import { aiService } from './services/ai-service'

// 使用默认供应商
const response = await aiService.chat([{ role: 'user', content: '你好' }])

// 指定供应商
const response = await aiService.chat(messages, 'mimo', 'mimo-v2.5')
```

## 2026-06-07 IPC处理器实现完成

### 完成的工作
- 创建了4个IPC处理器文件：project-handlers.ts、file-handlers.ts、ai-handlers.ts、settings-handlers.ts
- 更新了main.ts，注册所有IPC处理器
- 重写了preload.ts，暴露完整的API接口

### 关键发现
1. **electron/tsconfig.json的rootDir限制**：不能导入`src/types`中的`DEFAULT_STAGES`常量，需要在electron目录内重新定义
2. **IPC处理器结构**：每个处理器使用`ipcMain.handle(channel, handler)`模式，返回`{ success: boolean, data?: any, error?: string }`格式
3. **preload.ts的contextBridge**：使用`contextBridge.exposeInMainWorld('api', {...})`暴露API，前端通过`window.api.xxx`调用

### 文件结构
```
electron/ipc/
├── project-handlers.ts  # 项目CRUD操作
├── file-handlers.ts     # 文件上传、列表、删除
├── ai-handlers.ts       # AI聊天、分类、分析
└── settings-handlers.ts # 设置读取和更新
```

### API接口
```typescript
// 前端调用示例
window.api.project.create('项目名', 'stage')
window.api.project.list()
window.api.file.upload(projectId, { name, content, type })
window.api.ai.chat(projectId, '问题', [fileId1, fileId2])
window.api.settings.get()
window.api.settings.update({ ai_api_key: 'xxx' })
```

### TypeScript编译
- 运行`npx tsc --project electron/tsconfig.json --noEmit`验证编译通过
- 所有处理器使用TypeScript strict模式，类型安全

## 2026-06-07 前端服务层创建完成

### 完成的工作
- 重写了4个服务文件：projectService.ts、fileService.ts、aiService.ts、configService.ts
- 创建了共享类型声明文件：types/windowApi.ts
- 所有服务从Tauri invoke模式迁移到Electron window.api模式

### 关键发现
1. **declare global冲突**：每个服务文件独立声明`Window.api`会导致TS2717错误（类型不兼容），必须创建统一的类型声明文件
2. **解决方案**：在`src/types/windowApi.ts`中声明完整的`Window.api`接口，各服务通过`import '../types/windowApi'`引入
3. **消费者适配**：旧服务使用函数式API（`getProjects()`），新服务使用对象式API（`projectService.list()`），消费者组件需要后续适配

### 新服务结构
```
src/services/
├── projectService.ts  # projectService对象，5个方法
├── fileService.ts     # fileService对象，4个方法
├── aiService.ts       # aiService对象，3个方法
├── configService.ts   # configService对象，2个方法
└── ../types/windowApi.ts  # 统一Window.api类型声明
```

## 2026-06-06: SettingsPage 更新
- 更新了 SettingsPage.tsx，添加 AI 模型供应商选择（智谱/小米MiMo/自定义）和文件提取配置
- 保留了原有的 onBack prop 和 default export，与 App.tsx 兼容
- 使用 configService.get()/update() 接口，与 window.api.settings 类型匹配
- 文件类型：TXT/MD、PDF(文字/扫描)、Word、Excel、图片，扫描PDF和图片固定为云端
- 切换供应商时自动填充默认模型和API地址
- TS 编译通过（其他文件的预存错误不影响）
