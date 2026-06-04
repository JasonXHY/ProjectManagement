import { useState, useCallback, useEffect, useRef } from "react";
import { Input, Button, Space, Typography, Spin, Modal, message } from "antd";
import {
  SendOutlined,
  ClearOutlined,
  CommentOutlined,
  ArrowLeftOutlined,
  FolderOutlined,
} from "@ant-design/icons";
import type { Conversation } from "../../types";
import { chat, getHistory, clearHistory } from "../../services/aiService";
import MessageList from "./MessageList";

const { Text } = Typography;
const { TextArea } = Input;

/** 对话窗口属性 */
interface ChatWindowProps {
  projectId: number;
  projectName?: string;
  onBack?: () => void;
  onFiles?: () => void;
}

/**
 * 对话窗口组件
 * 整合消息列表和上传区域，支持发送消息和清空历史
 */
export default function ChatWindow({
  projectId,
  projectName,
  onBack,
  onFiles,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Conversation[]>([]);
  const messagesRef = useRef<Conversation[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  /** 加载对话历史 */
  const loadHistory = useCallback(async () => {
    setIsHistoryLoading(true);
    try {
      const history = await getHistory(projectId);
      const reversed = [...history].reverse();
      messagesRef.current = reversed;
      setMessages(reversed);
    } catch {
      message.error("加载对话历史失败");
    } finally {
      setIsHistoryLoading(false);
    }
  }, [projectId]);

  /** 组件挂载时加载历史 */
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  /** 发送消息 */
  const handleSend = useCallback(async () => {
    const content = inputValue.trim();
    if (!content || isLoading) return;

    // 创建用户消息（临时）
    const userMessage: Conversation = {
      id: Date.now(),
      project_id: projectId,
      role: "user",
      content,
      created_at: new Date().toISOString(),
      token_count: null,
    };

    // 立即显示用户消息
    const updatedMessages = [...messagesRef.current, userMessage];
    messagesRef.current = updatedMessages;
    setMessages(updatedMessages);
    setInputValue("");
    setIsLoading(true);

    try {
      // 调用 AI 服务
      const response = await chat({
        project_id: projectId,
        message: content,
      });

      // 显示 AI 回复
      const aiMessage: Conversation = {
        id: Date.now() + 1,
        project_id: projectId,
        role: "assistant",
        content: response.reply,
        created_at: new Date().toISOString(),
        token_count: response.token_count,
      };

      const finalMessages = [...messagesRef.current, aiMessage];
      messagesRef.current = finalMessages;
      setMessages(finalMessages);
    } catch {
      message.error("发送消息失败，请重试");
      // 移除用户消息如果发送失败
      const reverted = messagesRef.current.filter(
        (m) => m.id !== userMessage.id,
      );
      messagesRef.current = reverted;
      setMessages(reverted);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, projectId]);

  /** 清空历史 */
  const handleClearHistory = useCallback(() => {
    Modal.confirm({
      title: "确认清空",
      content: "确定要清空所有对话历史吗？此操作不可撤销。",
      okText: "确认清空",
      cancelText: "取消",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await clearHistory(projectId);
          messagesRef.current = [];
          setMessages([]);
          message.success("对话历史已清空");
        } catch {
          message.error("清空历史失败");
        }
      },
    });
  }, [projectId]);

  /** 处理回车键发送 */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={onBack}>
            返回项目列表
          </Button>
          <Button type="text" icon={<FolderOutlined />} onClick={onFiles}>
            文件管理
          </Button>
          <CommentOutlined className="text-blue-500" />
          <Text strong>{projectName || "项目对话"}</Text>
        </div>
        <Button
          type="text"
          danger
          icon={<ClearOutlined />}
          onClick={handleClearHistory}
          disabled={messages.length === 0}
        >
          清空历史
        </Button>
      </div>

      {/* 消息列表区域 */}
      <div className="flex-1 overflow-hidden">
        {isHistoryLoading ? (
          <div className="flex items-center justify-center h-full">
            <Spin tip="加载对话历史..." />
          </div>
        ) : (
          <MessageList messages={messages} />
        )}
      </div>

      {/* 加载状态提示 */}
      {isLoading && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
          <Text type="secondary" className="text-sm">
            <Spin size="small" className="mr-2" />
            AI 正在思考...
          </Text>
        </div>
      )}

      {/* 输入区域 */}
      <div className="p-4 border-t border-gray-200">
        <Space.Compact className="w-full">
          <TextArea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
            autoSize={{ minRows: 1, maxRows: 4 }}
            disabled={isLoading}
            className="!resize-none"
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            loading={isLoading}
            disabled={!inputValue.trim()}
            className="!h-auto"
          >
            发送
          </Button>
        </Space.Compact>
      </div>
    </div>
  );
}
