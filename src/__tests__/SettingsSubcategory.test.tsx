import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SettingsPage from '../components/Settings/SettingsPage'

// G4 — 子分类管理 UI 组件测试
describe('SettingsPage 子分类管理', () => {
  beforeEach(() => {
    vi.mocked(window.api.settings.get).mockResolvedValue({ success: true, data: {} })
    vi.mocked(window.api.settings.getPrompts).mockResolvedValue({ success: true, data: {} })
    vi.mocked(window.api.settings.update).mockResolvedValue({ success: true })
  })

  async function openStagesTab() {
    render(<SettingsPage />)
    await waitFor(() => expect(window.api.settings.get).toHaveBeenCalled())
    await userEvent.click(screen.getByText('文件分类管理'))
  }

  it('展示各阶段的默认子分类', async () => {
    await openStagesTab()
    const buildBlock = await screen.findByTestId('subcat-stage-构建')
    expect(within(buildBlock).getByText('开发文档')).toBeInTheDocument()
    expect(within(buildBlock).getByText('接口文档')).toBeInTheDocument()
    expect(within(buildBlock).getByText('配置文档')).toBeInTheDocument()
  })

  it('能新增子分类', async () => {
    await openStagesTab()
    const buildBlock = await screen.findByTestId('subcat-stage-构建')
    const input = within(buildBlock).getByPlaceholderText('新增子分类')
    await userEvent.type(input, '性能测试')
    await userEvent.click(within(buildBlock).getByText('添加'))
    expect(within(buildBlock).getByText('性能测试')).toBeInTheDocument()
  })

  it('保存时携带 custom_subcategories', async () => {
    await openStagesTab()
    await userEvent.click(screen.getByText('保存配置'))
    await waitFor(() => expect(window.api.settings.update).toHaveBeenCalled())
    const payload = vi.mocked(window.api.settings.update).mock.calls[0][0]
    expect(payload).toHaveProperty('custom_subcategories')
    const parsed = JSON.parse(payload.custom_subcategories)
    expect(parsed['构建']).toContain('开发文档')
  })
})
