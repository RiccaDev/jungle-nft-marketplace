type SessionRejectedListener = () => void

const sessionRejectedListeners = new Set<SessionRejectedListener>()

export function onSessionRejected(listener: SessionRejectedListener) {
  sessionRejectedListeners.add(listener)
  return () => {
    sessionRejectedListeners.delete(listener)
  }
}

export function notifySessionRejected() {
  for (const listener of sessionRejectedListeners) listener()
}
