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
  Drawer,
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
  FileTextOutlined,
  EyeOutlined,
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

/** 文件类型样式映射 */
const FILE_TYPE_STYLE: Record<string, { color: string; bg: string }> = {
  'pdf': { color: '#DC2626', bg: '#FEE2E2' },
  'doc': { color: '#2563EB', bg: '#DBEAFE' },
  'docx': { color: '#2563EB', bg: '#DBEAFE' },
  'xls': { color: '#059669', bg: '#D1FAE5' },
  'xlsx': { color: '#059669', bg: '#D1FAE5' },
  'ppt': { color: '#D97706', bg: '#FEF3C7' },
  'pptx': { color: '#D97706', bg: '#FEF3C7' },
  'txt': { color: '#6B7280', bg: '#F3F4F6' },
  'md': { color: '#7C3AED', bg: '#EDE9FE' },
}

/** 获取文件类型样式 */
const getFileTypeStyle = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  return FILE_TYPE_STYLE[ext] || { color: '#6B7280', bg: '#F3F4F6' }
}

/** 获取文件类型标签 */
const getFileTypeLabel = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const labels: Record<string, string> = {
    'pdf': 'PDF',
    'doc': 'DOC',
    'docx': 'DOC',
    'xls': 'XLS',
    'xlsx': 'XLS',
    'ppt': 'PPT',
    'pptx': 'PPT',
    'txt': 'TXT',
    'md': 'MD',
  }
  return labels[ext] || ext.toUpperCase()
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
  const [showFilePanel, setShowFilePanel] = useState(false);
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
      id: crypto.randomUUID() as unknown as number,
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
          id: crypto.randomUUID() as unknown as number,
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
      onOk: async () => {
        messagesRef.current = [];
        setMessages([]);
        await aiService.clearHistory(projectId);
        message.success("对话历史已清空");
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
    [handleSend]
  );

  const allSelected =
    files.length > 0 && selectedFileIds.length === files.length;

  /** 格式化时间 */
  const formatTime = (date: string) => {
    if (!date) return ''
    const d = new Date(date.replace(' ', 'T') + 'Z')
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 56px)' }}>
      {/* 主对话区域 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* 消息列表区域 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {messages.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center',
                padding: '40px',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  background: '#F3F4F6',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                  color: '#D1D5DB',
                  fontSize: '32px',
                }}
              >
                <RobotOutlined />
              </div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#6B7280', marginBottom: '8px' }}>
                开始对话
              </div>
              <div style={{ fontSize: '14px', color: '#9CA3AF', maxWidth: '320px', marginBottom: '24px' }}>
                选择右侧文件作为上下文，向 AI 助手提问
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                {['分析文档内容', '总结关键信息', '提取待办事项'].map((suggestion) => (
                  <div
                    key={suggestion}
                    style={{
                      padding: '8px 16px',
                      background: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      borderRadius: '9999px',
                      fontSize: '13px',
                      color: '#6B7280',
                      cursor: 'pointer',
                      transition: 'all 150ms',
                    }}
                    onClick={() => setInputValue(suggestion)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#4F46E5'
                      e.currentTarget.style.color = '#4F46E5'
                      e.currentTarget.style.background = '#EEF2FF'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#E5E7EB'
                      e.currentTarget.style.color = '#6B7280'
                      e.currentTarget.style.background = '#FFFFFF'
                    }}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                    animation: 'fadeIn 300ms ease-out',
                  }}
                >
                  {/* 头像 */}
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontSize: '14px',
                      color: 'white',
                      background: msg.role === 'user' ? '#4F46E5' : '#059669',
                    }}
                  >
                    {msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                  </div>

                  {/* 消息内容 */}
                  <div
                    style={{
                      maxWidth: '70%',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        padding: '12px 16px',
                        fontSize: '14px',
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        background: msg.role === 'user' ? '#4F46E5' : '#F3F4F6',
                        color: msg.role === 'user' ? 'white' : '#111827',
                        borderRadius: '16px',
                        borderBottomRightRadius: msg.role === 'user' ? '4px' : '16px',
                        borderBottomLeftRadius: msg.role === 'user' ? '16px' : '4px',
                      }}
                    >
                      {msg.content}
                    </div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF', padding: '0 4px' }}>
                      {formatTime(msg.created_at)}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* 加载状态提示 */}
        {isLoading && (
          <div style={{ padding: '16px 24px', background: '#F9FAFB', borderTop: '1px solid #F3F4F6' }}>
            <div style={{ display: 'flex', gap: '4px', padding: '16px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#9CA3AF', animation: 'typingBounce 1.4s infinite' }} />
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#9CA3AF', animation: 'typingBounce 1.4s infinite 0.2s' }} />
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#9CA3AF', animation: 'typingBounce 1.4s infinite 0.4s' }} />
            </div>
          </div>
        )}

        {/* 输入区域 */}
        <div style={{ padding: '16px 24px', background: '#FFFFFF', borderTop: '1px solid #E5E7EB' }}>
          {selectedFileIds.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '12px', color: '#6B7280' }}>
              <PaperClipOutlined style={{ color: '#4F46E5' }} />
              <span>已附加 <strong>{selectedFileIds.length}</strong> 个文件作为对话上下文</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <TextArea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
              autoSize={{ minRows: 1, maxRows: 4 }}
              disabled={isLoading}
              style={{
                flex: 1,
                minHeight: '44px',
                maxHeight: '120px',
                padding: '10px 14px',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                fontSize: '14px',
                lineHeight: 1.5,
                resize: 'none',
              }}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              loading={isLoading}
              disabled={!inputValue.trim()}
              style={{
                height: '44px',
                width: '44px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            />
          </div>
          <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '6px' }}>
            Enter 发送 · Shift+Enter 换行 · 右侧面板可选择上下文文件
          </div>
        </div>
      </div>

      {/* 右侧：上下文文件面板（Drawer） */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>上下文文件</span>
            {selectedFileIds.length > 0 && (
              <Badge
                count={selectedFileIds.length}
                style={{ backgroundColor: '#4F46E5' }}
                size="small"
              />
            )}
          </div>
        }
        placement="right"
        width={240}
        open={showFilePanel}
        onClose={() => setShowFilePanel(false)}
        closable={false}
        mask={false}
        styles={{
          header: { borderBottom: '1px solid #E5E7EB', padding: '12px 16px' },
          body: { padding: '8px' },
        }}
        extra={
          files.length > 0 ? (
            <Checkbox
              checked={allSelected}
              onChange={(e) => handleSelectAll(e.target.checked)}
              style={{ fontSize: '12px', color: '#6B7280' }}
            >
              全选
            </Checkbox>
          ) : null
        }
      >
        {files.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              textAlign: 'center',
              padding: '24px',
              color: '#9CA3AF',
            }}
          >
            <FileOutlined style={{ marginBottom: '8px', fontSize: '24px' }} />
            <div style={{ fontSize: '12px' }}>暂无文件</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {files.map((file) => {
              const typeStyle = getFileTypeStyle(file.filename)
              const typeLabel = getFileTypeLabel(file.filename)
              const isSelected = selectedFileIds.includes(file.id)

              return (
                <label
                  key={file.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 150ms',
                    background: isSelected ? '#EEF2FF' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = '#F9FAFB'
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <Checkbox
                    checked={isSelected}
                    onChange={(e) => handleFileToggle(file.id, e.target.checked)}
                    style={{ accentColor: '#4F46E5', flexShrink: 0 }}
                  />
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '9px',
                      fontWeight: 700,
                      background: typeStyle.bg,
                      color: typeStyle.color,
                      flexShrink: 0,
                    }}
                  >
                    {typeLabel}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {file.filename}
                    </div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '1px' }}>
                      {file.category || '未分类'} · {file.file_size ? `${(file.file_size / 1024).toFixed(1)} KB` : '-'}
                    </div>
                  </div>
                </label>
              )
            })}
          </div>
        )}

        <div
          style={{
            padding: '10px 16px',
            borderTop: '1px solid #F3F4F6',
            fontSize: '12px',
            color: '#6B7280',
            textAlign: 'center',
          }}
        >
          选中文件的内容将作为 AI 对话的参考上下文
        </div>
      </Drawer>

      {/* 文件面板切换按钮（固定在右侧） */}
      <div
        style={{
          position: 'fixed',
          right: showFilePanel ? '240px' : '0',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 100,
          transition: 'right 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <Button
          type="primary"
          icon={<FileTextOutlined />}
          onClick={() => setShowFilePanel(!showFilePanel)}
          style={{
            height: '48px',
            width: '32px',
            borderRadius: '8px 0 0 8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
          }}
        />
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes typingBounce {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          30% {
            transform: translateY(-6px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
