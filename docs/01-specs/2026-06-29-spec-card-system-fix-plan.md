# PMAer v0.2.0 卡片系统修复计划

> 创建时间：2026-06-25 | 基于：card-system-design-decisions.md + 05-all-cards-mockup.html + 09-card-details.html

---

## 修复原则

1. 严格按照设计决策文档执行
2. 每个任务完成后验证测试通过
3. 不改变现有已实现且符合设计的功能

---

## 任务一：隐藏"项目信息"重复卡片

**问题**：ProjectInfoPlaceholderCard与项目信息卡片功能重复

**修复内容**：
- 在FeatureCards.tsx中移除ProjectInfoPlaceholderCard的渲染
- 保留ProjectInfoCard（已实现的项目信息卡片）

**涉及文件**：`src/components/ProjectHome/FeatureCards.tsx`

---

## 任务二：签字追踪卡片重构

### 2.1 设计决策回顾（§8）

**定位**：项目关键确认文件跟踪工具
**核心功能**：根据项目金额自动生成签字文件清单

### 2.2 签字文件生成规则（§8.2）

| 档位 | 金额范围 | 必选文件 | 说明 |
|------|----------|----------|------|
| A | ≥50万 | 19个 | 最高要求 |
| B | 10-50万 | 8个 | 标准要求 |
| C | <10万 | 5个 | 最低要求 |

**过滤规则**：若合同不含开发服务，去掉"开发需求设计确认单"和"开发完成确认单"

### 2.3 签字文件模板库（初始版本）

**A档（50万以上）必选文件**：
1. 合同原件
2. 补充协议
3. 开工报告
4. 需求规格说明书确认单
5. 业务蓝图确认单
6. 开发需求设计确认单（有开发时）
7. 开发完成确认单（有开发时）
8. 测试用例确认单
9. 测试报告确认单
10. 上线确认单
11. 验收确认单
12. 项目结项报告
13. 培训确认单
14. 运维交接确认单
15. 质量评估表
16. 客户满意度调查表
17. 付款申请单-首付款
18. 付款申请单-进度款
19. 付款申请单-尾款

**B档（10-50万）必选文件**：
1. 合同原件
2. 需求规格说明书确认单
3. 业务蓝图确认单
4. 开发需求设计确认单（有开发时）
5. 开发完成确认单（有开发时）
6. 上线确认单
7. 验收确认单
8. 付款申请单

**C档（<10万）必选文件**：
1. 合同原件
2. 需求确认单
3. 上线确认单
4. 验收确认单
5. 付款申请单

### 2.4 数据模型

```typescript
interface SignatureDoc {
  id: string
  name: string                    // 文件名称
  required: boolean               // 是否必须（根据档位判断）
  status: 'unsigned' | 'signed'   // 签字状态
  signer?: string                 // 签字人
  signedAt?: string               // 签字日期
  fileId?: string                 // 关联的已上传文件ID
  source: 'auto' | 'manual'      // 自动生成 or 手动添加
  category?: string               // 所属阶段（售前/需求/上线/验收等）
}
```

**存储位置**：`project.metadata.signature_docs` JSON数组

### 2.5 UI设计

**卡片收起状态**：
```
┌─────────────────────────────────┐
│ [图标] 签字追踪        查看全部 → │
├─────────────────────────────────┤
│ [████████░░░░] 3/5 已签         │
│ ☐ 上线确认单.pdf      待签字    │
│ ☐ 验收确认单.docx     待签字    │
│ 规则：50万以下 · 含开发内容      │
└─────────────────────────────────┘
```

**弹窗状态**：
```
┌─────────────────────────────────────┐
│ 签字文件追踪          [+ 手动添加]  │
├─────────────────────────────────────┤
│ [3 已签] [2 待签] [60% 完成率]      │
├─────────────────────────────────────┤
│ 📄 XX项目合同v2.pdf   售前  已签字  │
│ 📄 需求规格说明书确认单 需求 已签字  │
│ 📄 补充协议.docx      售前  已签字  │
│ 📄 上线确认单.pdf     上线  待签字 [上传]│
│ 📄 验收确认单.docx    验收  待签字 [上传]│
└─────────────────────────────────────┘
```

### 2.6 实现步骤

1. 创建`SignatureDoc`类型定义
2. 实现签字文件清单生成函数（根据金额档位+开发内容）
3. 在project.metadata中初始化signature_docs
4. 重写SignatureCard组件（收起状态）
5. 重写签字追踪弹窗（添加上传按钮）
6. 实现文件上传联动逻辑
7. 添加测试用例

### 2.7 涉及文件
- `src/types/index.ts` - 添加SignatureDoc类型
- `src/components/ProjectHome/cards/SignatureCard.tsx` - 重写
- `src/components/ProjectHome/SignatureDetailModal.tsx` - 新建
- `src/utils/signature-generator.ts` - 新建（生成函数）
- `electron/database/projects.ts` - 添加signature_docs字段

---

## 任务三：交付物清单卡片重构

### 3.1 设计决策回顾（§10）

**定位**：项目交付成果版本管理工具
**核心功能**：跟踪蓝图/手册/脚本/方案等版本演进
**关键原则**：不关联签字件

### 3.2 交付物定义

交付物是**交付给客户的工作成果**，包括：
- 业务蓝图
- 用户操作手册
- 测试脚本/测试报告
- 技术方案文档
- 培训材料
- 运维文档

**与签字文件的区别**：
- 交付物：实际工作成果（蓝图、手册、脚本）
- 签字文件：确认单据（确认单、审批单）

### 3.3 数据模型

```typescript
interface Deliverable {
  id: string
  name: string                    // 交付物名称
  type: string                    // 类型（蓝图/手册/脚本/方案/...）
  status: 'draft' | 'merged' | 'ready' | 'delivered'
  currentVersion: string          // 当前版本号
  versions: Version[]             // 版本历史
  createdAt: string
  updatedAt: string
}

interface Version {
  id: string
  versionNo: string               // 版本号（v1.0, v2.0, 最终版）
  status: 'draft' | 'merged' | 'final'
  fileId?: string                 // 关联的文件ID
  createdAt: string
  note?: string                   // 版本说明
}
```

**存储位置**：`project.metadata.deliverables` JSON数组

### 3.4 状态定义

| 状态 | 中文 | 说明 |
|------|------|------|
| draft | 草稿 | 初始版本 |
| merged | 整合中 | 多版本合并 |
| ready | 待交付 | 准备交付客户 |
| delivered | 已交付 | 客户已接收 |

### 3.5 UI设计

**卡片收起状态**：
```
┌─────────────────────────────────┐
│ [图标] 交付物清单 · 6项  查看全部 →│
├─────────────────────────────────┤
│ ✓ 业务蓝图      v2.0  已交付    │
│ ✓ 用户操作手册  v1.0  待交付    │
│ ☐ 测试脚本      v3.0  整合中    │
└─────────────────────────────────┘
```

**弹窗状态**：
```
┌─────────────────────────────────────┐
│ 交付物清单 · 6项                     │
├─────────────────────────────────────┤
│ ✓ 业务蓝图      方案   v2.0  已交付  │
│   ├ v2.0 最终交付版 2026-07-15 [查看]│
│   ├ v1.1 整合客户反馈 2026-07-01     │
│   └ v1.0 初稿 2026-06-20            │
│ ✓ 用户操作手册  手册   v1.0  待交付  │
│ ☐ 测试脚本      脚本   v3.0  整合中  │
└─────────────────────────────────────┘
```

### 3.6 实现步骤

1. 创建`Deliverable`和`Version`类型定义
2. 重写DeliverableCard组件（收起状态）
3. 重写交付物清单弹窗（添加版本历史展开）
4. 在project.metadata中初始化deliverables
5. 添加测试用例

### 3.7 涉及文件
- `src/types/index.ts` - 添加Deliverable/Version类型
- `src/components/ProjectHome/cards/DeliverableCard.tsx` - 重写
- `src/components/ProjectHome/DeliverableDetailModal.tsx` - 新建
- `electron/database/projects.ts` - 添加deliverables字段

---

## 任务四：合同概览卡片调整

### 4.1 设计决策回顾（§3）

**收起状态**：按05-all-cards-mockup.html设计
**弹窗状态**：ContractDetailModal（已符合设计）

### 4.2 收起状态UI（05版本）

```
┌─────────────────────────────────┐
│ [图标] 合同概览        查看明细 → │
├─────────────────────────────────┤
│ 合同总额 ¥75.4万  已确认 ¥18.15万│
│ [████░░░░░░] 24%                │
│ 已确认 24% · 待确认 ¥57.25万    │
│ 金蝶私有云产品    ¥17.52万      │
│ 实施服务（58人天） ¥36.30万      │
│ 客户化开发        ¥7.48万       │
└─────────────────────────────────┘
```

### 4.3 实现步骤

1. 修改ContractCard组件（收起状态）
2. 添加进度条和已确认收入显示
3. 确保弹窗ContractDetailModal不变
4. 添加测试用例

### 4.4 涉及文件
- `src/components/ProjectHome/cards/ContractCard.tsx` - 修改

---

## 任务五：里程碑卡片完善

### 5.1 设计决策回顾（§2）

**核心功能**：
1. 合并项目里程碑+付款里程碑
2. 合同签订作为里程碑
3. 手动完成与编辑锁定（manuallyEdited）
4. 付款状态用"已确认"/"待确认"
5. 按项目阶段分组

### 5.2 数据模型扩展

```typescript
interface Milestone {
  id: string
  title: string
  date: string
  type: 'milestone' | 'key_node' | 'payment'
  category?: string               // 所属阶段（启动/方案/构建/测试/上线/验收）
  amount?: number                 // 付款金额（payment类型）
  confirmed?: boolean             // 是否已确认（payment类型）
  implemented?: boolean           // 实施合同金额
  development?: number            // 开发合同金额
  manuallyEdited?: boolean        // 手动编辑标志位
}
```

### 5.3 UI设计

**卡片收起状态**（保持现有）：
- 显示下一步里程碑名称+日期
- 点击弹窗查看完整时间轴

**弹窗状态**（需完善）：
```
┌─────────────────────────────────────┐
│ 里程碑时间轴                         │
├─────────────────────────────────────┤
│ 售前阶段                             │
│ ● 合同签署 2026-06-05 ★             │
│   实施 ¥7.26万 / 开发 ¥1.50万 已确认 │
│                                     │
│ 方案阶段                             │
│ ● 需求确认 2026-06-15 ✓             │
│ ● 方案评审 2026-06-18 ✓             │
│                                     │
│ 上线阶段                             │
│ ◐ 上线确认 2026-07-15 下一步        │
│   实施 ¥7.26万 / 开发 ¥1.50万 待确认 │
│                                     │
│ 验收阶段                             │
│ ○ 客户验收 2026-07-20               │
└─────────────────────────────────────┘
```

### 5.4 实现步骤

1. 扩展Milestone类型定义
2. 修改MilestoneModal（添加阶段分组+付款信息）
3. 添加manuallyEdited标志位逻辑
4. 确保合同签订作为里程碑
5. 添加测试用例

### 5.5 涉及文件
- `src/types/index.ts` - 扩展Milestone类型
- `src/components/ProjectHome/MilestoneModal.tsx` - 修改
- `electron/shared/stages.ts` - 确认阶段定义

---

## 任务六：测试用例补充

为每个修改的组件添加/更新测试用例：
1. SignatureCard测试（自动生成清单、上传按钮）
2. DeliverableCard测试（版本管理、状态标签）
3. ContractCard测试（进度条、已确认收入）
4. MilestoneModal测试（阶段分组、付款信息）

---

## 执行顺序

1. **任务一**：隐藏ProjectInfoPlaceholderCard（简单，5分钟）
2. **任务二**：签字追踪卡片重构（复杂，核心功能）
3. **任务三**：交付物清单卡片重构（复杂，核心功能）
4. **任务四**：合同概览卡片调整（中等，UI调整）
5. **任务五**：里程碑卡片完善（中等，功能增强）
6. **任务六**：测试用例补充（持续）

---

## 验证清单

每个任务完成后：
- [ ] 运行所有测试通过
- [ ] 对比mockup确认UI一致
- [ ] 确认数据模型符合设计决策
- [ ] 确认交互逻辑符合业务流程
