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

/** 消息信息 - 兼容前端组件使用 */
export interface Message {
  id: number | null;
  role: "user" | "assistant";
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
