# 测试修订计划

> 2026-06-28 | 基于测试质量审计 + 最佳实践研究

---

## [S1] 问题诊断

### 当前测试状态
- 总计 387 个测试，全部通过
- 真实场景测试发现：37% 分类错误率、卡片数据全空、交互Bug
- **结论：测试覆盖了"代码能跑"，但没覆盖"代码跑对了"**

### 根因：三类无效测试

| 类型 | 占比 | 问题 |
|------|------|------|
| Mock-output 测试 | ~40% | mock 函数返回固定值，验证的是 mock 而非代码 |
| Happy-path 渲染测试 | ~35% | 用完美数据验证渲染，不测空数据/错误数据 |
| 字符串包含测试 | ~15% | 检查 prompt 是否包含某些词，不测实际 AI 输出 |

### 有效测试占比
- 真正验证行为的测试：约 50-60 个（~15%）
- 其余 300+ 个是表面测试

---

## [S2] 修订原则（基于 React Testing Library + Vitest 最佳实践）

### 核心理念
> "The more your tests resemble the way your software is used, the more confidence they can give you." — Kent C. Dodds

### 修订规则

1. **测试行为，不测实现**：mock 外部 API（如 aiService）是合理的，但要测从 mock 返回到组件渲染到 metadata 写入的完整数据流
2. **测真实数据流**：从输入到输出的完整路径，不跳过中间步骤
3. **测边界条件**：空数据、malformed JSON、undefined 字段、NaN 值、超长文本
4. **测副作用**：文件移动、数据库写入、IPC 调用
5. **保留 colocated 模式**：组件测试放在组件旁 `__tests__/` 目录，不做大规模搬迁

### 测试分离：Vitest Projects（非 Tags）

根据 Vitest 官方文档，`projects` 配置是分离不同运行环境的标准方案：

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    projects: [
      {
        name: 'electron',
        include: ['electron/**/*.test.ts'],
        environment: 'node',
      },
      {
        name: 'renderer',
        include: ['src/**/*.test.{ts,tsx}'],
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
      },
    ],
  },
})
```

运行方式：`npx vitest run --project electron` 或 `npx vitest run --project renderer`

> 注：Tags 用于标注测试属性（如 `@slow`、`@smoke`），不适合分离环境。详见 [Vitest 官方文档](https://vitest.dev/guide/projects)。

---

## [S3] 需要删除的无效测试

### 3.1 Mock-output 测试（删除或重写）

| 文件 | 问题 | 处理 |
|------|------|------|
| `classify.test.ts` | mock parseClassifyResponse 返回固定值，不测真实分类 | 重写为集成测试 |
| `upload.test.ts` | 只测文件大小限制，90行分类逻辑零覆盖 | 重写，覆盖 classifyAndMoveFile |
| `projectHome.hooks.test.ts` | mock aiService 返回固定值，不测真实 IPC 调用 | 保留框架，补充真实数据场景 |

### 3.2 Happy-path 渲染测试（补充边界条件）

> 注：5 个卡片组件**已测试 `metadata: null` 空状态**（显示"暂无XX数据"）。真正缺失的是 malformed JSON、部分字段缺失、数组内元素字段不完整等边界场景。

| 文件 | 当前覆盖 | 需补充 |
|------|---------|--------|
| `ContractCard.test.tsx` | ✅ null metadata | malformed JSON、amount=0、items 字段缺失 |
| `RequirementCard.test.tsx` | ✅ null metadata | malformed JSON、空数组、item 缺 name |
| `IssueCard.test.tsx` | ✅ null metadata | malformed JSON、空数组 |
| `OpportunityCard.test.tsx` | ✅ null metadata | malformed JSON、空数组 |
| `SummaryCard.test.tsx` | ✅ null metadata | malformed JSON、overview='' |

### 3.3 字符串包含测试（精简）

| 文件 | 问题 | 处理 |
|------|------|------|
| `classify-prompt.test.ts` | 14 个字符串包含断言 | 精简为 5 个关键断言 |
| `chat-prompt.test.ts` | 类似 | 精简 |
| `analyze-brief.test.ts` | 只检查 `---BRIEF---` 存在 | 补充 fallback 行为测试 |

---

## [S4] 需要新增的测试

### 4.1 数据流集成测试（最高优先级）

**目标**：验证 classify → mergeKeyInfo → metadata 持久化 → 组件读取 的完整链路

| 测试场景 | 测试什么 | 验收标准 |
|---------|---------|---------|
| AI 分类后 metadata 写入 | classify 调用后 metadata 包含 contract_amount | metadata.contract_amount !== undefined |
| 结构化提取后 metadata 写入 | extractStructuredDataAsync 后 metadata 包含 requirements | metadata.requirements.length > 0 |
| 多文件分类后 metadata 合并 | 两个文件分类后 metadata 包含两个文件的 key_info | 字段不被覆盖 |
| upload 路径 filename hints | 上传"SOW工作说明书"后 category=售前 | hints 生效 |
| ai:analyze BRIEF fallback | AI 响应无 BRIEF 标记时 project_overview 取前 200 字 | project_overview 非空 |

### 4.2 组件边界条件测试

| 测试场景 | 当前状态 | 需要补充 |
|---------|---------|---------|
| metadata = '{}' | 未测 | 卡片显示空状态 |
| metadata = 'invalid json' | 未测 | parseMetadata 返回 {}，卡片显示空状态 |
| contract_amount = 0 | 未测 | 卡片显示"暂无合同数据" |
| requirements = [] | 未测 | 卡片显示"暂无需求记录" |
| project_overview = '' | 未测 | 卡片显示"暂无项目总结" |

### 4.3 Hook 行为测试

| 测试场景 | 当前状态 | 需要补充 |
|---------|---------|---------|
| handleBatchClassify 并发 | 未测 | 3个文件并发分类，验证进度更新 |
| handleBatchClassify 取消 | 未测 | 分类过程中取消，验证中断 |
| handleGenerateSummary | 未测 | 调用 ai:analyze，验证 project_overview 写入 |
| loadCriticalIssues | 未测 | 解析 summary markdown，验证计数 |

### 4.4 文件提取测试

| 测试场景 | 当前状态 | 需要补充 |
|---------|---------|---------|
| pptx 提取 | 未测 | 用真实 pptx 文件验证 slide 文本提取 |
| 空 xlsx 提取 | 未测 | 内容只有 [Sheet1] 时返回空 |
| PDF 扫描件 | 未测 | 内容少于 10 字符时返回 null |

---

## [S5] 测试文件组织

### 目录结构（保留 colocated 模式）

```
# 保持不变（colocated，组件旁 __tests__/ 目录）
src/components/ProjectHome/__tests__/*.test.tsx   # 组件测试
src/components/Chat/__tests__/*.test.tsx          # Chat 测试
src/utils/__tests__/*.test.ts                     # 工具函数测试
electron/**/__tests__/*.test.ts                   # 后端测试

# 新增（跨模块集成测试，无法 colocated）
src/__tests__/integration/
  classify-data-flow.test.ts      # classify → metadata 完整链路
  upload-hints.test.ts            # upload 路径 filename hints
  analyze-brief-fallback.test.ts  # BRIEF 标记 fallback
  extract-structured.test.ts      # 结构化提取执行验证
  card-boundary.test.ts           # 卡片 malformed/partial/undefined 场景

# Vitest projects 配置（环境分离）
# electron 项目：node 环境
# renderer 项目：jsdom 环境
```

### 运行命令

```bash
# 只跑 Electron 后端测试（node 环境）
npx vitest run --project electron

# 只跑前端测试（jsdom 环境）
npx vitest run --project renderer

# 跑全部
npx vitest run
```

---

## [S6] 实施计划

### Phase 1：精简无效测试 + 补充边界条件（1.5h）
- 删除/精简 mock-output 测试（classify.test.ts、upload.test.ts）
- 为 5 个卡片组件补充 malformed JSON / undefined 字段 / NaN 场景
- 精简 prompt 字符串测试

### Phase 2：数据流集成测试 + Vitest Projects（3.5h）
- 配置 vitest.config.ts projects（electron + renderer 环境分离）
- 新建 classify-data-flow.test.ts
- 新建 upload-hints.test.ts
- 新建 analyze-brief-fallback.test.ts
- 新建 extract-structured.test.ts

### Phase 3：Hook 和组件行为测试（2.5h）
- 补充 handleBatchClassify/handleGenerateSummary 测试
- 补充 FileListTable 分页/取消测试
- 补充 pptx/空文件提取测试
- 新建 card-boundary.test.ts（malformed/partial/undefined 场景）

### Phase 4：配置和验证（0.5h）
- 验证 projects 配置正确分离环境
- 验证 `--project electron` 和 `--project renderer` 独立运行
- 更新 package.json scripts

**总工时：约 8h**

---

## [S7] 验证标准

修订完成后必须满足：
1. 所有 P0/P1 bug 有对应测试用例
2. 空数据 / malformed JSON / undefined 字段 / NaN 场景覆盖率 > 80%
3. 数据流集成测试覆盖 classify → metadata → 组件
4. Vitest projects 正确分离 electron（node）和 renderer（jsdom）环境
5. `npx vitest run --project electron` 可独立运行后端测试
6. 保留 colocated 模式，不做大规模目录搬迁

---

## 审查意见（2026-06-28 代码验证 + 网络搜索验证）

### 代码验证纠正

**387 个测试 / 62 个文件**：数字准确，已验证。

**S3.1 描述纠正**：

- `upload.test.ts` 并非"只测文件大小限制"——实际有 2 个测试：文件大小限制 + 上传成功路径（116 行）。但 `classifyAndMoveFile` 确实没有被覆盖，这个判断正确。
- `classify-prompt.test.ts` 并非"14 个字符串包含断言"——实际有 **17 个 `expect()` 调用**（部分在循环内），13 个 test case。数字接近但不精确。

**S3.2 描述纠正**：

卡片测试并非"只用完美数据"——5 个卡片组件**都已测试 `metadata: null` 空状态**（显示"暂无XX数据"）。文档遗漏了这一点。真正缺失的是：malformed JSON、部分字段缺失、数组内元素字段不完整等边界场景。

**S4.2 / S5 重复项纠正**：

文档建议新增的测试中，有两个**已经存在**：

- `parseMetadata` 单元测试：已存在于 `src/utils/__tests__/metadata.test.ts`（4 个测试，覆盖 null / 空字符串 / 正常 JSON / 非法 JSON）。
- `structured-merge` 单元测试：已存在于 `electron/utils/__tests__/structured-merge.test.ts`（8 个测试，覆盖 requirements / key_issues / opportunities 的合并去重）。

S5 目录结构中将这两个文件列入 `unit/` 目录是多余的——它们已经在 `src/utils/__tests__/` 和 `electron/utils/__tests__/` 中，不需要搬迁。

---

### S2 方案修正：Vitest Tags 不是最佳方案

文档提出用 `test.tags` 配置来分离 unit / integration / component 测试。搜索验证发现**这不是 Vitest 社区推荐的做法**。

**Vitest 官方推荐：`projects` 配置**

根据 [Vitest 官方文档](https://vitest.dev/guide/projects) 和 [Vitest 3.2 发布说明](https://vitest.dev/blog/vitest-3-2.html)，从 Vitest 3.x 开始，`workspace` 功能已被 `projects` 数组替代。推荐做法是在单个 `vitest.config.ts` 中定义多个 project，每个 project 可以有独立的 `include`、`environment`、`setupFiles`：

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    projects: [
      {
        // 后端测试：node 环境
        name: 'electron',
        include: ['electron/**/*.test.ts'],
        environment: 'node',
      },
      {
        // 前端单元测试 + 组件测试：jsdom 环境
        name: 'renderer',
        include: ['src/**/*.test.{ts,tsx}'],
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
      },
    ],
  },
})
```

运行方式：`npx vitest run --project electron` 或 `npx vitest run --project renderer`。

**为什么不用 tags**：

- Tags 的设计目的是标注测试属性（如 `@slow`、`@flaky`、`@smoke`），不是用来分离不同运行环境的
- Tags 不能为不同测试集指定不同的 `environment`（node vs jsdom），而 projects 可以
- Electron 项目的核心痛点是后端（node）和前端（jsdom）需要不同环境，tags 解决不了这个问题
- [社区讨论](https://github.com/vitest-dev/vitest/discussions/4675)中，分离 unit/integration 的主流方案也是 projects 或目录隔离，不是 tags

**建议修正**：用 `projects` 替代 tags 方案。如果仍需要在 project 内部进一步细分（如只跑集成测试），可以结合 tags 作为二级过滤，但主分离机制应该是 projects。

---

### S5 方案修正：测试目录组织

文档提出将所有测试重组到 `src/__tests__/unit/`、`src/__tests__/integration/`、`src/__tests__/component/` 三个目录。这个方案有两个问题：

**问题 1：破坏现有 colocated 模式**

当前项目 45 个前端测试文件中有 **30+ 个使用 colocated 模式**（测试文件放在组件旁边的 `__tests__/` 目录中，如 `src/components/ProjectHome/__tests__/ContractCard.test.tsx`）。这是 React 社区的主流实践，IDE 导航友好，组件和测试一起移动时不会遗漏。

文档的方案会把所有组件测试从 colocated 位置搬到 `src/__tests__/component/`，导致：
- 修改组件时找不到对应测试（需要跨目录查找）
- 重命名/移动组件时测试容易遗漏
- 与现有 30+ 个 colocated 测试的组织风格冲突

**问题 2：Electron 测试被忽略**

文档的目录结构只涉及 `src/` 和 `electron/` 两个顶层目录，但没有考虑 projects 配置中 environment 分离的需求。Electron 后端测试（node 环境）和前端测试（jsdom 环境）应该通过 projects 配置分离，而不是通过目录重组。

**建议修正**：

保留现有 colocated 模式，不做大规模目录搬迁。具体做法：

```
# 保持不变
src/components/ProjectHome/__tests__/*.test.tsx   # 组件测试，colocated
src/utils/__tests__/*.test.ts                      # 工具函数测试，colocated
electron/**/__tests__/*.test.ts                    # 后端测试，colocated

# 新增
src/__tests__/integration/                         # 集成测试（跨模块，无法 colocated）
  classify-data-flow.test.ts
  upload-hints.test.ts
  analyze-brief-fallback.test.ts
  extract-structured.test.ts
```

集成测试放在 `src/__tests__/integration/` 是合理的，因为它们涉及多个模块的交互，没有单一组件可以 colocate。

---

### S4 补充：搜索验证的测试最佳实践

根据 [React Testing in 2025](https://dev.to/tahamjp/react-testing-in-2025-stop-mocking-start-trusting-your-components-3h4f) 和 [React Testing Library + Vitest 常见错误](https://medium.com/@samueldeveloper/react-testing-library-vitest-the-mistakes-that-haunt-developers-and-how-to-fight-them-like-ca0a0cda2ef8) 的搜索验证：

**1. "只 mock 外部 API，不 mock 内部组件"**

文档 S3.1 说"不 mock 内部函数"，方向正确。但具体到 `projectHome.hooks.test.ts`，当前 mock 了整个 `aiService`——这属于 mock 外部 API（AI 服务），是合理的。不应该为了"测真实 IPC 调用"而真的调用 AI API。正确的做法是：保持 aiService mock，但测试从 mock 返回到组件渲染到 metadata 写入的完整数据流。

**2. "一个强集成测试 > 十个弱单元测试"**

文档 S4.1 提出的"数据流集成测试"方向正确。建议每个集成测试覆盖一个完整的用户场景（如"上传文件 → 分类 → metadata 更新 → 卡片显示"），而不是拆成多个只验证单个环节的测试。

**3. 卡片组件应测试的错误场景**

搜索验证发现，除了空数据，还应测试：
- `metadata` 是非法 JSON 字符串时（`parseMetadata` 返回 `{}`，卡片不应崩溃）
- 数组字段是 `undefined` 而非 `[]` 时（如 `metadata.requirements` 不存在）
- 数值字段是 `0`、`null`、`NaN` 时的渲染行为
- 超长文本（>1000 字符）的截断行为

---

### S6 工时修正

文档估算总工时 8h。基于代码验证的发现：

- 不需要搬迁 `parseMetadata` 和 `structured-merge` 测试（已存在），节省约 0.5h
- 不需要大规模目录重组（保留 colocated），节省约 0.5h
- 但需要额外工作：将 tags 方案改为 projects 方案（约 0.5h）
- 卡片组件需补充的边界场景比文档描述的更多（不只是空数据，还有 malformed/partial/undefined）

修正后总工时仍约 **8h**，但分配不同：Phase 1 从 2h 减到 1.5h（少搬迁），Phase 4 从 1h 减到 0.5h（少重组），Phase 2 从 3h 增到 3.5h（projects 配置 + 更多边界场景），Phase 3 从 2h 增到 2.5h（补充更多错误场景测试）。
