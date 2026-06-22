import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MarkdownPreview from '../index'

describe('MarkdownPreview', () => {
  it('renders markdown content', () => {
    render(<MarkdownPreview content="# Hello World" />)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('renders GFM tables', () => {
    const md = '| Name | Value |\n|------|-------|\n| A | 1 |'
    render(<MarkdownPreview content={md} />)
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Value')).toBeInTheDocument()
  })

  it('renders code blocks', () => {
    const md = '```js\nconst x = 1\n```'
    render(<MarkdownPreview content={md} />)
    expect(screen.getByText('const')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('applies maxHeight style', () => {
    const { container } = render(<MarkdownPreview content="test" maxHeight={300} />)
    expect(container.firstChild).toHaveStyle({ maxHeight: 300 })
  })
})
