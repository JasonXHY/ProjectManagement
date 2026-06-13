import { useState, useCallback, useEffect, useRef } from "react";
import {
  Input,
  Button,
  Modal,
  message,
} from "antd";
import {
  SendOutlined,
  ClearOutlined,
  CommentOutlined,
  RobotOutlined,
  UserOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import type { ChatConversationMessage } from "../../types";
import { aiService } from "../../services/aiService";
import { formatTime, formatSessionTime } from "../../utils/time";
const { TextArea } = Input;

/** 对话窗口属性 */
interface ChatWindowProps {
  projectId: number;
}



/**
 * 对话窗口组件
 * 支持文档上传并对话，可根据文档内容更新项目
 */
export default function ChatWindow({
  projectId,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatConversationMessage[]>([]);
  const messagesRef = useRef<ChatConversationMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

  /** 组件挂载时加载会话列表 */
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

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

    // 创建用户消息（临时）
    const userMessage: ChatConversationMessage = {
      id: crypto.randomUUID(),
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
      // 调用 AI 服务，传递上下文文件 IDs 和会话 ID
      const result = await aiService.chat(projectId, content, [], currentSessionId);

      if (result.success && result.data) {
        // 显示 AI 回复
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
  }, [inputValue, isLoading, projectId, currentSessionId]);

  /** 切换会话 */
  const handleSessionSwitch = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId);
    setShowSessionList(false);
  }, []);

  /** 创建新会话 */
  const handleNewSession = useCallback(() => {
    setCurrentSessionId(crypto.randomUUID());
    setShowSessionList(false);
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
  }, [projectId, loadSessions]);


  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 56px)' }}>
      {/* 左侧：会话历史列表 */}
      <div
        style={{
          width: showSessionList ? '280px' : '48px',
          borderRight: '1px solid #E5E7EB',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          background: '#F9FAFB',
        }}
      >
        {/* 会话列表头部 */}
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: '48px',
          }}
        >
          {showSessionList ? (
            <>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                对话历史
              </div>
              <Button
                type="text"
                icon={<ClearOutlined />}
                onClick={handleNewSession}
                style={{ color: '#4F46E5' }}
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

        {/* 会话列表内容 */}
        {showSessionList && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {sessions.length === 0 ? (
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
                <CommentOutlined style={{ marginBottom: '8px', fontSize: '24px' }} />
                <div style={{ fontSize: '12px' }}>暂无对话历史</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {sessions.map((session) => (
                  <div
                    key={session.session_id}
                    onClick={() => handleSessionSwitch(session.session_id)}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 150ms',
                      background: currentSessionId === session.session_id ? '#EEF2FF' : 'transparent',
                      border: currentSessionId === session.session_id ? '1px solid #C7D2FE' : '1px solid transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (currentSessionId !== session.session_id) {
                        e.currentTarget.style.background = '#F3F4F6';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentSessionId !== session.session_id) {
                        e.currentTarget.style.background = 'transparent';
                      }
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
                向 AI 助手提问
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
            <Button
              type="text"
              icon={<ClearOutlined />}
              onClick={handleClearCurrentSession}
              style={{
                height: '44px',
                width: '44px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: '#9CA3AF',
              }}
            />
          </div>
          <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '6px' }}>
            Enter 发送 · Shift+Enter 换行
          </div>
        </div>
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
