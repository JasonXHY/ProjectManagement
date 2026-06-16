import { useEffect, useState } from 'react'

/**
 * 计时 hook：active 为 true 时每秒递增并返回已等待秒数；
 * active 变为 false 时归零。用于 AI 回复期间显示「已等待 X 秒...」。
 */
export function useElapsedSeconds(active: boolean): number {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    if (!active) {
      setSeconds(0)
      return
    }
    setSeconds(0)
    const timer = setInterval(() => {
      setSeconds((s) => s + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [active])

  return seconds
}
