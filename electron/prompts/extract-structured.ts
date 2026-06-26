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

提取规则：
- requirements：从需求文档、会议纪要、周报中提取用户提出的或确认的需求。需求是"要做的事"
- key_issues：根据关键词（问题/风险/阻塞/延期/缺陷/难点）识别项目风险点。问题是"阻碍项目的事"
- opportunities：识别"二期/三期/追加需求/后续优化/扩展功能"等拓展商机关键词
- 每个数组最多返回5条，如果没有相关内容返回空数组 []
- status默认值：requirements=pending, key_issues=open, opportunities=planned
- 只提取文件中明确提到的内容，不要推测`
