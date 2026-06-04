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

/** 分类结果 */
export interface ClassificationResult {
  category: string;
  confidence: number;
  summary: string;
  file_type: string;
}

/**
 * 对文件进行AI分类
 */
export async function classifyFile(
  projectName: string,
  stage: string,
  fileName: string,
): Promise<ClassificationResult> {
  try {
    const result = await invoke<ClassificationResult>("classify_file", {
      projectName,
      stage,
      fileName,
    });
    return result;
  } catch (error) {
    console.error("Failed to classify file:", error);
    throw error;
  }
}

/**
 * 创建文件（支持内容保存）
 */
export async function createFileWithContent(
  request: CreateFileRequest & {
    content?: string;
    project_name?: string;
    stage?: string;
  },
): Promise<File> {
  try {
    const file = await invoke<File>("create_file", {
      projectId: request.project_id,
      name: request.name,
      path: request.path,
      category: request.category,
      content: request.content,
      projectName: request.project_name,
      stage: request.stage,
    });
    return file;
  } catch (error) {
    console.error("Failed to create file:", error);
    throw error;
  }
}

/**
 * 直接上传文件（AI自动分类，无需确认）
 */
export async function uploadFileWithAutoClassify(
  projectId: number,
  projectName: string,
  file: globalThis.File
): Promise<File> {
  try {
    // 读取文件内容
    const content = await readFileAsBase64(file);

    // 创建文件（AI会自动分类）
    const result = await createFileWithContent({
      project_id: projectId,
      name: file.name,
      path: `/projects/${projectId}/${file.name}`,
      content: content,
      project_name: projectName,
      stage: "auto",  // 表示自动分类
    });

    return result;
  } catch (error) {
    console.error("Failed to upload file:", error);
    throw error;
  }
}

/**
 * 读取文件为base64
 */
function readFileAsBase64(file: globalThis.File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 更新文件分类（手动调整）
 */
export async function updateFileCategoryManual(
  fileId: number,
  category: string
): Promise<void> {
  try {
    await invoke("update_file_category", {
      id: fileId,
      category: category,
      manualCategory: category,  // 标记为手动调整
    });
  } catch (error) {
    console.error("Failed to update file category:", error);
    throw error;
  }
}
