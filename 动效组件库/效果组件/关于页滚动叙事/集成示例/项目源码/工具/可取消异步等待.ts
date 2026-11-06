function abortError(): DOMException {
  return new DOMException('Operation cancelled', 'AbortError')
}

/** Cancel the wait, while still consuming a late result or rejection from the original work. */
export function abortable<T>(work: PromiseLike<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const abort = () => {
      signal.removeEventListener('abort', abort)
      reject(abortError())
    }
    Promise.resolve(work).then(
      (value) => {
        signal.removeEventListener('abort', abort)
        resolve(value)
      },
      (error) => {
        signal.removeEventListener('abort', abort)
        reject(error)
      },
    )
    if (signal.aborted) abort()
    else signal.addEventListener('abort', abort, { once: true })
  })
}

/** A cancelled frame neither runs its caller nor retains an abort listener. */
export function nextFrame(signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(abortError())
      return
    }
    const abort = () => {
      cancelAnimationFrame(frame)
      signal.removeEventListener('abort', abort)
      reject(abortError())
    }
    const frame = requestAnimationFrame(() => {
      signal.removeEventListener('abort', abort)
      resolve()
    })
    signal.addEventListener('abort', abort, { once: true })
  })
}
