import { invoke } from "@tauri-apps/api/core";
import type { File, ProjectStage } from "../types";

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

/** 管理文件信息（扩展基础 File 类型） */
export interface ManagedFile extends File {
  version: string;
  category: FileCategory;
  stage: ProjectStage;
}

/** 创建文件请求 */
export interface CreateFileRequest {
  projectId: string;
  name: string;
  path: string;
  size: number;
  mimeType: string;
  stage: ProjectStage;
  category: FileCategory;
}

/** 更新文件分类请求 */
export interface UpdateFileCategoryRequest {
  id: string;
  category: FileCategory;
}

/** 更新文件阶段请求 */
export interface UpdateFileStageRequest {
  id: string;
  stage: ProjectStage;
}

/**
 * 根据项目 ID 获取文件列表
 */
export async function getFilesByProject(
  projectId: string,
): Promise<ManagedFile[]> {
  try {
    const files = await invoke<ManagedFile[]>("get_files_by_project", {
      projectId,
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
): Promise<ManagedFile> {
  try {
    const file = await invoke<ManagedFile>("create_file", {
      projectId: request.projectId,
      name: request.name,
      path: request.path,
      size: request.size,
      mimeType: request.mimeType,
      stage: request.stage,
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
): Promise<ManagedFile> {
  try {
    const file = await invoke<ManagedFile>("update_file_category", {
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
 * 更新文件阶段
 */
export async function updateFileStage(
  request: UpdateFileStageRequest,
): Promise<ManagedFile> {
  try {
    const file = await invoke<ManagedFile>("update_file_stage", {
      id: request.id,
      stage: request.stage,
    });
    return file;
  } catch (error) {
    console.error("Failed to update file stage:", error);
    throw error;
  }
}

/**
 * 上传文件到后端
 */
export async function uploadFile(
  projectId: string,
  browserFile: globalThis.File,
): Promise<ManagedFile> {
  try {
    const content = await browserFile.arrayBuffer();
    const contentArray = Array.from(new Uint8Array(content));
    const result = await invoke<ManagedFile>("upload_file", {
      projectId,
      name: browserFile.name,
      size: browserFile.size,
      mimeType: browserFile.type || "application/octet-stream",
      content: contentArray,
    });
    return result;
  } catch (error) {
    console.error("Failed to upload file:", error);
    throw error;
  }
}

/**
 * 删除文件
 */
export async function deleteFile(id: string): Promise<void> {
  try {
    await invoke("delete_file", { id });
  } catch (error) {
    console.error("Failed to delete file:", error);
    throw error;
  }
}
