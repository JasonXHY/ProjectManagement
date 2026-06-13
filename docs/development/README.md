# 开发文档

> 更新时间：2026-06-11

## 文档列表

| 文档 | 说明 |
|------|------|
| [optimization-roadmap.md](optimization-roadmap.md) | 优化路线图 |
| [tech-selection.md](tech-selection.md) | 技术选型分析 |
| [round1-plan.md](round1-plan.md) | 第一轮 UI 优化方案 |
| [round2-plan.md](round2-plan.md) | 第二轮功能优化方案 |
| [quick-launch-solution.md](quick-launch-solution.md) | 快速启动方案 |
| [test-guide.md](test-guide.md) | 测试指南 |
| [verification-plan.md](verification-plan.md) | 验证计划 |

## 开发规范

### 代码风格

- 使用 TypeScript 严格模式
- 遵循 ESLint 规则
- 组件使用函数式写法

### 提交规范

- feat: 新功能
- fix: 修复 bug
- docs: 文档更新
- style: 代码格式
- refactor: 重构
- test: 测试相关
- chore: 构建/工具相关

### 测试要求

- 新功能必须添加测试
- 使用 Vitest 作为测试框架
- 测试文件放在 `src/__tests__/` 目录
