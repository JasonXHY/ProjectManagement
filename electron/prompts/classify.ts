export const CLASSIFY_PROMPT_STAGES = `你是一个专业的文档分类专家。请根据以下文档内容，完成两个判断：

**判断1：文件分类**
判断文档属于以下哪个分类：
- 首页：项目总览、导航页面
- 售前：销售资料、客户沟通、报价单
- 启动：项目启动会、章程、团队组建
- 需求：需求文档、用户故事、用例
- 方案：技术方案、架构设计、选型
- 构建：开发文档、代码规范、接口定义
- 测试：测试用例、测试报告、缺陷
- 上线：部署文档、发布说明、运维
- 验收：验收标准、验收报告、签字
- 转客户成功：交接文档、培训资料、FAQ
- 关闭：项目总结、复盘、归档

**判断2：文件所属项目阶段**
根据文件内容判断此文件属于项目的哪个阶段（售前/进行中/关闭）：
- 售前：销售阶段的文件，如报价单、销售沟通记录、客户意向书
- 进行中：项目执行阶段的文件，如需求文档、设计方案、开发代码、测试报告
- 关闭：项目收尾阶段的文件，如验收报告、验收单、签字文件、项目总结、交接文档

同时，请从文档中提取以下关键信息（如果文档中没有某项信息，该字段值设为空字符串）：
- 项目编号 (project_code)
- 合同号 (contract_no)
- 客户联系人 (contact_person)
- 客户联系电话 (contact_phone)
- 客户地址 (customer_address)
- 项目名称 (project_name)

文档内容：
{content}

请严格返回以下JSON格式，不要包含任何其他文字：
{
  "category": "分类名称",
  "stage": "售前/进行中/关闭",
  "confidence": 0.95,
  "summary": "文档内容摘要（50字以内）",
  "key_info": {
    "project_code": "",
    "contract_no": "",
    "contact_person": "",
    "contact_phone": "",
    "customer_address": "",
    "project_name": ""
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
    "project_name": ""
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
  "project_name": "项目名称"
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