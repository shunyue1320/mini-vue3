// 事件缓存队列
let queue = []
let isFlushing = false
const resolvePromise = Promise.resolve()

export function queueJob(job) {
  if (!queue.includes(job)) {
    queue.push(job)
  }
  if (!isFlushing) {
    // 批处理逻辑
    isFlushing = true
    resolvePromise.then(() => {
      isFlushing = false
      let copy = queue.slice(0)
      for (let i = 0; i < copy.length; i++) {
        let job = copy[i]
        job()
      }
      queue.length = 0
      copy.length = 0
    })
  }
}
