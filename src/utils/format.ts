/** 格式化金额（单一数据源） */
export function formatAmount(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '-'
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
  }).format(amount)
}

/** 格式化百分比：0.4 → 40.00% */
export function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`
}
