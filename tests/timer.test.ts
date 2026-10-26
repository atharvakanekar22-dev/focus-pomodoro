import assert from 'node:assert/strict'
import test from 'node:test'
import { formatTime, nextModeAfterCompletion, readTodaySessions, resolveCompletion, saveTodaySessions, todayKey } from '../src/timer.ts'

function memoryStorage(): Storage {
  const values = new Map<string, string>()
  return {
    get length() { return values.size },
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    key: (index: number) => [...values.keys()][index] ?? null,
    removeItem: (key: string) => { values.delete(key) },
    setItem: (key: string, value: string) => { values.set(key, String(value)) },
  }
}

test('a completed focus session selects short or long break at the four-session cadence', () => {
  assert.equal(nextModeAfterCompletion('focus', 1), 'shortBreak')
  assert.equal(nextModeAfterCompletion('focus', 3), 'shortBreak')
  assert.equal(nextModeAfterCompletion('focus', 4), 'longBreak')
  assert.equal(nextModeAfterCompletion('focus', 8), 'longBreak')
})

test('finishing either break returns to focus without changing the focus count', () => {
  assert.deepEqual(resolveCompletion('shortBreak', 4), { completedFocusSessions: 4, nextMode: 'focus' })
  assert.deepEqual(resolveCompletion('longBreak', 4), { completedFocusSessions: 4, nextMode: 'focus' })
})

test('only a completed focus timer increments the completed-session count', () => {
  assert.deepEqual(resolveCompletion('focus', 3), { completedFocusSessions: 4, nextMode: 'longBreak' })
  assert.deepEqual(resolveCompletion('focus', 4), { completedFocusSessions: 5, nextMode: 'shortBreak' })
})

test('daily session storage resets logically on the next local calendar day', () => {
  const storage = memoryStorage()
  const firstDay = new Date(2026, 9, 26, 23, 59)
  const nextDay = new Date(2026, 9, 27, 0, 0)
  saveTodaySessions(storage, 4, firstDay)
  assert.equal(readTodaySessions(storage, firstDay), 4)
  assert.equal(readTodaySessions(storage, nextDay), 0)
  assert.equal(todayKey(nextDay), '2026-10-27')
})

test('countdown formatting clamps negative values and pads seconds', () => {
  assert.equal(formatTime(0), '00:00')
  assert.equal(formatTime(65), '01:05')
  assert.equal(formatTime(-1), '00:00')
})
