/** 文件信息 - 与后端模型匹配 */
export interface File {
  id: number | null;
  project_id: number;
  name: string;
  path: string;
  category: string | null;
  tags: string | null;
  version: number;
  content_hash: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/** 对话信息 - 与后端模型匹配 */
export interface Conversation {
  id: number | null;
  project_id: number;
  role: string;
  content: string;
  created_at: string | null;
  token_count: number | null;
}

/** 项目阶段 */
export type ProjectStage =
  | "blueprint"
  | "startup"
  | "presale"
  | "progress"
  | "acceptance"
  | "halted"
  | "ended";

/** 项目阶段常量 */
export const PROJECT_STAGES: Record<ProjectStage, string> = {
  blueprint: "蓝图阶段",
  startup: "启动阶段",
  presale: "售前阶段",
  progress: "项目中",
  acceptance: "验收阶段",
  halted: "项目中止",
  ended: "结束",
};

/** 项目信息 - 与后端模型匹配 */
export interface Project {
  id: number | null;
  name: string;
  description: string | null;
  stage: ProjectStage;
  created_at: string | null;
  updated_at: string | null;
  status: string;
}

/** 创建项目请求 */
export interface CreateProjectRequest {
  name: string;
  description?: string;
}

/** 更新项目请求 */
export interface UpdateProjectRequest {
  id: number;
  name?: string;
  description?: string;
  stage?: ProjectStage;
}

/** 文件分类结果 */
export interface ClassificationResult {
  category: string;
  confidence: number;
  summary: string;
  file_type: string;
}

/** 应用配置 */
export interface AppConfig {
  zhipu_api_key: string;
  zhipu_api_url: string;
  model_name: string;
  classification_prompt: string;
}

/** 文件上传请求 */
export interface UploadFileRequest {
  project_id: number;
  name: string;
  path: string;
  category?: string;
  content?: string; // base64编码
  project_name?: string;
  stage?: string;
}
