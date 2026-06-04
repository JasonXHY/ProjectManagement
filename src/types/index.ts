/** 文件信息 */
export interface File {
  id: string;
  name: string;
  path: string;
  size: number;
  mimeType: string;
  createdAt: string;
  updatedAt: string;
}

/** 对话信息 */
export interface Conversation {
  id: string;
  projectId: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

/** 消息信息 */
export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
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

/** 项目信息 */
export interface Project {
  id: string;
  name: string;
  description: string;
  stage: ProjectStage;
  files: File[];
  conversations: Conversation[];
  createdAt: string;
  updatedAt: string;
}

/** 创建项目请求 */
export interface CreateProjectRequest {
  name: string;
  description: string;
  stage: ProjectStage;
}

/** 更新项目请求 */
export interface UpdateProjectRequest {
  id: string;
  name?: string;
  description?: string;
  stage?: ProjectStage;
}
