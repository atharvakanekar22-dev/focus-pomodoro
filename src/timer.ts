export type TimerMode = 'focus' | 'shortBreak' | 'longBreak'

export const DEFAULT_DURATIONS: Record<TimerMode, number> = {
  focus: 50,
  shortBreak: 5,
  longBreak: 15,
}

export const MODE_LABELS: Record<TimerMode, string> = {
  focus: 'Focus',
  shortBreak: 'Short break',
  longBreak: 'Long break',
}

export function nextModeAfterCompletion(mode: TimerMode, completedFocusSessions: number): TimerMode {
  if (mode === 'focus') return completedFocusSessions % 4 === 0 ? 'longBreak' : 'shortBreak'
  return 'focus'
}

export function resolveCompletion(mode: TimerMode, completedFocusSessions: number): { completedFocusSessions: number; nextMode: TimerMode } {
  const count = mode === 'focus' ? completedFocusSessions + 1 : completedFocusSessions
  return { completedFocusSessions: count, nextMode: nextModeAfterCompletion(mode, count) }
}

export function formatTime(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function todayKey(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function readTodaySessions(storage: Storage | undefined, date = new Date()): number {
  if (!storage) return 0
  try {
    const stored = JSON.parse(storage.getItem('focus.sessions') ?? 'null') as { date?: string; count?: number } | null
    return stored?.date === todayKey(date) && Number.isFinite(stored.count) ? Math.max(0, Math.floor(stored.count!)) : 0
  } catch {
    return 0
  }
}

export function saveTodaySessions(storage: Storage | undefined, count: number, date = new Date()): void {
  try {
    storage?.setItem('focus.sessions', JSON.stringify({ date: todayKey(date), count }))
  } catch {
    // Storage can be unavailable in private browsing or when the user has disabled it.
  }
}
