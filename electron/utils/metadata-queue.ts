let queue: Promise<void> = Promise.resolve()

export function enqueueMetadataWrite(fn: () => void | Promise<void>): Promise<void> {
  queue = queue.then(fn)
  return queue
}
