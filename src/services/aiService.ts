import { invoke } from "@tauri-apps/api/core";
import type { Conversation } from "../types";

/** 发送聊天消息请求 */
export interface ChatRequest {
  project_id: number;
  message: string;
  file_content?: string;
}

/** 发送聊天消息响应 */
export interface ChatResponse {
  reply: string;
  token_count: number;
}

/**
 * AI 服务 - 提供对话相关功能
 */

/**
 * 发送消息并获取 AI 回复
 */
export async function chat(request: ChatRequest): Promise<ChatResponse> {
  try {
    const response = await invoke<ChatResponse>("chat_with_ai", {
      request,
    });
    return response;
  } catch (error) {
    console.error("Failed to send chat message:", error);
    throw error;
  }
}

/**
 * 获取对话历史消息
 */
export async function getHistory(
  projectId: number,
  limit?: number,
): Promise<Conversation[]> {
  try {
    const messages = await invoke<Conversation[]>(
      "get_conversation_history",
      {
        projectId,
        limit,
      },
    );
    return messages;
  } catch (error) {
    console.error("Failed to fetch chat history:", error);
    throw error;
  }
}

/**
 * 清空对话历史
 */
export async function clearHistory(projectId: number): Promise<void> {
  try {
    await invoke("clear_conversation_history", { projectId });
  } catch (error) {
    console.error("Failed to clear chat history:", error);
    throw error;
  }
}
