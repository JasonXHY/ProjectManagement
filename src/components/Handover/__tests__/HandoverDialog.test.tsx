import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HandoverDialog from '../HandoverDialog'
import { FileRecord } from '../../../types'

const mockFiles: FileRecord[] = [
  {
    id: 1,
    project_id: 1,
    filename: '需求文档.docx',
    original_path: '需求文档.docx',
    stored_path: '售前/需求文档.docx',
    category: '售前',
    subcategory: '需求',
    stage: '售前',
    file_type: 'docx',
    file_size: 1024,
    content_extracted: null,
    is_analyzed: false,
    has_signature: false,
    signature_status: 'unsigned',
    ai_summary: '项目需求文档',
    ai_key_info: null,
    created_at: '2026-01-01',
  },
  {
    id: 2,
    project_id: 1,
    filename: '合同.pdf',
    original_path: '合同.pdf',
    stored_path: '售前/合同.pdf',
    category: '售前',
    subcategory: '合同',
    stage: '售前',
    file_type: 'pdf',
    file_size: 2048,
    content_extracted: null,
    is_analyzed: false,
    has_signature: false,
    signature_status: 'unsigned',
    ai_summary: '项目合同',
    ai_key_info: null,
    created_at: '2026-01-02',
  },
]

describe('HandoverDialog', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    projectId: 1,
    projectName: '测试项目',
  }

  beforeEach(() => {
    vi.mocked(window.api.file.list).mockResolvedValue({ success: true, data: mockFiles })
    vi.mocked(window.api.handover.aiSelect).mockResolvedValue({ success: true, data: [] })
    vi.mocked(window.api.handover.export).mockResolvedValue({ success: true, data: { zipPath: '/test.zip', fileSize: 1024 } })
  })

  it('renders dialog with title', () => {
    render(<HandoverDialog {...defaultProps} />)
    expect(screen.getByText('项目转交')).toBeInTheDocument()
  })

  it('shows mode selection radios', () => {
    render(<HandoverDialog {...defaultProps} />)
    expect(screen.getByText('整体转交')).toBeInTheDocument()
    expect(screen.getByText('协作转交')).toBeInTheDocument()
  })

  it('defaults to full mode', () => {
    render(<HandoverDialog {...defaultProps} />)
    const fullRadio = screen.getByDisplayValue('full')
    expect(fullRadio).toBeChecked()
  })

  it('shows handover note textarea', () => {
    render(<HandoverDialog {...defaultProps} />)
    expect(screen.getByPlaceholderText('添加转交说明，帮助新同事了解项目背景')).toBeInTheDocument()
  })

  it('hides selective mode fields when in full mode', () => {
    render(<HandoverDialog {...defaultProps} />)
    expect(screen.queryByText('新同事描述')).not.toBeInTheDocument()
    expect(screen.queryByText('AI 推荐文件')).not.toBeInTheDocument()
  })

  it('shows selective mode fields when switching to selective mode', async () => {
    const user = userEvent.setup()
    render(<HandoverDialog {...defaultProps} />)

    await user.click(screen.getByText('协作转交'))

    expect(screen.getByText('新同事描述')).toBeInTheDocument()
    expect(screen.getByText('AI 推荐文件')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/描述新同事的角色/)).toBeInTheDocument()
  })

  it('loads files when opened', async () => {
    render(<HandoverDialog {...defaultProps} />)
    await waitFor(() => {
      expect(window.api.file.list).toHaveBeenCalledWith(1)
    })
  })

  it('shows file list in selective mode', async () => {
    const user = userEvent.setup()
    render(<HandoverDialog {...defaultProps} />)

    await user.click(screen.getByText('协作转交'))

    await waitFor(() => {
      expect(screen.getByText('需求文档.docx')).toBeInTheDocument()
      expect(screen.getByText('合同.pdf')).toBeInTheDocument()
    })
  })

  it('calls AI select when button clicked with description', async () => {
    const user = userEvent.setup()
    vi.mocked(window.api.handover.aiSelect).mockResolvedValue({
      success: true,
      data: [{ filename: '需求文档.docx', relative_path: '', category: null, subcategory: null, stage: null, file_type: null, file_size: null, content_extracted: null, signature_status: 'unsigned', ai_summary: null, ai_key_info: null }],
    })

    render(<HandoverDialog {...defaultProps} />)

    await user.click(screen.getByText('协作转交'))
    await user.type(screen.getByPlaceholderText(/描述新同事的角色/), '前端开发')
    await user.click(screen.getByText('AI 推荐文件'))

    await waitFor(() => {
      expect(window.api.handover.aiSelect).toHaveBeenCalledWith(1, '前端开发')
    })
  })

  it('shows warning when AI button clicked without description', async () => {
    const user = userEvent.setup()
    render(<HandoverDialog {...defaultProps} />)

    await user.click(screen.getByText('协作转交'))
    await user.click(screen.getByText('AI 推荐文件'))

    await waitFor(() => {
      expect(window.api.handover.aiSelect).not.toHaveBeenCalled()
    })
  })

  it('calls export with full mode params', async () => {
    const user = userEvent.setup()
    render(<HandoverDialog {...defaultProps} />)

    const exportBtn = screen.getByRole('button', { name: /导出/ })
    await user.click(exportBtn)

    await waitFor(() => {
      expect(window.api.handover.export).toHaveBeenCalledWith({
        projectId: 1,
        mode: 'full',
        selectedFiles: undefined,
        handoverNote: undefined,
      })
    })
  })

  it('calls export with selective mode params', async () => {
    const user = userEvent.setup()
    render(<HandoverDialog {...defaultProps} />)

    await user.click(screen.getByText('协作转交'))
    await user.type(screen.getByPlaceholderText(/描述新同事的角色/), '前端开发')

    await waitFor(() => {
      expect(screen.getByText('需求文档.docx')).toBeInTheDocument()
    })

    await user.click(screen.getByText('需求文档.docx'))

    const exportBtn = screen.getByRole('button', { name: /导出/ })
    await user.click(exportBtn)

    await waitFor(() => {
      expect(window.api.handover.export).toHaveBeenCalledWith({
        projectId: 1,
        mode: 'selective',
        selectedFiles: ['需求文档.docx'],
        handoverNote: undefined,
      })
    })
  })

  it('calls onClose when cancel clicked', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<HandoverDialog {...defaultProps} onClose={onClose} />)

    const cancelBtn = screen.getByRole('button', { name: /取\s*消/ })
    await user.click(cancelBtn)
    expect(onClose).toHaveBeenCalled()
  })

  it('does not render when open is false', () => {
    render(<HandoverDialog {...defaultProps} open={false} />)
    expect(screen.queryByText('项目转交')).not.toBeInTheDocument()
  })

  it('includes handover note in export', async () => {
    const user = userEvent.setup()
    render(<HandoverDialog {...defaultProps} />)

    await user.type(screen.getByPlaceholderText('添加转交说明，帮助新同事了解项目背景'), '这是转交说明')
    const exportBtn = screen.getByRole('button', { name: /导出/ })
    await user.click(exportBtn)

    await waitFor(() => {
      expect(window.api.handover.export).toHaveBeenCalledWith(
        expect.objectContaining({ handoverNote: '这是转交说明' })
      )
    })
  })
})
