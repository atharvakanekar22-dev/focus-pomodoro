import { useCallback, useEffect, useRef, useState } from 'react'
import { DEFAULT_DURATIONS, readTodaySessions, resolveCompletion, saveTodaySessions, type TimerMode } from './timer'

type Preferences = { durations: Record<TimerMode, number>; sound: boolean }
type TimerStatus = 'idle' | 'running' | 'paused'
const PREFS_KEY = 'focus.preferences'

function getStorage(): Storage | undefined {
  try { return window.localStorage } catch { return undefined }
}

function readPreferences(): Preferences {
  const defaults = { durations: DEFAULT_DURATIONS, sound: true }
  try {
    const stored = JSON.parse(getStorage()?.getItem(PREFS_KEY) ?? 'null') as Partial<Preferences> | null
    if (!stored) return defaults
    const durations = { ...DEFAULT_DURATIONS }
    for (const key of Object.keys(durations) as TimerMode[]) {
      const value = stored.durations?.[key]
      if (typeof value === 'number' && Number.isFinite(value)) durations[key] = Math.min(90, Math.max(1, Math.round(value)))
    }
    return { durations, sound: typeof stored.sound === 'boolean' ? stored.sound : true }
  } catch { return defaults }
}

function playCompletionSound(): void {
  try {
    const AudioContextClass = window.AudioContext
    if (!AudioContextClass) return
    const context = new AudioContextClass()
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = 660
    gain.gain.setValueAtTime(0.0001, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.55)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start()
    oscillator.stop(context.currentTime + 0.58)
    oscillator.onended = () => { void context.close().catch(() => undefined) }
  } catch {
    // Audio may be blocked by browser settings; the on-screen alert still appears.
  }
}

export function usePomodoro() {
  const [preferences, setPreferences] = useState(readPreferences)
  const [mode, setModeState] = useState<TimerMode>('focus')
  const [status, setStatus] = useState<TimerStatus>('idle')
  const [remainingSeconds, setRemainingSeconds] = useState(() => readPreferences().durations.focus * 60)
  const [completedSessions, setCompletedSessions] = useState(() => readTodaySessions(getStorage()))
  const [announcement, setAnnouncement] = useState('')
  const deadlineRef = useRef<number | null>(null)
  const modeRef = useRef(mode)
  const statusRef = useRef(status)
  const sessionsRef = useRef(completedSessions)
  const preferencesRef = useRef(preferences)
  const endingRef = useRef(false)

  useEffect(() => { preferencesRef.current = preferences }, [preferences])
  useEffect(() => { modeRef.current = mode }, [mode])
  useEffect(() => { statusRef.current = status }, [status])
  useEffect(() => { sessionsRef.current = completedSessions }, [completedSessions])

  const setRunning = useCallback((running: boolean) => {
    const nextStatus = running ? 'running' : 'idle'
    statusRef.current = nextStatus
    setStatus(nextStatus)
  }, [])

  const setMode = useCallback((nextMode: TimerMode, message = '') => {
    modeRef.current = nextMode
    setModeState(nextMode)
    setRunning(false)
    deadlineRef.current = null
    endingRef.current = false
    setRemainingSeconds(preferencesRef.current.durations[nextMode] * 60)
    setAnnouncement(message)
  }, [setRunning])

  const finishSession = useCallback(() => {
    if (endingRef.current || statusRef.current !== 'running') return
    endingRef.current = true
    const finishedMode = modeRef.current
    const completion = resolveCompletion(finishedMode, sessionsRef.current)
    const count = completion.completedFocusSessions
    if (count !== sessionsRef.current) {
      sessionsRef.current = count
      setCompletedSessions(count)
      saveTodaySessions(getStorage(), count)
    }
    if (preferencesRef.current.sound) playCompletionSound()
    if ('Notification' in window && Notification.permission === 'granted') {
      try { new Notification(`${finishedMode === 'focus' ? 'Focus session' : 'Break'} complete`, { body: 'Your next timer is ready.' }) } catch { /* Notifications may be unavailable in this context. */ }
    }
    const nextMode = completion.nextMode
    const message = finishedMode === 'focus'
      ? `Focus session complete. ${nextMode === 'longBreak' ? 'Time for a long break.' : 'Time for a short break.'}`
      : 'Break complete. Ready to focus again?'
    setMode(nextMode, message)
  }, [setMode])

  const start = useCallback(() => {
    if (statusRef.current === 'running') return
    const currentMode = modeRef.current
    const remaining = statusRef.current === 'paused' ? remainingSeconds : preferencesRef.current.durations[currentMode] * 60
    const deadline = Date.now() + remaining * 1000
    deadlineRef.current = deadline
    endingRef.current = false
    statusRef.current = 'running'
    setStatus('running')
    setAnnouncement('')
  }, [remainingSeconds])

  const pause = useCallback(() => {
    if (statusRef.current !== 'running') return
    const left = Math.max(0, Math.ceil(((deadlineRef.current ?? Date.now()) - Date.now()) / 1000))
    deadlineRef.current = null
    setRemainingSeconds(left)
    statusRef.current = 'paused'
    setStatus('paused')
  }, [])

  const reset = useCallback(() => {
    deadlineRef.current = null
    endingRef.current = false
    setRunning(false)
    setRemainingSeconds(preferencesRef.current.durations[modeRef.current] * 60)
    setAnnouncement('Timer reset.')
  }, [setRunning])

  const skip = useCallback(() => {
    const nextMode = modeRef.current === 'focus'
      ? 'shortBreak'
      : 'focus'
    setMode(nextMode, `${nextMode === 'focus' ? 'Focus' : 'Short break'} ready.`)
  }, [setMode])

  const selectMode = useCallback((nextMode: TimerMode) => {
    if (nextMode !== modeRef.current || statusRef.current !== 'idle') setMode(nextMode)
  }, [setMode])

  const updatePreferences = useCallback((next: Preferences) => {
    const normalized = {
      sound: next.sound,
      durations: {
        focus: Math.min(90, Math.max(1, Math.round(next.durations.focus))),
        shortBreak: Math.min(90, Math.max(1, Math.round(next.durations.shortBreak))),
        longBreak: Math.min(90, Math.max(1, Math.round(next.durations.longBreak))),
      },
    }
    preferencesRef.current = normalized
    setPreferences(normalized)
    try { getStorage()?.setItem(PREFS_KEY, JSON.stringify(normalized)) } catch { /* Preferences remain usable for this visit. */ }
    if (statusRef.current !== 'running') setRemainingSeconds(normalized.durations[modeRef.current] * 60)
  }, [])

  useEffect(() => {
    if (status !== 'running') return
    const update = () => {
      const deadline = deadlineRef.current
      if (deadline === null) return
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
      setRemainingSeconds(left)
      if (left === 0) finishSession()
    }
    update()
    const interval = window.setInterval(update, 250)
    const onVisibilityChange = () => { if (!document.hidden) update() }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [status, finishSession])

  useEffect(() => {
    const updateTitle = () => {
      document.title = status === 'running'
        ? `${Math.floor(remainingSeconds / 60).toString().padStart(2, '0')}:${(remainingSeconds % 60).toString().padStart(2, '0')} · ${mode === 'focus' ? 'Focus' : 'Break'}`
        : 'Focus — Pomodoro Timer'
    }
    updateTitle()
    return () => { document.title = 'Focus — Pomodoro Timer' }
  }, [mode, remainingSeconds, status])

  useEffect(() => {
    const checkDay = () => {
      const count = readTodaySessions(getStorage())
      if (count !== sessionsRef.current) {
        sessionsRef.current = count
        setCompletedSessions(count)
      }
    }
    const interval = window.setInterval(checkDay, 30_000)
    document.addEventListener('visibilitychange', checkDay)
    return () => { window.clearInterval(interval); document.removeEventListener('visibilitychange', checkDay) }
  }, [])

  const durationSeconds = preferences.durations[mode] * 60
  const progress = Math.min(1, Math.max(0, 1 - remainingSeconds / durationSeconds))
  return { mode, status, remainingSeconds, durationSeconds, progress, completedSessions, preferences, announcement, start, pause, reset, skip, selectMode, updatePreferences }
}
