import { invoke } from "@tauri-apps/api/core";
import type {
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
} from "../types";

/**
 * 获取所有项目列表
 */
export async function getProjects(): Promise<Project[]> {
  try {
    const projects = await invoke<Project[]>("get_projects");
    return projects;
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    throw error;
  }
}

/**
 * 获取单个项目详情
 */
export async function getProject(id: string): Promise<Project> {
  try {
    const project = await invoke<Project>("get_project", { id });
    return project;
  } catch (error) {
    console.error("Failed to fetch project:", error);
    throw error;
  }
}

/**
 * 创建新项目
 */
export async function createProject(
  request: CreateProjectRequest,
): Promise<Project> {
  try {
    const project = await invoke<Project>("create_project", {
      name: request.name,
      description: request.description,
      stage: request.stage,
    });
    return project;
  } catch (error) {
    console.error("Failed to create project:", error);
    throw error;
  }
}

/**
 * 更新项目信息
 */
export async function updateProject(
  request: UpdateProjectRequest,
): Promise<Project> {
  try {
    const project = await invoke<Project>("update_project", {
      id: request.id,
      name: request.name,
      description: request.description,
      stage: request.stage,
    });
    return project;
  } catch (error) {
    console.error("Failed to update project:", error);
    throw error;
  }
}

/**
 * 删除项目
 */
export async function deleteProject(id: string): Promise<void> {
  try {
    await invoke("delete_project", { id });
  } catch (error) {
    console.error("Failed to delete project:", error);
    throw error;
  }
}
