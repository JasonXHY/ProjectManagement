/** 在数组中将 index 处的元素上移/下移一位（不可变；越界或边界时返回原数组副本） */
export function moveItem<T>(arr: T[], index: number, direction: 'up' | 'down'): T[] {
  const next = [...arr]
  if (index < 0 || index >= next.length) return next
  const target = direction === 'up' ? index - 1 : index + 1
  if (target < 0 || target >= next.length) return next
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}
