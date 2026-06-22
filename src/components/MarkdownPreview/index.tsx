import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import '../../styles/markdown-preview.css'

interface MarkdownPreviewProps {
  content: string
  maxHeight?: number
}

export default function MarkdownPreview({ content, maxHeight = 600 }: MarkdownPreviewProps) {
  return (
    <div className="markdown-body" style={{ maxHeight, overflowY: 'auto', padding: '16px 0' }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw, rehypeSanitize]}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
