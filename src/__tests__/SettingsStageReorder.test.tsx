import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SettingsPage from '../components/Settings/SettingsPage'

// G7 — 阶段排序 UI 组件测试
describe('SettingsPage 阶段排序', () => {
  beforeEach(() => {
    vi.mocked(window.api.settings.get).mockResolvedValue({ success: true, data: {} })
    vi.mocked(window.api.settings.getPrompts).mockResolvedValue({ success: true, data: {} })
    vi.mocked(window.api.settings.update).mockResolvedValue({ success: true })
  })

  async function openStagesTab() {
    render(<SettingsPage onBack={() => {}} />)
    await waitFor(() => expect(window.api.settings.get).toHaveBeenCalled())
    await userEvent.click(screen.getByText('文件分类管理'))
  }

  it('每个阶段提供上移/下移按钮', async () => {
    await openStagesTab()
    // 默认首个阶段为「售前」
    expect(await screen.findByLabelText('下移 售前')).toBeInTheDocument()
    expect(screen.getByLabelText('上移 启动')).toBeInTheDocument()
  })

  it('首项上移按钮禁用，末项下移按钮禁用', async () => {
    await openStagesTab()
    const firstUp = await screen.findByLabelText('上移 售前')
    expect(firstUp).toBeDisabled()
    const lastDown = screen.getByLabelText('下移 关闭')
    expect(lastDown).toBeDisabled()
  })

  it('下移后保存的 custom_stages 顺序改变', async () => {
    await openStagesTab()
    await userEvent.click(await screen.findByLabelText('下移 售前'))
    await userEvent.click(screen.getByText('保存配置'))
    await waitFor(() => expect(window.api.settings.update).toHaveBeenCalled())
    const payload = vi.mocked(window.api.settings.update).mock.calls[0][0]
    const stages = JSON.parse(payload.custom_stages)
    expect(stages[0]).toBe('启动')
    expect(stages[1]).toBe('售前')
  })
})
