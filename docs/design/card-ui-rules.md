# 卡片系统 UI 规则备忘

> 版本：0.2.0 | 创建时间：2026-06-25
> 用途：记录卡片系统 UI 开发中必须遵守的规则，未来优化 UI 时同样适用。
> 本文件是对 `design-tokens.md` 和 `ui-design-spec.md` 的补充，聚焦卡片系统特有的约定。

---

## 一、Design Tokens 使用规则

### 1.1 必须使用完整变量名

所有 CSS 变量必须使用 `design-tokens.md` 中定义的完整名称，禁止缩写。

| 正确 | 错误 |
|------|------|
| `--color-primary` | `--c1` |
| `--bg-surface` | `--sf` |
| `--border-default` | `--bd` |
| `--text-secondary` | `--t2` |
| `--color-success` | `--ok` |
| `--radius-lg` | `--rlg` |

**原因**：缩写变量名无法与 `design-tokens.md` 对应，增加维护成本，新成员无法快速理解。

### 1.2 颜色引用

- 品牌色/语义色：必须使用 CSS 变量（如 `var(--color-primary)`）
- 阶段标签色：直接使用色值（已在 `design-tokens.md` §1.4 定义）
- 不允许在组件中硬编码未在 design-tokens.md 中定义的颜色

---

## 二、图标规则

### 2.1 禁止使用 Emoji

所有图标使用内联 SVG（对应 `@ant-design/icons`），不使用 emoji。

**原因**：emoji 在不同操作系统/浏览器上渲染不一致，无法精确控制尺寸和颜色。

### 2.2 图标尺寸

| 场景 | 尺寸 | 说明 |
|------|------|------|
| 统计行卡片图标 | 16px SVG，32px 容器 | `.summary-card-icon` |
| 特色卡片图标 | 14px SVG，28px 容器 | `.fc-icon` |
| 侧边栏导航图标 | 16px SVG | `.nav-icon` |
| 按钮内图标 | 14px SVG | 与文字搭配 |
| 行内状态图标 | 6-8px 圆点 | 优先级/状态指示 |

### 2.3 图标映射

完整映射表见 `ui-design-spec.md` §10-§11。关键映射：

| 卡片 | 图标 |
|------|------|
| 项目信息 | `InfoCircleOutlined` |
| 合同概览 | `FileTextOutlined` |
| 项目评估 | `CalculatorOutlined` |
| 需求跟踪 | `UnorderedListOutlined` |
| 关键问题 | `WarningOutlined` |
| 签字追踪 | `EditOutlined` |
| 拓展商机 | `RiseOutlined` |
| 交付物清单 | `PackageOutlined` |
| 项目总结 | `FileSearchOutlined` |

---

## 三、卡片组件结构

### 3.1 统一卡片 DOM 结构

```html
<div class="feature-card">
  <div class="fc-header">
    <div class="fc-title-row">
      <div class="fc-icon">{SVG}</div>
      <span class="fc-title">标题</span>
      <span class="fc-subtitle">· 数量</span>  <!-- 可选 -->
    </div>
    <button class="fc-action">查看全部 →</button>  <!-- 有弹窗时显示 -->
  </div>
  <div class="fc-body">
    <!-- 卡片内容 -->
  </div>
</div>
```

### 3.2 卡片尺寸

- 背景: `var(--bg-surface)`
- 边框: `1px solid var(--border-default)`
- 圆角: `var(--radius-lg)` (12px)
- padding: `16px`
- hover: `box-shadow: var(--shadow-sm)`
- 网格: `grid-template-columns: repeat(3, 1fr)`, gap `16px`

### 3.3 弹窗触发规则

| 卡片 | 是否有弹窗 | 弹窗操作文案 |
|------|-----------|------------|
| 项目信息 | 否 | 纯展示 |
| 合同概览 | 是 | 查看明细 → |
| 项目评估 | 否 | 纯展示 |
| 需求跟踪 | 是 | 管理 → |
| 关键问题 | 是 | 管理 → |
| 签字追踪 | 是 | 查看全部 → |
| 拓展商机 | 否 | 纯展示 |
| 交付物清单 | 是 | 查看全部 → |
| 项目总结 | 是 | 无弹窗，折叠/展开 |

---

## 四、弹窗规范

### 4.1 尺寸

- 标准弹窗: `640px`
- AI 摘要弹窗: `800px`
- 圆角: `var(--radius-lg)` (12px)
- 阴影: `var(--shadow-xl)`

### 4.2 结构

```
┌──────────────────────────────────────┐
│  标题                    [×] 关闭按钮 │  padding: 20px 24px, border-bottom
├──────────────────────────────────────┤
│                                      │
│  内容区                               │  padding: 24px
│                                      │
└──────────────────────────────────────┘
```

### 4.3 弹窗内组件样式

| 组件 | 样式要点 |
|------|---------|
| 时间轴 | 左侧竖线 2px `--border-default`，节点 12px 圆点 |
| 列表行 | padding 10px 0，hover 背景 `--bg-hover` |
| 状态标签 | 11px，`var(--radius-sm)` 圆角，使用语义色浅底 |
| 统计数字 | 3 列网格，居中，24px 粗体 |
| 上传按钮 | `var(--radius-sm)` 圆角，11px，hover 变主色 |

---

## 五、特色卡片映射规则

| 侧边栏选中 | 项目阶段分组 | 特色卡片（3 列） |
|-----------|------------|----------------|
| 所有文件 | 跟随 `project.current_stage` | 按当前阶段显示 |
| 售前 | 售前 | 项目信息 + 合同概览 + 项目评估 |
| 启动 ~ 转客户成功 | 进行中 | 需求跟踪 + 关键问题 + 签字追踪 |
| 关闭 | 关闭 | 拓展商机 + 交付物清单 + 项目总结 |

---

## 六、统计行规则

统计行在所有阶段固定显示 4 张卡片：

1. **文件数量**：项目文件总数
2. **里程碑**：下一步里程碑名称 + 日期，点击弹窗查看完整时间轴
3. **待处理**：未分析文件数
4. **AI 摘要**：「查看摘要」+「生成/更新」按钮

里程碑在统计行，不重复出现在特色卡片中。

---

## 七、Mockup 文件索引

| 文件 | 内容 | 位置 |
|------|------|------|
| `04-card-system-v020.html` | 完整页面交互 mockup（权威参考） | `.qoderwork/mockups/` |
| `05-all-cards-mockup.html` | 全部 10 个卡片概览（收起状态） | `.qoderwork/mockups/` |
| `06-eval-card-web.html` | 项目评估/利润测算（网页版，1200px） | `.qoderwork/mockups/` |
| `07-eval-card-card.html` | 项目评估/利润测算（卡片版，560px） | `.qoderwork/mockups/` |
| `09-card-details.html` | 全部卡片的弹窗/展开详细 UI | `.qoderwork/mockups/` |
| `card-system-v3.html` | 完整页面 mockup（outputs/ 中的参考版本） | `outputs/` |

**权威参考顺序**：`04-card-system-v020.html` > `card-system-v3.html` > `05-all-cards-mockup.html` > `09-card-details.html`

---

## 八、未来 UI 优化注意事项

1. 任何 UI 修改必须先对照 `design-tokens.md` 和 `ui-design-spec.md`
2. 新增卡片/组件必须遵循 §3.1 的统一 DOM 结构
3. 新增弹窗必须遵循 §4 的规范
4. 新增图标必须使用 SVG，映射表见 `ui-design-spec.md` §10
5. 修改颜色/间距/圆角/阴影必须使用 design tokens，不允许硬编码
6. Mockup 文件统一放在 `.qoderwork/mockups/` 目录，编号递增
