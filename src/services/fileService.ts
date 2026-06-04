import { invoke } from "@tauri-apps/api/core";
import type { File } from "../types";

/** 文件分类 */
export type FileCategory =
  | "requirement"
  | "design"
  | "development"
  | "test"
  | "deployment"
  | "other";

/** 文件分类标签映射 */
export const FILE_CATEGORY_LABELS: Record<FileCategory, string> = {
  requirement: "需求文档",
  design: "设计文档",
  development: "开发文档",
  test: "测试文档",
  deployment: "部署文档",
  other: "其他",
};

/** 创建文件请求 */
export interface CreateFileRequest {
  project_id: number;
  name: string;
  path: string;
  category?: FileCategory;
}

/** 更新文件分类请求 */
export interface UpdateFileCategoryRequest {
  id: number;
  category: FileCategory;
}

/**
 * 根据项目 ID 获取文件列表
 */
export async function getFilesByProject(
  projectId: number,
  stage?: string,
): Promise<File[]> {
  try {
    const files = await invoke<File[]>("get_files_by_project", {
      projectId,
      stage,
    });
    return files;
  } catch (error) {
    console.error("Failed to fetch files:", error);
    throw error;
  }
}

/**
 * 创建新文件记录
 */
export async function createFile(
  request: CreateFileRequest,
): Promise<File> {
  try {
    const file = await invoke<File>("create_file", {
      projectId: request.project_id,
      name: request.name,
      path: request.path,
      category: request.category,
    });
    return file;
  } catch (error) {
    console.error("Failed to create file:", error);
    throw error;
  }
}

/**
 * 更新文件分类
 */
export async function updateFileCategory(
  request: UpdateFileCategoryRequest,
): Promise<File> {
  try {
    const file = await invoke<File>("update_file_category", {
      id: request.id,
      category: request.category,
    });
    return file;
  } catch (error) {
    console.error("Failed to update file category:", error);
    throw error;
  }
}

/**
 * 删除文件
 */
export async function deleteFile(id: number): Promise<void> {
  try {
    await invoke("delete_file", { id });
  } catch (error) {
    console.error("Failed to delete file:", error);
    throw error;
  }
}
