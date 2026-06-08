import { useState, useCallback, useEffect, useRef } from "react";
import {
  Input,
  Button,
  Space,
  Typography,
  Spin,
  Modal,
  Checkbox,
  List,
  Badge,
  message,
  Upload,
} from "antd";
import {
  SendOutlined,
  ClearOutlined,
  CommentOutlined,
  FileOutlined,
  PaperClipOutlined,
  InboxOutlined,
  RobotOutlined,
  UserOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { ChatConversationMessage, FileRecord } from "../../types";
import { aiService } from "../../services/aiService";
import { fileService } from "../../services/fileService";

const { Text } = Typography;
const { TextArea } = Input;

/** 对话窗口属性 */
interface ChatWindowProps {
  projectId: number;
  projectName?: string;
  onBack?: () => void;
}

/**
 * 对话窗口组件
 * 支持文档上传并对话，可根据文档内容更新项目
 */
export default function ChatWindow({
  projectId,
  projectName,
  onBack,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatConversationMessage[]>([]);
  const messagesRef = useRef<ChatConversationMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [selectedFileIds, setSelectedFileIds] = useState<number[]>([]);
  const [showFilePanel, setShowFilePanel] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);

  /** 加载项目文件列表 */
  const loadFiles = useCallback(async () => {
    try {
      const result = await fileService.list(projectId);
      if (result.success && result.data) {
        setFiles(result.data);
      }
    } catch (err) {
      console.error("[ChatWindow] 加载文件列表失败:", err);
    }
  }, [projectId]);

  /** 组件挂载时加载文件 */
  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  /** 加载对话历史 */
  useEffect(() => {
    if (projectId) {
      aiService.getHistory(projectId).then((result) => {
        if (result.success && result.data) {
          const historyMessages: ChatConversationMessage[] = result.data.map(
            (msg) => ({
              id: msg.id,
              project_id: msg.project_id,
              role: msg.role as "user" | "assistant",
              content: msg.content,
              created_at: msg.created_at,
              token_count: msg.token_count,
            })
          );
          messagesRef.current = historyMessages;
          setMessages(historyMessages);
        }
      }).catch((err) => {
        console.error("[ChatWindow] 加载对话历史失败:", err);
      });
    }
  }, [projectId]);

  /** 自动滚动到底部 */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /** 切换文件选中状态 */
  const handleFileToggle = useCallback((fileId: number, checked: boolean) => {
    setSelectedFileIds((prev) =>
      checked ? [...prev, fileId] : prev.filter((id) => id !== fileId)
    );
  }, []);

  /** 全选/取消全选 */
  const handleSelectAll = useCallback(
    (checked: boolean) => {
      setSelectedFileIds(checked ? files.map((f) => f.id) : []);
    },
    [files]
  );

  /** 上传文件 */
  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const result = await fileService.upload(projectId, file);
      if (result.success) {
        message.success(`${file.name} 上传成功`);
        loadFiles();
      } else {
        message.error(result.error || "上传失败");
      }
    } catch (error) {
      message.error("上传失败");
      console.error(error);
    } finally {
      setUploading(false);
    }
    return false; // 阻止antd默认上传
  };

  /** 发送消息 */
  const handleSend = useCallback(async () => {
    const content = inputValue.trim();
    if (!content || isLoading) return;

    // 创建用户消息（临时）
    const userMessage: ChatConversationMessage = {
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
      // 调用 AI 服务，传递上下文文件 IDs
      const result = await aiService.chat(projectId, content, selectedFileIds);

      if (result.success && result.data) {
        // 显示 AI 回复
        const aiMessage: ChatConversationMessage = {
          id: Date.now() + 1,
          project_id: projectId,
          role: "assistant",
          content: result.data,
          created_at: new Date().toISOString(),
          token_count: null,
        };

        const finalMessages = [...messagesRef.current, aiMessage];
        messagesRef.current = finalMessages;
        setMessages(finalMessages);
      } else {
        message.error(result.error || "发送消息失败，请重试");
        // 移除用户消息如果发送失败
        const reverted = messagesRef.current.filter(
          (m) => m.id !== userMessage.id
        );
        messagesRef.current = reverted;
        setMessages(reverted);
      }
    } catch (error) {
      console.error("[ChatWindow] 发送消息失败:", error);
      message.error("发送消息失败，请重试");
      // 移除用户消息如果发送失败
      const reverted = messagesRef.current.filter(
        (m) => m.id !== userMessage.id
      );
      messagesRef.current = reverted;
      setMessages(reverted);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, projectId, selectedFileIds]);

  /** 清空历史 */
  const handleClearHistory = useCallback(() => {
    Modal.confirm({
      title: "确认清空",
      content: "确定要清空所有对话历史吗？此操作不可撤销。",
      okText: "确认清空",
      cancelText: "取消",
      okButtonProps: { danger: true },
      onOk: () => {
        messagesRef.current = [];
        setMessages([]);
        message.success("对话历史已清空");
      },
    });
  }, []);

  /** 处理回车键发送 */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const allSelected =
    files.length > 0 && selectedFileIds.length === files.length;

  return (
    <div className="flex h-[calc(100vh-200px)] bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* 左侧：上下文文件选择面板 */}
      <div
        className={`flex flex-col border-r border-gray-200 bg-gray-50 transition-all duration-300 ${
          showFilePanel ? "w-64" : "w-0"
        } overflow-hidden`}
      >
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-white">
          <Space size={4}>
            <PaperClipOutlined className="text-blue-500" />
            <Text strong className="text-sm">
              上下文文件
            </Text>
            {selectedFileIds.length > 0 && (
              <Badge
                count={selectedFileIds.length}
                style={{ backgroundColor: "#1890ff" }}
                size="small"
              />
            )}
          </Space>
          {files.length > 0 && (
            <Checkbox
              checked={allSelected}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="text-xs"
            >
              全选
            </Checkbox>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {files.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 px-4">
              <FileOutlined className="text-2xl mb-2" />
              <Text type="secondary" className="text-xs text-center">
                暂无文件，请先在文件管理中上传文件
              </Text>
            </div>
          ) : (
            <List
              dataSource={files}
              size="small"
              renderItem={(file) => (
                <List.Item className="!py-1.5 !px-3 !border-b-0 hover:bg-gray-100 cursor-pointer">
                  <Checkbox
                    checked={selectedFileIds.includes(file.id)}
                    onChange={(e) =>
                      handleFileToggle(file.id, e.target.checked)
                    }
                    className="w-full"
                  >
                    <div className="flex flex-col min-w-0">
                      <Text
                        ellipsis
                        className="text-xs !mb-0"
                        title={file.filename}
                      >
                        {file.filename}
                      </Text>
                      {file.category && (
                        <Text type="secondary" className="text-xs !mb-0">
                          {file.category}
                        </Text>
                      )}
                    </div>
                  </Checkbox>
                </List.Item>
              )}
            />
          )}
        </div>

        {selectedFileIds.length > 0 && (
          <div className="px-3 py-2 border-t border-gray-200 bg-white">
            <Text type="secondary" className="text-xs">
              已选择 {selectedFileIds.length} 个文件作为上下文
            </Text>
          </div>
        )}
      </div>

      {/* 右侧：对话区域 */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* 头部 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Button
              type="text"
              icon={<PaperClipOutlined />}
              onClick={() => setShowFilePanel(!showFilePanel)}
              className={showFilePanel ? "!text-blue-500" : ""}
            >
              文件
            </Button>
            <CommentOutlined className="text-blue-500" />
            <Text strong>{projectName || "项目对话"}</Text>
          </div>
          <Space>
            <Button
              type="text"
              danger
              icon={<ClearOutlined />}
              onClick={handleClearHistory}
              disabled={messages.length === 0}
            >
              清空历史
            </Button>
          </Space>
        </div>

        {/* 消息列表区域 */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <RobotOutlined className="text-4xl mb-4" />
              <Text type="secondary" className="text-lg mb-2">
                开始对话
              </Text>
              <Text type="secondary" className="text-sm">
                输入问题或上传文件开始与AI对话
              </Text>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <RobotOutlined className="text-white text-sm" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      msg.role === "user"
                        ? "bg-blue-500 text-white rounded-br-sm"
                        : "bg-gray-100 text-gray-800 rounded-bl-sm"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <UserOutlined className="text-white text-sm" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* 加载状态提示 */}
        {isLoading && (
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
            <Text type="secondary" className="text-sm">
              <Spin size="small" className="mr-2" />
              AI 正在思考...
              {selectedFileIds.length > 0 && (
                <span className="ml-2 text-blue-400">
                  (已附加 {selectedFileIds.length} 个文件)
                </span>
              )}
            </Text>
          </div>
        )}

        {/* 输入区域 */}
        <div className="p-4 border-t border-gray-200">
          {selectedFileIds.length > 0 && (
            <div className="mb-2 flex items-center gap-1">
              <PaperClipOutlined className="text-blue-400 text-xs" />
              <Text type="secondary" className="text-xs">
                将使用 {selectedFileIds.length} 个文件作为对话上下文
              </Text>
            </div>
          )}
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
    </div>
  );
}
