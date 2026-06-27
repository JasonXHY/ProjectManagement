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
- requirements：从文档中提取所有明确的、具体的任务、功能需求、工作内容。包括：用户提出的请求、待办事项、功能规格、配置要求、数据需求。用简洁的中文描述，每条一行。
- key_issues：识别文档中提到的任何风险、问题、阻碍、待解决事项。同义词包括但不限于：风险、隐患、问题、阻碍、阻塞、延期、推迟、缺陷、难点、挑战、待解决、需确认、待定、TODO、BLOCKER。
- opportunities：识别任何追加需求、扩展可能、二期规划、后续优化、客户追加意向。同义词包括：二期、三期、追加、新增、后续、扩展、优化、升级、定制、二期建设。
- 每个数组最多返回5条。如果文件内容确实不包含相关信息（如纯数据表格、纯图片说明），返回空数组 []。
- status默认值：requirements=pending, key_issues=open, opportunities=planned
- 优先提取明确提到的内容，但如果文档整体在讨论某类事项（如需求评审会议纪要），即使没有逐条列出，也应提取核心内容
- 只返回JSON，不要其他文字`
