# 操作列按钮不显示问题 - 修复方案

> 问题发现时间：2026-06-16
> 优先级：高（影响核心功能）
> 负责修复：MiMo Code

---

## 一、问题描述

上传文件后，文件列表的"操作"列（最右侧）完全空白，无法看到 AI分类、打开文件、删除文件等操作按钮。

### 截图证据

![问题截图](../.qoderwork/uploads/image_1781588823674_uge8aq0.png)

红色框标注的位置应该是操作按钮，但显示为空白。

---

## 二、问题根因分析

### 文件位置

`src/components/ProjectHome/FileListTable.tsx` 第 178-221 行

### 问题代码

```tsx
// 第 179-181 行
<div
  style={{ display: 'flex', gap: '2px', opacity: 0, transition: 'opacity 150ms' }}
  className="row-actions"
>
  {/* 操作按钮 */}
</div>
```

### 问题分析

1. **内联样式优先级冲突**
   - `opacity: 0` 被写入内联 style 属性
   - CSS 规则 `.ant-table-row:hover .row-actions { opacity: 1 }` 无法覆盖内联样式
   - CSS 优先级：内联样式 > ID选择器 > 类选择器 > 标签选择器

2. **Ant Design 6 类名变更**
   - 原代码使用 `.ant-table-row:hover` 选择器
   - Ant Design 6 可能更改了 Table 组件的 DOM 结构或类名
   - 需要验证实际的类名结构

---

## 三、修复方案

### 方案 A：移除内联 opacity（推荐）

**修改文件**：`src/components/ProjectHome/FileListTable.tsx`

**修改前**：
```tsx
<div
  style={{ display: 'flex', gap: '2px', opacity: 0, transition: 'opacity 150ms' }}
  className="row-actions"
>
```

**修改后**：
```tsx
<div
  style={{ display: 'flex', gap: '2px' }}
  className="row-actions"
>
```

**说明**：移除内联的 `opacity: 0` 和 `transition`，完全交给 CSS 类 `.row-actions` 控制。

### 方案 B：添加 !important 到 CSS（备选）

如果方案 A 仍有问题，修改 CSS 文件：

**修改文件**：`src/styles/overrides.css`

**修改前**：
```css
.ant-table-row:hover .row-actions {
  opacity: 1;
}
```

**修改后**：
```css
.ant-table-row:hover .row-actions {
  opacity: 1 !important;
}
```

**说明**：使用 `!important` 强制覆盖内联样式，但这不是最佳实践。

---

## 四、验证步骤

修复完成后，请执行以下验证：

### 功能验证

1. 启动开发服务器 `npm run dev`
2. 进入任意项目，查看"所有文件"列表
3. 将鼠标悬停在任意文件行上
4. **预期结果**：操作列显示三个按钮（AI分类、打开文件、删除）
5. 点击每个按钮，确认功能正常

### 样式验证

1. 检查操作按钮的 hover 过渡效果（150ms 淡入）
2. 确认按钮在非 hover 状态下隐藏，hover 时显示
3. 检查响应式布局（窗口缩小时按钮是否正常显示）

### 兼容性验证

1. 检查是否有其他使用 `.row-actions` 类的组件
2. 确保修改不影响其他功能

---

## 五、相关文件

| 文件路径 | 用途 | 需要修改 |
|----------|------|----------|
| `src/components/ProjectHome/FileListTable.tsx` | 文件列表表格组件 | ✅ |
| `src/styles/overrides.css` | Ant Design 样式覆盖 | ❌（方案A不需要） |

---

## 六、额外建议

### 代码规范

建议将类似的操作按钮 hover 显示逻辑统一处理：

```tsx
// 统一使用 CSS 类控制，避免内联样式
<div className="row-actions">
  {/* 按钮 */}
</div>
```

### 可访问性

当前按钮依赖 hover 显示，可能对键盘用户不友好。建议：

1. 为每个按钮添加 `tabIndex={0}`
2. 监听 `:focus-visible` 状态
3. 或考虑始终显示操作按钮（如果空间允许）

---

## 七、完成标准

- [ ] 操作列按钮在 hover 时正确显示
- [ ] 三个按钮（AI分类、打开文件、删除）功能正常
- [ ] 过渡动画效果正常（150ms 淡入）
- [ ] 无控制台报错
- [ ] 通过手动测试验证
