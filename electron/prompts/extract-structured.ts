export const EXTRACT_STRUCTURED_PROMPT = `你是一个项目管理数据提取专家。请从以下文件内容中提取结构化信息。

文件类型：{category}
文件内容：{content}

请返回以下JSON格式：
{
  "requirements": [
    {
      "name": "需求名称",
      "detail": "需求描述（如有）",
      "status": "pending"
    }
  ],
  "key_issues": [
    {
      "text": "问题描述",
      "priority": "medium",
      "status": "open"
    }
  ],
  "opportunities": [
    {
      "name": "商机标题",
      "description": "客户需求描述",
      "status": "planned"
    }
  ]
}

提取规则（严格遵守）：
- 每个数组最多返回3条
- requirements：只从明确的需求文档、需求跟踪矩阵、讨论需求的会议纪要中提取。不从操作手册、测试计划、配置文档、合同条款中提取
- key_issues：只提取真正的项目风险和阻碍项（如：进度延期、资源不足、技术难点、客户变更）。不提取：验证任务（"验证xxx"）、测试待办（"测试xxx"）、功能确认（"确认xxx"）、合同条款中的风险描述
- opportunities：只从明确的二期规划、追加需求文档中提取
- 去重要求：同一数组内不得出现内容相似的条目（如同一功能的不同表述只保留最清晰的一条）
- 语义去重：如果两条需求描述的是同一件事（如"权限管理"和"权限矩阵设计"、"流程提醒"和"流程增加提醒功能"），合并为一条
- 合并策略：保留描述更详细的那条，来源字段合并
- 不要将不同方面的类似主题拆分为多条（如"权限管理"和"数据权限控制"是不同需求，应保留两条）
- 如果文件内容不包含符合条件的信息，返回空数组 []
- status默认值：requirements=pending, key_issues=open, opportunities=planned
- 只返回JSON，不要其他文字`
