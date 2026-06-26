import { useState, useCallback, useEffect, useRef } from "react";
import {
  Input,
  Button,
  Modal,
  Checkbox,
  message,
} from "antd";
import { isApiError } from "../../utils/error";
import {
  SendOutlined,
  ClearOutlined,
  CommentOutlined,
  RobotOutlined,
  UserOutlined,
  HistoryOutlined,
  PaperClipOutlined,
  ReloadOutlined,
  StopOutlined,
  FileTextOutlined,
  FolderOutlined,
} from "@ant-design/icons";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MermaidChart from "../MermaidChart";
import type { ChatConversationMessage, FileRecord } from "../../types";
import { aiService } from "../../services/aiService";
import { fileService } from "../../services/fileService";
import { formatTime, formatSessionTime } from "../../utils/time";
import { useElapsedSeconds } from "./useElapsedSeconds";
const { TextArea } = Input;

/** 对话窗口属性 */
interface ChatWindowProps {
  projectId: number;
}

/**
 * 对话窗口组件
 * 支持文档上传并对话，可根据文档内容更新项目
 * 
 * 设计决策：
 * - 右侧240px文件面板：用于选择上下文文件，让AI对话能引用具体文件内容
 * - 面板可折叠：默认收起，点击按钮展开，节省空间
 * - 支持重试/取消：AI响应失败可重试，生成过程中可取消
 */
export default function ChatWindow({
  projectId,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatConversationMessage[]>([]);
  const messagesRef = useRef<ChatConversationMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const elapsedSeconds = useElapsedSeconds(isLoading);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRY = 2;
  const abortControllerRef = useRef<AbortController | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => crypto.randomUUID());
  const [sessions, setSessions] = useState<Array<{
    session_id: string;
    first_message: string;
    message_count: number;
    created_at: string;
    updated_at: string;
  }>>([]);
  const [showSessionList, setShowSessionList] = useState(false);

  // 文件面板状态
  const [showFilePanel, setShowFilePanel] = useState(false);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [selectedFileIds, setSelectedFileIds] = useState<number[]>([]);

  /** 加载文件列表 */
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

  /** 加载会话列表 */
  const loadSessions = useCallback(async () => {
    try {
      const result = await aiService.getSessions(projectId);
      if (result.success && result.data) {
        setSessions(result.data);
      }
    } catch (err) {
      console.error("[ChatWindow] 加载会话列表失败:", err);
    }
  }, [projectId]);

  /** 组件挂载时加载数据 */
  useEffect(() => {
    loadSessions();
    loadFiles();
  }, [loadSessions, loadFiles]);

  /** 加载对话历史 */
  useEffect(() => {
    if (!projectId) return
    let cancelled = false
    aiService.getHistory(projectId, currentSessionId).then((result) => {
      if (cancelled) return
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
      if (!cancelled) console.error("[ChatWindow] 加载对话历史失败:", err);
    });
    return () => { cancelled = true }
  }, [projectId, currentSessionId]);

  /** 自动滚动到底部 */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /** 发送消息 */
  const handleSend = useCallback(async () => {
    const content = inputValue.trim();
    if (!content || isLoading) return;

    const userMessage: ChatConversationMessage = {
      id: crypto.randomUUID(),
      project_id: projectId,
      role: "user",
      content,
      created_at: new Date().toISOString(),
      token_count: null,
    };

    const updatedMessages = [...messagesRef.current, userMessage];
    messagesRef.current = updatedMessages;
    setMessages(updatedMessages);
    setInputValue("");
    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const result = await aiService.chat(projectId, content, selectedFileIds, currentSessionId);

      if (controller.signal.aborted) return;

      if (result.success && result.data) {
        const aiMessage: ChatConversationMessage = {
          id: crypto.randomUUID(),
          project_id: projectId,
          role: "assistant",
          content: result.data,
          created_at: new Date().toISOString(),
          token_count: null,
        };

        const finalMessages = [...messagesRef.current, aiMessage];
        messagesRef.current = finalMessages;
        setMessages(finalMessages);
        setRetryCount(0);
      } else {
        const errMsg = isApiError(result.error)
          ? result.error.message
          : typeof result.error === 'string'
          ? result.error
          : "发送消息失败，请重试";
        message.error(errMsg);
        const reverted = messagesRef.current.filter(
          (m) => m.id !== userMessage.id
        );
        messagesRef.current = reverted;
        setMessages(reverted);
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      console.error("[ChatWindow] 发送消息失败:", error);
      message.error("发送消息失败，请重试");
      const reverted = messagesRef.current.filter(
        (m) => m.id !== userMessage.id
      );
      messagesRef.current = reverted;
      setMessages(reverted);
    } finally {
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, [inputValue, isLoading, projectId, currentSessionId, selectedFileIds]);

  /** 取消当前请求 */
  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      message.info("已取消生成");
    }
  }, []);

  /** 重试上一条用户消息（最多 MAX_RETRY 次） */
  const handleRetry = useCallback(async () => {
    if (retryCount >= MAX_RETRY) {
      message.warning(`已达最大重试次数（${MAX_RETRY} 次）`);
      return;
    }
    const lastUserMessage = [...messagesRef.current].reverse().find(m => m.role === 'user');
    if (!lastUserMessage) return;

    setRetryCount((c) => c + 1);
    setInputValue(lastUserMessage.content);
  }, [retryCount]);

  /** 切换会话 */
  const handleSessionSwitch = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId);
    setShowSessionList(false);
    setSelectedFileIds([]);
  }, []);

  /** 创建新会话 */
  const handleNewSession = useCallback(() => {
    setCurrentSessionId(crypto.randomUUID());
    setShowSessionList(false);
    setSelectedFileIds([]);
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

  /** 清空当前会话历史 */
  const handleClearCurrentSession = useCallback(() => {
    Modal.confirm({
      title: "确认清空",
      content: "确定要清空当前会话的对话历史吗？此操作不可撤销。",
      okText: "确认清空",
      cancelText: "取消",
      okButtonProps: { danger: true },
      onOk: async () => {
        messagesRef.current = [];
        setMessages([]);
        await aiService.clearHistory(projectId, currentSessionId);
        message.success("当前会话历史已清空");
        setCurrentSessionId(crypto.randomUUID());
        loadSessions();
      },
    });
  }, [projectId, currentSessionId, loadSessions]);

  /** 获取文件类型图标 */
  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (['pdf'].includes(ext)) return <FileTextOutlined style={{ color: '#DC2626' }} />;
    if (['doc', 'docx'].includes(ext)) return <FileTextOutlined style={{ color: '#2563EB' }} />;
    if (['xls', 'xlsx'].includes(ext)) return <FileTextOutlined style={{ color: '#059669' }} />;
    return <FolderOutlined style={{ color: '#6B7280' }} />;
  };

  /** 检查是否有失败的AI消息 */
  const hasFailedMessage = messagesRef.current.length > 0 && 
    messagesRef.current[messagesRef.current.length - 1]?.role === 'user';

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 56px)' }}>
      {/* 左侧：会话历史列表 */}
      <div
        style={{
          width: showSessionList ? '280px' : '48px',
          borderRight: '1px solid var(--border-default)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width var(--transition-slow)',
          overflow: 'hidden',
          background: 'var(--bg-hover)',
        }}
      >
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            borderBottom: '1px solid var(--border-default)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: '48px',
          }}
        >
          {showSessionList ? (
            <>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                对话历史
              </div>
              <Button
                type="text"
                icon={<ClearOutlined />}
                onClick={handleNewSession}
                style={{ color: 'var(--color-primary)' }}
              />
            </>
          ) : (
            <Button
              type="text"
              icon={<HistoryOutlined />}
              onClick={() => setShowSessionList(true)}
              style={{ width: '100%', justifyContent: 'flex-start' }}
            />
          )}
        </div>

        {showSessionList && (
          <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-2)' }}>
            {sessions.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  textAlign: 'center',
                  padding: 'var(--space-6)',
                  color: 'var(--text-placeholder)',
                }}
              >
                <CommentOutlined style={{ marginBottom: 'var(--space-2)', fontSize: '24px' }} />
                <div style={{ fontSize: '12px' }}>暂无对话历史</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                {sessions.map((session) => (
                  <div
                    key={session.session_id}
                    className={`session-item${currentSessionId === session.session_id ? ' active' : ''}`}
                    onClick={() => handleSessionSwitch(session.session_id)}
                    style={{
                      padding: 'var(--space-3)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                      background: currentSessionId === session.session_id ? 'var(--color-primary-light)' : 'transparent',
                      border: currentSessionId === session.session_id ? '1px solid #C7D2FE' : '1px solid transparent',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        color: '#111827',
                        marginBottom: '4px',
                        lineHeight: 1.4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {session.first_message}
                    </div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
                      {session.message_count} 条消息 · {formatSessionTime(session.updated_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 主对话区域 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* 消息列表区域 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-6)' }}>
          {messages.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center',
                padding: 'var(--space-10)',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 'var(--space-5)',
                  color: 'var(--text-disabled)',
                  fontSize: '32px',
                }}
              >
                <RobotOutlined />
              </div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
                开始对话
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-placeholder)', maxWidth: '320px', marginBottom: 'var(--space-6)' }}>
                向 AI 助手提问，可选择文件作为上下文
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', justifyContent: 'center' }}>
                {['分析文档内容', '总结关键信息', '提取待办事项'].map((suggestion) => (
                  <div
                    key={suggestion}
                    className="suggestion-chip"
                    style={{
                      padding: 'var(--space-2) var(--space-4)',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                    }}
                    onClick={() => setInputValue(suggestion)}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              {messages.map((msg, index) => (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    gap: 'var(--space-3)',
                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                    animation: 'fadeIn 300ms ease-out',
                  }}
                >
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
                      background: msg.role === 'user' ? 'var(--color-primary)' : '#059669',
                    }}
                  >
                    {msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                  </div>

                  <div
                    style={{
                      maxWidth: '70%',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-1)',
                      alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      className={msg.role !== 'user' ? 'markdown-body' : ''}
                      style={{
                        padding: 'var(--space-3) var(--space-4)',
                        fontSize: '14px',
                        lineHeight: 1.6,
                        whiteSpace: msg.role === 'user' ? 'pre-wrap' : 'normal',
                        wordBreak: 'break-word',
                        background: msg.role === 'user' ? 'var(--color-primary)' : 'var(--bg-secondary)',
                        color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                        borderRadius: 'var(--radius-xl)',
                        borderBottomRightRadius: msg.role === 'user' ? 'var(--radius-sm)' : 'var(--radius-xl)',
                        borderBottomLeftRadius: msg.role === 'user' ? 'var(--radius-xl)' : 'var(--radius-sm)',
                      }}
                    >
                      {msg.role === 'user' ? (
                        msg.content
                      ) : (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({ node, className, children, ...props }) {
                              const match = /language-(\w+)/.exec(className || '')
                              if (match && match[1] === 'mermaid') {
                                return <MermaidChart code={String(children).replace(/\n$/, '')} />
                              }
                              return <code className={className} {...props}>{children}</code>
                            }
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-placeholder)', padding: '0 var(--space-1)' }}>
                      {formatTime(msg.created_at)}
                    </div>
                    {/* 重试按钮：仅显示在最后一条AI消息失败时 */}
                    {msg.role === 'user' && index === messages.length - 1 && hasFailedMessage && !isLoading && (
                      <Button
                        type="link"
                        size="small"
                        icon={<ReloadOutlined />}
                        onClick={handleRetry}
                        style={{ fontSize: '12px', color: 'var(--text-placeholder)', padding: '0 var(--space-1)' }}
                      >
                        重试
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* 加载状态提示 + 取消按钮 */}
        {isLoading && (
          <div style={{ padding: 'var(--space-3) var(--space-6)', background: 'var(--bg-hover)', borderTop: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--text-placeholder)', animation: 'typingBounce 1.4s infinite' }} />
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--text-placeholder)', animation: 'typingBounce 1.4s infinite 0.2s' }} />
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--text-placeholder)', animation: 'typingBounce 1.4s infinite 0.4s' }} />
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-placeholder)' }}>
                已等待 {elapsedSeconds} 秒...
              </span>
            </div>
            <Button
              danger
              size="small"
              shape="circle"
              aria-label="停止生成"
              icon={<StopOutlined />}
              onClick={handleCancel}
            />
          </div>
        )}

        {/* 输入区域 */}
        <div style={{ padding: 'var(--space-4) var(--space-6)', background: 'var(--bg-surface)', borderTop: '1px solid var(--border-default)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-end' }}>
            <Button
              type="text"
              icon={<PaperClipOutlined />}
              onClick={() => setShowFilePanel(!showFilePanel)}
              style={{
                height: '44px',
                width: '44px',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: showFilePanel ? 'var(--color-primary)' : 'var(--text-placeholder)',
                background: showFilePanel ? 'var(--color-primary-light)' : 'transparent',
              }}
            />
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
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)',
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
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            />
            <Button
              type="text"
              icon={<ClearOutlined />}
              onClick={handleClearCurrentSession}
              style={{
                height: '44px',
                width: '44px',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: 'var(--text-placeholder)',
              }}
            />
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-placeholder)', marginTop: '6px', display: 'flex', justifyContent: 'space-between' }}>
            <span>Enter 发送 · Shift+Enter 换行</span>
            {selectedFileIds.length > 0 && (
              <span style={{ color: 'var(--color-primary)' }}>已选择 {selectedFileIds.length} 个文件作为上下文</span>
            )}
          </div>
        </div>
      </div>

      {/* 右侧：文件选择面板 */}
      {showFilePanel && (
        <div
          style={{
            width: '240px',
            borderLeft: '1px solid var(--border-default)',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-hover)',
          }}
        >
          <div
            style={{
              padding: 'var(--space-3) var(--space-4)',
              borderBottom: '1px solid var(--border-default)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
              上下文文件
            </div>
            <Button
              type="text"
              size="small"
              onClick={() => setSelectedFileIds([])}
              disabled={selectedFileIds.length === 0}
              style={{ fontSize: '12px', color: 'var(--text-placeholder)' }}
            >
              清空
            </Button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-2)' }}>
            {files.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  textAlign: 'center',
                  padding: 'var(--space-6)',
                  color: 'var(--text-placeholder)',
                }}
              >
                <FileTextOutlined style={{ marginBottom: 'var(--space-2)', fontSize: '24px' }} />
                <div style={{ fontSize: '12px' }}>暂无文件</div>
                <div style={{ fontSize: '11px', marginTop: 'var(--space-1)' }}>请先上传文件</div>
              </div>
            ) : (
              <Checkbox.Group
                value={selectedFileIds}
                onChange={(values) => setSelectedFileIds(values as number[])}
                style={{ width: '100%' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  {files.map((file) => (
                    <div
                      key={file.id}
                      style={{
                        padding: 'var(--space-2) var(--space-3)',
                        borderRadius: 'var(--radius-md)',
                        transition: 'all var(--transition-fast)',
                        background: selectedFileIds.includes(file.id) ? 'var(--color-primary-light)' : 'transparent',
                      }}
                    >
                      <Checkbox value={file.id} style={{ width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                          {getFileIcon(file.filename)}
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div
                              style={{
                                fontSize: '13px',
                                color: '#111827',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {file.filename}
                            </div>
                            {file.category && (
                              <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
                                {file.category}
                              </div>
                            )}
                          </div>
                        </div>
                      </Checkbox>
                    </div>
                  ))}
                </div>
              </Checkbox.Group>
            )}
          </div>
        </div>
      )}

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
