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

/** 项目阶段（新） */
export type ProjectStageNew =
  | "presale"
  | "startup"
  | "requirement"
  | "solution"
  | "build"
  | "test"
  | "launch"
  | "acceptance"
  | "customer_success"
  | "close";

/** 项目阶段常量（新） */
export const PROJECT_STAGES_NEW: Record<ProjectStageNew, string> = {
  presale: "售前",
  startup: "启动",
  requirement: "需求",
  solution: "方案",
  build: "构建",
  test: "测试",
  launch: "上线",
  acceptance: "验收",
  customer_success: "转客户成功",
  close: "关闭",
};

/** 项目阶段列表（新） */
export const PROJECT_STAGE_LIST_NEW: ProjectStageNew[] = [
  "presale",
  "startup",
  "requirement",
  "solution",
  "build",
  "test",
  "launch",
  "acceptance",
  "customer_success",
  "close",
];

/** 文件信息（扩展） */
export interface FileExtended extends File {
  manual_category?: string | null;  // 用户手动调整的分类
}

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
