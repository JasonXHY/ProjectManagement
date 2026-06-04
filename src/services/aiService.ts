import { invoke } from "@tauri-apps/api/core";
import type { Message } from "../types";

/** 发送聊天消息请求 */
export interface ChatRequest {
  conversationId: string;
  content: string;
  fileIds?: string[];
  /** 上下文消息，仅发送最近5轮对话（最多10条消息） */
  contextMessages?: Message[];
}

/** 发送聊天消息响应 */
export interface ChatResponse {
  message: Message;
}

/**
 * AI 服务 - 提供对话相关功能
 */

/**
 * 发送消息并获取 AI 回复
 */
export async function chat(request: ChatRequest): Promise<Message> {
  try {
    const response = await invoke<ChatResponse>("chat", {
      conversationId: request.conversationId,
      content: request.content,
      fileIds: request.fileIds ?? [],
      contextMessages: request.contextMessages ?? [],
    });
    return response.message;
  } catch (error) {
    console.error("Failed to send chat message:", error);
    throw error;
  }
}

/**
 * 获取对话历史消息
 */
export async function getHistory(conversationId: string): Promise<Message[]> {
  try {
    const messages = await invoke<Message[]>("get_chat_history", {
      conversationId,
    });
    return messages;
  } catch (error) {
    console.error("Failed to fetch chat history:", error);
    throw error;
  }
}

/**
 * 清空对话历史
 */
export async function clearHistory(conversationId: string): Promise<void> {
  try {
    await invoke("clear_chat_history", { conversationId });
  } catch (error) {
    console.error("Failed to clear chat history:", error);
    throw error;
  }
}
