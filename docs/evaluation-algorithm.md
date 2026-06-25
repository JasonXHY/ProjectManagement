# PMAer 项目利润测算算法

> 来源：低利润率测算表标准模板 + 项目资源人天及成本表-导入模版202605
> 版本：2.0 | 2026-06-23
> 用途：AI 对话时协助用户快速测算项目利润率，无需用户逐个数字手动测试

---

## 一、输入参数

| 参数 | 说明 | 来源 |
|------|------|------|
| `contractAmount` | 交付合同总额（自有产品，不含ISV） | 用户输入 |
| `internalDays` | 内部人天总数 | 用户输入 |
| `externalDays` | 外包人天总数 | 用户输入 |
| `internalUnitPrice` | 内部人天单价（根据角色职级自动带出） | 用户选择 |
| `externalUnitPrice` | 外包人天单价 | 用户输入（默认1200） |
| `internalTravel` | 内部差旅及其他费用 | 用户输入 |
| `externalTravel` | 外部差旅及其他费用 | 用户输入 |

**说明**：本工具为简化版，不含 ISV/子公司/独立咨询合同的计算。`contractAmount` 即为自有产品合同总额，直接按人天占比分配给内部和外包。

## 二、内部人天单价表

```
INTERNAL_UNIT_PRICES = {
  "实施顾问": {"C1-1":1270,"C1-2":1440,"C2-1":1560,"C2-2":1970,"C3-1":2550,"C3-2":3030,"C4-1":3940},
  "开发工程师": {"C1-1":1270,"C1-2":1440,"C2-1":1560,"C2-2":1970,"C3-1":2550,"C3-2":3030,"C4-1":3940},
  "项目经理": {"C1-1":1270,"C1-2":1440,"C2-1":1560,"C2-2":1970,"C3-1":2550,"C3-2":3030,"C4-1":3940},
  "测试工程师": {"C1-1":1270,"C1-2":1440,"C2-1":1560,"C2-2":1970,"C3-1":2550,"C3-2":3030,"C4-1":3940},
  "运维工程师": {"服务1-1":1060,"服务1-2":1200}
}
```

## 三、核心计算公式

### 3.1 成本计算

```
// 内部成本
internalPersonDayCost = Σ(每个成员的人天 × 各自单价)
internalTotalCost = internalPersonDayCost + internalTravel

// 外包成本
externalPersonDayCost = externalDays × externalUnitPrice
externalTotalCost = externalPersonDayCost + externalTravel

// 总成本
totalCost = internalTotalCost + externalTotalCost
```

### 3.2 工作量占比

```
totalDays = internalDays + externalDays
internalWorkloadRatio = internalDays / totalDays
externalWorkloadRatio = externalDays / totalDays
```

### 3.3 合同金额分配（Excel 原始公式）

```
// 合同总额直接按人天占比分配（简化版不含ISV）
internalAllocatedContract = contractAmount × internalWorkloadRatio
externalAllocatedContract = contractAmount × externalWorkloadRatio
```

### 3.4 利润率计算（Excel 公式：=(L-J)/L）

```
internalProfitRate = (internalAllocatedContract - internalTotalCost) / internalAllocatedContract
externalProfitRate = (externalAllocatedContract - externalTotalCost) / externalAllocatedContract
overallProfitRate = (contractAmount - totalCost) / contractAmount
```

### 3.5 利润金额

```
internalProfit = internalAllocatedContract - internalTotalCost
externalProfit = externalAllocatedContract - externalTotalCost
overallProfit = contractAmount - totalCost
```

## 四、低利润判定标准（统一规则）

| 指标 | 红线 | 公式 | 说明 |
|------|------|------|------|
| 内部利润率 | < 0% | `(iAlloc - iTotalCost) / iAlloc` | 自有交付不能亏本 |
| 外包利润率-自有产品 | < 40% | `(eAlloc - eTotalCost) / eAlloc` | 触发低利润审批 |

**参考红线（仅展示，不影响计算）：**

| 指标 | 红线 | 说明 |
|------|------|------|
| 整包：自身交付成本占比 | ≤ 5% | 1个项目外包给1个伙伴 |
| 类整包：自身交付成本占比 | ≤ 10% | 1个项目外包给多个伙伴 |

**注意**：分包和类整包的区别仅在于自身交付成本占比的参考红线不同（5% vs 10%），但利润率红线（内部>0%、外包>40%）在所有模式下一致。因此简化版不做模式切换，统一适用同一套红线规则。

## 五、公式验证（基于 Excel 示例数据）

**输入**（与 Excel ②利润率测算表-分包 Row 3/9 一致）：
- 合同总额 = 682,000（自有产品部分，不含 ISV）
- 内部人天 = 34，内部单价 = 1510，内部差旅 = 23,000
- 外包人天 = 680，外包单价 = 1000，外部差旅 = 0

**计算**：
```
内部人天成本 = 34 × 1510 = 51,340
内部总成本 = 51,340 + 23,000 = 74,340
外包人天成本 = 680 × 1000 = 680,000
外包总成本 = 680,000 + 0 = 680,000
总成本 = 74,340 + 680,000 = 754,340

内部占比 = 34 / 714 = 4.76%
内部分配合同 = 682,000 × 4.76% = 32,476
外部分配合同 = 682,000 × 95.24% = 649,524

内部利润率 = (32,476 - 74,340) / 32,476 = -128.91%  ✓ 与 Excel 一致
外包利润率 = (649,524 - 680,000) / 649,524 = -4.69%   ✓ 与 Excel 一致
整体利润率 = (800,000 - 754,340) / 800,000 = 5.71%
```

## 六、AI 对话辅助用法

### Prompt 模板

```
你是 PMAer 利润测算助手。根据以下信息计算项目利润率：

## 项目信息
- 合同总额：{contractAmount} 元
- 内部人天：{internalDays} 天
- 外包人天：{externalDays} 天
- 内部角色：{internalRole}（单价 {internalUnitPrice} 元/天）
- 外包单价：{externalUnitPrice} 元/天
- 内部差旅费：{internalTravel} 元
- 外部差旅费：{externalTravel} 元

## 请计算并输出
1. 各项成本明细
2. 工作量占比和合同分配
3. 内部利润率、外包利润率-自有产品、整体利润率
4. 是否触及红线（内部>0%，外包>40%）
5. 如触及红线，给出调整建议
```

---

## 七、两个版本对比

| 对比项 | 网页版 | 卡片版 |
|--------|--------|--------|
| **用途** | 独立分享，浏览器打开即可 | PMAer 程序内嵌 |
| **布局** | 双栏（左侧输入/右侧结果），1040px | 单列卡片，560px |
| **内部团队** | 完整表格（角色/人天/单价/成本） | 紧凑行内布局 |
| **盈亏平衡人天** | 有（测算职级 + 应用按钮） | 无（空间有限） |
| **成本占比标签** | 有（整包≤5%、类整包≤10%） | 有（精简版） |
| **默认成员** | 有（实施顾问 C2-1，0天） | 有（实施顾问 C2-1，0天） |
| **外包单价默认值** | 1200 | 1200 |
| **计算公式** | 完全一致 | 完全一致 |
| **红线标准** | 完全一致 | 完全一致 |
| **算法文档** | 本文档 | 同本文档（代码内注释） |
- 项目类型：{scenario}（分包/类整包）

## 请计算并输出
1. 各项成本明细（内部人天成本、内部差旅、内部总成本、外包人天成本、外部差旅、外包总成本、总成本）
2. 工作量占比和合同分配
3. 内部利润率、外包利润率-自有产品、整体利润率
4. 是否触及低利润红线（分包：内部>0%，外包>40%；类整包：自身成本<10%）
5. 如触及红线，给出调整建议
```
