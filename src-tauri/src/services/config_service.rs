use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// 应用配置（可序列化版本）
#[derive(Debug, Serialize, Deserialize)]
pub struct AppConfigSerializable {
    pub zhipu_api_key: String,
    pub zhipu_api_url: String,
    pub model_name: String,
    pub classification_prompt: String,
}

impl Default for AppConfigSerializable {
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

/// 获取配置文件路径
fn get_config_path() -> Result<PathBuf, String> {
    let config_dir = dirs::config_dir()
        .ok_or_else(|| "无法获取配置目录".to_string())?
        .join("ai-project-manager");

    std::fs::create_dir_all(&config_dir)
        .map_err(|e| format!("创建配置目录失败: {}", e))?;

    Ok(config_dir.join("config.json"))
}

/// 加载配置
pub fn load_config() -> Result<AppConfigSerializable, String> {
    let config_path = get_config_path()?;

    if !config_path.exists() {
        // 如果配置文件不存在，返回默认配置
        return Ok(AppConfigSerializable::default());
    }

    let content = std::fs::read_to_string(&config_path)
        .map_err(|e| format!("读取配置文件失败: {}", e))?;

    let config: AppConfigSerializable = serde_json::from_str(&content)
        .map_err(|e| format!("解析配置文件失败: {}", e))?;

    Ok(config)
}

/// 保存配置
pub fn save_config(config: &AppConfigSerializable) -> Result<(), String> {
    let config_path = get_config_path()?;

    let content = serde_json::to_string_pretty(config)
        .map_err(|e| format!("序列化配置失败: {}", e))?;

    std::fs::write(&config_path, content)
        .map_err(|e| format!("写入配置文件失败: {}", e))?;

    eprintln!("[CONFIG] 配置已保存到: {:?}", config_path);

    Ok(())
}

/// 恢复默认配置
pub fn reset_config() -> Result<AppConfigSerializable, String> {
    let default_config = AppConfigSerializable::default();
    save_config(&default_config)?;
    Ok(default_config)
}
