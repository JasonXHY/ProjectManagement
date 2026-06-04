/// 应用配置
pub struct AppConfig {
    /// 智谱AI API Key
    pub zhipu_api_key: String,
    /// 智谱AI API 端点
    pub zhipu_api_url: String,
    /// 模型名称
    pub model_name: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            zhipu_api_key: "da2c0511ffbc4abe8f66533c6c35f1e6.Xs2mvQ1RMYdDq7Se".to_string(),
            zhipu_api_url: "https://open.bigmodel.cn/api/paas/v4/chat/completions".to_string(),
            model_name: "glm-4.7-flash".to_string(),
        }
    }
}
