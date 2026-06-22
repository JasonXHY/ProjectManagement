import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ImportDialog from '../ImportDialog'

describe('ImportDialog', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onImported: vi.fn(),
  }

  beforeEach(() => {
    vi.mocked(window.api.handover.preview).mockResolvedValue({
      success: true,
      data: {
        projectName: '测试项目',
        fileCount: 10,
        stage: '进行中',
        handoverNote: '这是一个测试转交说明',
      },
    })
    vi.mocked(window.api.handover.import).mockResolvedValue({
      success: true,
      data: { projectId: 1 },
    })
  })

  it('renders dialog with title', () => {
    render(<ImportDialog {...defaultProps} />)
    expect(screen.getByText('导入转交项目')).toBeInTheDocument()
  })

  it('shows upload area when no file selected', () => {
    render(<ImportDialog {...defaultProps} />)
    expect(screen.getByText('点击或拖拽 .pmaer.zip 文件到此处')).toBeInTheDocument()
  })

  it('does not render when open is false', () => {
    render(<ImportDialog {...defaultProps} open={false} />)
    expect(screen.queryByText('导入转交项目')).not.toBeInTheDocument()
  })

  it('calls onClose when cancel clicked after preview', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<ImportDialog {...defaultProps} onClose={onClose} />)

    const fileInput = document.querySelector('.ant-upload input[type="file"]') as HTMLInputElement
    const file = new File(['test'], 'test.pmaer.zip', { type: 'application/zip' })
    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(screen.getByText('导入后项目名称：')).toBeInTheDocument()
    })

    const cancelBtn = screen.getByRole('button', { name: /取.*消/ })
    await user.click(cancelBtn)
    expect(onClose).toHaveBeenCalled()
  })

  it('shows preview after file selection', async () => {
    const user = userEvent.setup()
    render(<ImportDialog {...defaultProps} />)

    const fileInput = document.querySelector('.ant-upload input[type="file"]') as HTMLInputElement
    const file = new File(['test'], 'test.pmaer.zip', { type: 'application/zip' })
    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(window.api.handover.preview).toHaveBeenCalledWith('test.pmaer.zip')
    })

    await waitFor(() => {
      expect(screen.getByText('项目名称：')).toBeInTheDocument()
      expect(screen.getByText('测试项目')).toBeInTheDocument()
      expect(screen.getByText('文件数量：')).toBeInTheDocument()
      expect(screen.getByText('10 个文件')).toBeInTheDocument()
      expect(screen.getByText('项目阶段：')).toBeInTheDocument()
      expect(screen.getByText('进行中')).toBeInTheDocument()
      expect(screen.getByText('转交说明：')).toBeInTheDocument()
      expect(screen.getByText('这是一个测试转交说明')).toBeInTheDocument()
    })
  })

  it('shows editable project name input', async () => {
    const user = userEvent.setup()
    render(<ImportDialog {...defaultProps} />)

    const fileInput = document.querySelector('.ant-upload input[type="file"]') as HTMLInputElement
    const file = new File(['test'], 'test.pmaer.zip', { type: 'application/zip' })
    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(screen.getByText('导入后项目名称：')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('请输入项目名称')).toBeInTheDocument()
    })
  })

  it('calls import when confirm button clicked', async () => {
    const user = userEvent.setup()
    render(<ImportDialog {...defaultProps} />)

    const fileInput = document.querySelector('.ant-upload input[type="file"]') as HTMLInputElement
    const file = new File(['test'], 'test.pmaer.zip', { type: 'application/zip' })
    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(screen.getByText('导入后项目名称：')).toBeInTheDocument()
    })

    const confirmBtn = screen.getByRole('button', { name: /确认导入/ })
    await user.click(confirmBtn)

    await waitFor(() => {
      expect(window.api.handover.import).toHaveBeenCalledWith({
        zipPath: 'test.pmaer.zip',
        projectName: '测试项目',
      })
    })
  })

  it('calls onImported after successful import', async () => {
    const onImported = vi.fn()
    const user = userEvent.setup()
    render(<ImportDialog {...defaultProps} onImported={onImported} />)

    const fileInput = document.querySelector('.ant-upload input[type="file"]') as HTMLInputElement
    const file = new File(['test'], 'test.pmaer.zip', { type: 'application/zip' })
    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(screen.getByText('导入后项目名称：')).toBeInTheDocument()
    })

    const confirmBtn = screen.getByRole('button', { name: /确认导入/ })
    await user.click(confirmBtn)

    await waitFor(() => {
      expect(onImported).toHaveBeenCalled()
    })
  })

  it('calls onClose after successful import', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<ImportDialog {...defaultProps} onClose={onClose} />)

    const fileInput = document.querySelector('.ant-upload input[type="file"]') as HTMLInputElement
    const file = new File(['test'], 'test.pmaer.zip', { type: 'application/zip' })
    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(screen.getByText('导入后项目名称：')).toBeInTheDocument()
    })

    const confirmBtn = screen.getByRole('button', { name: /确认导入/ })
    await user.click(confirmBtn)

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('rejects non .pmaer.zip files', async () => {
    const user = userEvent.setup()
    render(<ImportDialog {...defaultProps} />)

    const fileInput = document.querySelector('.ant-upload input[type="file"]') as HTMLInputElement
    const file = new File(['test'], 'test.zip', { type: 'application/zip' })
    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(window.api.handover.preview).not.toHaveBeenCalled()
    })
  })

  it('resets state when closed', async () => {
    const { rerender } = render(<ImportDialog {...defaultProps} open={false} />)
    rerender(<ImportDialog {...defaultProps} open={true} />)
    expect(screen.getByText('点击或拖拽 .pmaer.zip 文件到此处')).toBeInTheDocument()
  })
})
