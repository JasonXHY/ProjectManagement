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

1. **测试行为，不测实现**：不 mock 内部函数，测用户可见的输出
2. **测真实数据流**：从输入到输出的完整路径，不跳过中间步骤
3. **测边界条件**：空数据、错误数据、异常路径
4. **测副作用**：文件移动、数据库写入、IPC 调用
5. **按场景分类**：单元测试 / 集成测试 / 端到端测试 分开运行

### 测试分类标签（Vitest）

```
// vitest.config.ts
{
  test: {
    include: ['**/*.test.{ts,tsx}'],
    // 按标签过滤：
    // vitest run --tags unit     只跑单元测试
    // vitest run --tags integration  只跑集成测试
    // vitest run --tags e2e      只跑端到端测试
  }
}
```

---

## [S3] 需要删除的无效测试

### 3.1 Mock-output 测试（删除或重写）

| 文件 | 问题 | 处理 |
|------|------|------|
| `classify.test.ts` | mock parseClassifyResponse 返回固定值，不测真实分类 | 重写为集成测试 |
| `upload.test.ts` | 只测文件大小限制，90行分类逻辑零覆盖 | 重写，覆盖 classifyAndMoveFile |
| `projectHome.hooks.test.ts` | mock aiService 返回固定值，不测真实 IPC 调用 | 保留框架，补充真实数据场景 |

### 3.2 Happy-path 渲染测试（补充边界条件）

| 文件 | 问题 | 处理 |
|------|------|------|
| `ContractCard.test.tsx` | 只用完美 metadata 测试 | 补充空数据/损坏JSON场景 |
| `RequirementCard.test.tsx` | 同上 | 补充空数组/字段缺失场景 |
| `IssueCard.test.tsx` | 同上 | 补充空数组场景 |
| `OpportunityCard.test.tsx` | 同上 | 补充空数组场景 |
| `SummaryCard.test.tsx` | 同上 | 补充空 overview 场景 |

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

### 新目录结构

```
src/__tests__/
├── unit/                    # 单元测试（快，无 IO）
│   ├── parseMetadata.test.ts
│   ├── format.test.ts
│   ├── milestones.test.ts
│   ├── sanitize.test.ts
│   ├── structured-merge.test.ts
│   └── file-styles.test.ts
├── integration/             # 集成测试（涉及多个模块）
│   ├── classify-data-flow.test.ts      # classify → metadata 完整链路
│   ├── upload-hints.test.ts            # upload 路径 filename hints
│   ├── analyze-brief-fallback.test.ts  # BRIEF 标记 fallback
│   ├── extract-structured.test.ts      # 结构化提取执行验证
│   └── card-empty-states.test.ts       # 卡片空数据场景
└── component/               # 组件测试（渲染 + 交互）
    ├── ContractCard.test.tsx
    ├── RequirementCard.test.tsx
    ├── IssueCard.test.tsx
    ├── OpportunityCard.test.tsx
    ├── SummaryCard.test.tsx
    ├── StageSidebar.test.tsx
    ├── FileListTable.test.tsx
    └── FeatureCards.test.tsx

electron/__tests__/
├── classify-prompt.test.ts  # 精简后的 prompt 测试
├── upload-handler.test.ts   # 重写，覆盖完整分类流程
└── file-extractor.test.ts   # 补充 pptx/空文件场景
```

### 运行命令

```bash
# 只跑单元测试（< 10s）
npx vitest run --tags unit

# 只跑集成测试（~ 30s）
npx vitest run --tags integration

# 只跑组件测试（~ 20s）
npx vitest run --tags component

# 跑全部（~ 60s）
npx vitest run
```

---

## [S6] 实施计划

### Phase 1：删除无效测试 + 补充边界条件（2h）
- 删除/精简 mock-output 测试
- 为 5 个卡片组件补充空数据场景
- 精简 prompt 字符串测试

### Phase 2：数据流集成测试（3h）
- 新建 classify-data-flow.test.ts
- 新建 upload-hints.test.ts
- 新建 analyze-brief-fallback.test.ts
- 新建 extract-structured.test.ts

### Phase 3：Hook 和组件行为测试（2h）
- 补充 handleBatchClassify/handleGenerateSummary 测试
- 补充 FileListTable 分页/取消测试
- 补充 pptx/空文件提取测试

### Phase 4：组织和标签（1h）
- 按 unit/integration/component 重组目录
- 添加 Vitest tag 标注
- 更新 package.json scripts

**总工时：约 8h**

---

## [S7] 验证标准

修订完成后必须满足：
1. 所有 P0/P1 bug 有对应测试用例
2. 空数据/错误数据场景覆盖率 > 80%
3. 数据流集成测试覆盖 classify → metadata → 组件
4. 单元测试 < 10s，集成测试 < 30s
5. `npx vitest run --tags unit` 可独立运行
