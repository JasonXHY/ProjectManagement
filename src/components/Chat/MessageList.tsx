import { useEffect, useRef } from "react";
import { Typography } from "antd";
import {
  UserOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import type { Conversation } from "../../types";

const { Text } = Typography;

/** 消息列表属性 */
interface MessageListProps {
  messages: Conversation[];
}

/**
 * 消息列表组件
 * 显示对话历史，支持自动滚动到底部
 */
export default function MessageList({ messages }: MessageListProps) {
  const listEndRef = useRef<HTMLDivElement>(null);

  /** 自动滚动到底部 */
  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /** 格式化时间 */
  const formatTime = (dateStr: string | null): string => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <Text type="secondary">开始对话吧...</Text>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full">
      {messages.map((msg) => {
        const isUser = msg.role === "user";
        return (
          <div
            key={msg.id}
            className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
          >
            {/* 头像 */}
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                isUser ? "bg-blue-500" : "bg-green-500"
              }`}
            >
              {isUser ? <UserOutlined /> : <RobotOutlined />}
            </div>

            {/* 消息内容 */}
            <div
              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                isUser
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                {msg.content}
              </div>
              <div
                className={`text-xs mt-1 ${
                  isUser ? "text-blue-100" : "text-gray-400"
                }`}
              >
                {formatTime(msg.created_at)}
              </div>
            </div>
          </div>
        );
      })}
      {/* 滚动锚点 */}
      <div ref={listEndRef} />
    </div>
  );
}
