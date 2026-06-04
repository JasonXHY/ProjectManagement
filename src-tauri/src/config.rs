use serde::{Deserialize, Serialize};

/// 应用配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    /// 智谱AI API Key
    pub zhipu_api_key: String,
    /// 智谱AI API 端点
    pub zhipu_api_url: String,
    /// 模型名称
    pub model_name: String,
    /// 分类prompt
    pub classification_prompt: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            zhipu_api_key: "da2c0511ffbc4abe8f66533c6c35f1e6.Xs2mvQ1RMYdDq7Se".to_string(),
            zhipu_api_url: "https://open.bigmodel.cn/api/paas/v4/chat/completions".to_string(),
            model_name: "glm-4.7-flash".to_string(),
            classification_prompt: r#"你是一个专业的文档分类专家。请根据以下文档内容，判断它属于哪个类别：

类别：
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

文档内容：
{content}

请返回以下JSON格式：
{
  "category": "类别名称",
  "confidence": 0.95,
  "summary": "文档内容摘要（50字以内）",
  "file_type": "文件类型（如：需求文档、测试报告等）"
}"#.to_string(),
        }
    }
}
