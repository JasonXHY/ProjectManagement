import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChatWindow from '../components/Chat/ChatWindow'
import { aiService } from '../services/aiService'

vi.mock('../services/aiService', () => ({
  aiService: {
    chat: vi.fn(),
    getHistory: vi.fn().mockResolvedValue({ success: true, data: [] }),
    getSessions: vi.fn().mockResolvedValue({ success: true, data: [] }),
    clearHistory: vi.fn().mockResolvedValue({ success: true }),
  },
}))

vi.mock('../services/fileService', () => ({
  fileService: { list: vi.fn().mockResolvedValue({ success: true, data: [] }) },
}))

// G8 — 对话计时 + 停止按钮 + 重试上限
describe('ChatWindow 等待计时与停止', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('发送后显示「已等待 X 秒」并随时间递增，含停止按钮', async () => {
    // chat 永不 resolve，模拟生成中
    vi.mocked(aiService.chat).mockReturnValue(new Promise(() => {}))
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<ChatWindow projectId={1} />)

    const textarea = await screen.findByPlaceholderText(/输入/)
    await user.type(textarea, '你好')
    await user.keyboard('{Enter}')

    expect(await screen.findByText(/已等待 0 秒/)).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(2000) })
    await waitFor(() => expect(screen.getByText(/已等待 2 秒/)).toBeInTheDocument())
    expect(screen.getByLabelText('停止生成')).toBeInTheDocument()
  })
})
