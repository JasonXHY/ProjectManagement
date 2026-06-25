import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'

interface MermaidChartProps {
  code: string
  id?: string
}

// 初始化mermaid配置
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif',
})

export default function MermaidChart({ code, id }: MermaidChartProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!ref.current || !code) return

    const chartId = id || `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    mermaid.render(chartId, code.trim())
      .then(({ svg }) => {
        if (ref.current) {
          ref.current.innerHTML = svg
          setError(null)
        }
      })
      .catch((err) => {
        console.error('[Mermaid] 渲染失败:', err)
        setError(err.message || '图表渲染失败')
        if (ref.current) {
          ref.current.innerHTML = `<pre style="color: var(--color-error); padding: 8px; background: var(--color-error-light); border-radius: 4px;">${err.message || '图表渲染失败'}</pre>`
        }
      })
  }, [code, id])

  return (
    <div
      ref={ref}
      className="mermaid-chart"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        padding: '16px',
        margin: '8px 0',
        overflowX: 'auto',
      }}
    />
  )
}
