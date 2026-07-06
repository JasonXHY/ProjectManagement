# PMAer 内测版说明文档

> 本文档记录内测版（v0.1.0）的特殊配置和设计决策，供开发者理解代码意图。

---

## 一、内置 API Key 说明

### 为什么硬编码 API Key？

内测版的目的是让试用用户**开箱即用**，无需自行注册和配置 API 即可体验 AI 功能。

| 项目 | 说明 |
|------|------|
| **厂商** | 小米 MiMo |
| **模型** | mimo-v2.5（标准模型，性价比高） |
| **计费模式** | 按量计费 |
| **Base URL** | `https://api.xiaomimimo.com/v1/chat/completions` |

### 安全措施

1. **加密存储**：API Key 通过 `safeStorage.encryptString()` 加密后存入 SQLite
2. **UI 防复制**：设置页面 API Key 输入框为只读状态，禁止复制/剪切/粘贴
3. **前端掩码**：`getAllSettings()` 返回 `sk-***` 掩码，不暴露真实 Key

### 风险说明

- 技术上有逆向能力的用户仍可从 SQLite 文件中提取 Key
- 内测阶段可接受，正式版应改为用户自行配置

---

## 二、首次启动弹窗

### 设计意图

告知用户：
1. 这是内测版，已内置 API
2. AI 功能将于 **2026年7月31日** 关闭
3. 届时需自行配置 API Key

### 实现逻辑

```typescript
// electron/database/settings.ts
first_launch_done: 'false'  // 首次启动标记
beta_ai_shutdown_date: '2026-07-31'  // AI功能关闭日期
```

```tsx
// src/components/BetaNotice/BetaNoticeModal.tsx
// 检测 first_launch_done，首次显示弹窗
// 点击"我知道了"后设置为 true，不再弹出
```

---

## 三、未来版本需更新的内容

### 必须更新

| 内容 | 当前值 | 更新时机 | 说明 |
|------|--------|----------|------|
| `beta_ai_shutdown_date` | 2026-07-31 | 内测结束前 | AI功能关闭日期 |
| `ai_api_key` | 硬编码 Key | 正式版 | 改为用户自行配置 |
| `isBuiltinApiKey` 检测逻辑 | xiaomi + mimo-v2.5 | 正式版 | 移除内置Key检测 |
| BetaNoticeModal | 显示内测提醒 | 正式版 | 移除或改为版本更新提醒 |
| 版本号 | 0.1.0 | 每次发布 | 语义化版本 |

### 建议更新

| 内容 | 说明 |
|------|------|
| 7.31 后的错误提示 | AI功能关闭后，调用会失败，需添加友好提示 |
| 设置页面提示 | 添加"内测版已过期"状态提示 |
| 自动更新检测 | 正式版可考虑添加版本更新提示 |

---

## 四、关键文件索引

| 文件 | 用途 | 内测版特殊处理 |
|------|------|----------------|
| `electron/database/settings.ts` | 设置存储 | 预设 API Key + 首次启动标记 |
| `src/components/BetaNotice/BetaNoticeModal.tsx` | 首次弹窗 | 新增组件 |
| `src/components/Settings/SettingsPage.tsx` | 设置页面 | API Key 防复制 + 内置Key检测 |
| `electron-builder.yml` | 打包配置 | productName: PMAer |
| `build/icon.ico` | 应用图标 | 负鼠图标 |

---

## 五、版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| v0.1.0 | 2026-06-15 | 内测版首发：内置API + 防复制 + 首次弹窗 |

---

## 六、给未来开发者的提醒

1. **不要删除 `first_launch_done` 逻辑**：这是首次启动弹窗的控制标记
2. **不要修改 `beta_ai_shutdown_date`**：这是 AI 功能关闭日期
3. **正式版必须移除内置 API Key**：改为用户自行配置
4. **正式版必须移除 BetaNoticeModal**：或改为版本更新提醒
5. **模型注册表更新时**：同步更新 `docs/model-registry-update.md`
