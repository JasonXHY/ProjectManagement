import { STAGE_DEFINITIONS } from '../shared/stages'

/** 由 STAGE_DEFINITIONS 动态生成「阶段 → 子分类」清单，保持与数据模型单一数据源同步 */
function buildStageSubcategoryList(): string {
  return STAGE_DEFINITIONS.map(
    (s) => `- ${s.name}：${s.subcategories.join('、')}`
  ).join('\n')
}

export const CLASSIFY_PROMPT_STAGES = `你是一个专业的文档分类专家。请根据以下文档内容，完成三个判断：

**判断1：文件分类阶段 + 子分类**
判断文档属于以下哪个阶段，并进一步判断属于该阶段下的哪个子分类（子分类按文档用途划分，不按文件格式划分）：
${buildStageSubcategoryList()}

特别规则：
- 「验收」阶段需区分文件状态：未签字的验收材料归「验收材料待签」，已签字的归「验收签字件已签」。
- 「会议纪要」类文件按会议讨论的内容关键词判断归属阶段（如讨论需求则归「需求/会议纪要」，讨论测试缺陷则归「测试/会议纪要」）。
- 若无法判断子分类，subcategory 返回空字符串。

**文件用途 vs 内容判断规则**（重要）：
- **签字/验收类文件**：文件名含"验收"、"签字"、"确认单"、"签批"、"审批"的文件，即使内容包含任务清单或工作描述，也应归入「验收」阶段。这些文件的用途是确认/签字，不是记录工作内容。
- **文件名优先级**：当文件名明确指示用途时（如"验收确认单.pdf"），优先按文件名判断阶段，而非仅看内容。
- **内容混淆陷阱**：验收确认单、签字文件等往往包含"已完成XX任务"等描述，这是确认内容而非工作记录，不要被内容误导归入「需求/方案/构建」等阶段。

**特殊文档类型规则**：
- **SOW/实施工作说明书**：属于售前阶段的「销售方案」子分类。SOW定义项目范围、工作内容和交付标准，是售前商务文档。
- **物料/BOM/数据收集**：属于构建阶段的「开发文档」子分类。这些是开发实施过程中的基础数据文档。
- **环境信息/访问地址/部署文档**：属于上线阶段的「部署文档」子分类。
- **结算/差异处理**：属于方案阶段的「开发规格说明书」子分类。

**蓝图 vs 开发规格说明书 区分规则**：
- **蓝图**：业务设计文档，描述业务流程、业务架构、业务规则。关键词包括：业务流程、业务架构、业务规则、业务蓝图、流程图、组织架构、岗位职责、业务场景。
- **开发规格说明书**：技术设计文档，描述接口定义、数据结构、技术方案。关键词包括：接口文档、数据字典、API设计、数据库设计、技术架构、类图、时序图。
- 如果文件同时包含业务和技术内容，优先判断为蓝图（业务设计优先）。

**判断2：文件所属项目阶段**
根据文件内容判断此文件属于项目的哪个阶段（售前/进行中/关闭）：
- 售前：销售阶段的文件，如报价单、销售沟通记录、客户意向书、SOW
- 进行中：项目执行阶段的文件，如需求文档、设计方案、开发代码、测试报告
- 关闭：项目收尾阶段的文件，如验收报告、验收单、签字文件、项目总结、交接文档

**判断3：关键信息提取**（如果文档中没有某项信息，该字段值设为空字符串）：
- 项目编号 (project_code)
- 合同号 (contract_no)
- 客户联系人 (contact_person)
- 客户联系电话 (contact_phone)
- 客户地址 (customer_address)
- 项目名称 (project_name)
- 客户名称/公司名称 (customer_name)
- 合同总金额，单位为元（数字，如500000） (contract_amount)
- 合同分项明细，包含每项的名称、金额和描述（数组，如[{"name":"软件许可","amount":200000,"description":"XX系统软件"}]） (contract_items)

**分类示例**：
- 文件名"实施工作说明书(SOW)_客户名v1.3.docx" → category="售前", subcategory="销售方案", stage="售前"
- 文件名"05实施完成确认单_客户名.docx" → category="验收", subcategory="验收材料待签", stage="关闭"
- 文件名"业务蓝图-总册_模板.docx" → category="方案", subcategory="蓝图", stage="进行中"
- 文件名"测试报告_模板.docx" → category="测试", subcategory="测试报告", stage="进行中"

文档内容：
{content}

请严格返回以下JSON格式，不要包含任何其他文字：
{
  "category": "阶段名称",
  "subcategory": "子分类名称",
  "stage": "售前/进行中/关闭",
  "confidence": 0.95,
  "summary": "文档内容摘要（50字以内）",
  "key_info": {
    "project_code": "",
    "contract_no": "",
    "contact_person": "",
    "contact_phone": "",
    "customer_address": "",
    "project_name": "",
    "customer_name": "",
    "contract_amount": 0,
    "contract_items": []
  }
}`

export const CLASSIFY_PROMPT_CONTENT = `你是一个专业的文档分类专家。请根据以下文档内容，判断它属于哪个类别（如：文档、代码、图片、表格、方案、报告、规范、工具等）：

同时，请从文档中提取以下关键信息（如果文档中没有某项信息，该字段值设为空字符串）：
- 项目编号 (project_code)
- 合同号 (contract_no)
- 客户联系人 (contact_person)
- 客户联系电话 (contact_phone)
- 客户地址 (customer_address)
- 项目名称 (project_name)
- 客户名称/公司名称 (customer_name)
- 合同总金额，单位为元（数字） (contract_amount)
- 合同分项明细（数组） (contract_items)

文档内容：
{content}

请严格返回以下JSON格式，不要包含任何其他文字：
{
  "category": "类别名称",
  "confidence": 0.95,
  "summary": "文档内容摘要（50字以内）",
  "key_info": {
    "project_code": "",
    "contract_no": "",
    "contact_person": "",
    "contact_phone": "",
    "customer_address": "",
    "project_name": "",
    "customer_name": "",
    "contract_amount": 0,
    "contract_items": []
  }
}`

export const EXTRACT_KEY_INFO_PROMPT = `你是一个项目信息提取专家。请从以下文件内容中提取项目的关键信息。

如果文件中没有某个字段的信息，该字段值设为空字符串 ""。只提取文件中明确提到的信息，不要推测。

文件内容：
{content}

请严格返回以下JSON格式，不要包含任何其他文字：
{
  "project_code": "项目编号",
  "contract_no": "合同号",
  "contact_person": "客户联系人",
  "contact_phone": "客户联系电话",
  "customer_address": "客户地址",
  "project_name": "项目名称",
  "customer_name": "客户名称/公司名称",
  "contract_amount": 0,
  "contract_items": []
}`

export const EXTRACT_MILESTONES_PROMPT = `你是一个项目里程碑提取专家。请从以下文件内容中提取项目的关键里程碑节点。

里程碑是指项目中的重要时间节点，例如：合同签署、蓝图确认、上线、验收等。
对于每个里程碑，请提取日期和标题。如果文件中没有明确的日期，不要猜测。

文件内容：
{content}

请严格返回以下JSON格式（数组），不要包含任何其他文字：
[
  { "date": "2026-06-01", "title": "里程碑名称", "type": "milestone" }
]

注意：
- date 格式必须是 YYYY-MM-DD
- type 只能是 "milestone"
- 如果没有找到里程碑，返回空数组 []
- 只提取文件中明确提到的里程碑，不要推测`