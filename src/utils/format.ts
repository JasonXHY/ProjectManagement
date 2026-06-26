/** 格式化金额：>=10000显示万，<10000显示千分位 */
export function formatAmount(amount: number): string {
  if (amount >= 10000) {
    return `¥${(amount / 10000).toFixed(2)}万`
  }
  return `¥${amount.toLocaleString()}`
}

/** 格式化百分比：0.4 → 40.00% */
export function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`
}
