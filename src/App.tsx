import { useEffect, useState } from 'react'
import { formatTime, MODE_LABELS, type TimerMode } from './timer'
import { usePomodoro } from './usePomodoro'

const modes: TimerMode[] = ['focus', 'shortBreak', 'longBreak']

function App() {
  const timer = usePomodoro()
  const [showIntro, setShowIntro] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [draft, setDraft] = useState(timer.preferences)
  const [notificationMessage, setNotificationMessage] = useState('')

  useEffect(() => {
    const introTimer = window.setTimeout(() => setShowIntro(false), 2400)
    return () => window.clearTimeout(introTimer)
  }, [])

  useEffect(() => {
    if (settingsOpen) setDraft(timer.preferences)
  }, [settingsOpen, timer.preferences])

  useEffect(() => {
    if (!settingsOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSettingsOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [settingsOpen])

  const requestNotifications = async () => {
    if (!('Notification' in window)) {
      setNotificationMessage('Notifications are not available in this browser.')
      return
    }
    try {
      const permission = await Notification.requestPermission()
      setNotificationMessage(permission === 'granted' ? 'Notifications are on.' : 'Notifications are turned off in browser settings.')
    } catch {
      setNotificationMessage('Could not enable notifications in this browser.')
    }
  }

  const handleDuration = (mode: TimerMode, value: string) => {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) setDraft((current) => ({ ...current, durations: { ...current.durations, [mode]: parsed } }))
  }

  const circumference = 2 * Math.PI * 142
  const offset = circumference * (1 - timer.progress)

  return (
    <main className="app-shell">
      {showIntro && (
        <div className="intro-screen" role="status" aria-label="Focus is loading">
          <div className="intro-glow" aria-hidden="true" />
          <div className="intro-message" aria-hidden="true">
            <span>trust</span>
            <span className="intro-center-word"><span>the</span></span>
            <span>process</span>
          </div>
        </div>
      )}
      <div className="device-shell">
        <header className="topbar">
          <a className="device-brand" href="/" aria-label="Refresh Focus" title="Refresh Focus"><span className="sun-mark" aria-hidden="true">✳</span>Focus</a>
          <button className="icon-button settings-trigger menu-button" onClick={() => setSettingsOpen(true)} aria-label="Open timer settings" title="Settings">
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
        </header>

        <section className="timer-panel" id="top" aria-labelledby="timer-heading">
          <h1 className="visually-hidden" id="timer-heading">Focus timer</h1>
          <div className="mode-tabs" role="group" aria-label="Timer mode">
            {modes.map((mode) => (
              <button key={mode} type="button" aria-pressed={timer.mode === mode} className={`mode-tab ${timer.mode === mode ? 'selected' : ''}`} onClick={() => timer.selectMode(mode)}>
                {MODE_LABELS[mode]}
              </button>
            ))}
          </div>

          <div className={`clock ${timer.mode}`} aria-label={`${MODE_LABELS[timer.mode]}, ${formatTime(timer.remainingSeconds)} remaining`}>
            <div className="clock-ticks" aria-hidden="true">{Array.from({ length: 24 }, (_, index) => <i key={index} className={index < Math.ceil(timer.progress * 12) ? 'active' : ''} style={{ transform: `rotate(${index * 15}deg)` }} />)}</div>
            <svg className="progress-ring" viewBox="0 0 320 320" aria-hidden="true">
              <circle className="progress-track" cx="160" cy="160" r="142" />
              <circle className="progress-value" cx="160" cy="160" r="142" strokeDasharray={circumference} strokeDashoffset={offset} />
            </svg>
            <div className="clock-content">
              <span className="clock-caption">Remaining</span>
              <span className="time-digits" aria-live="off">{formatTime(timer.remainingSeconds)}</span>
              <span className="clock-unit">{MODE_LABELS[timer.mode]}</span>
            </div>
          </div>
          <div className="timer-actions">
            <button className="secondary-button break-button" onClick={timer.skip}>Break</button>
            <button className="primary-button clock-button" onClick={timer.status === 'running' ? timer.pause : timer.start}>
              {timer.status === 'running' ? 'Pause' : timer.status === 'paused' ? 'Resume' : 'Start focus'}
            </button>
          </div>
          <div className="session-count" aria-live="polite">
            <span className="session-dots" aria-hidden="true">{[0, 1, 2, 3].map((n) => <i key={n} className={n < timer.completedSessions % 4 ? 'filled' : ''} />)}</span>
            <span><strong>{timer.completedSessions}</strong> sessions today</span>
          </div>
          <p className="visually-hidden" role="status">{timer.announcement}</p>
        </section>
        <footer className="footer-note">One thing at a time.</footer>
      </div>

      {settingsOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSettingsOpen(false) }}>
          <section className="settings-panel" role="dialog" aria-modal="true" aria-labelledby="settings-title">
            <div className="settings-heading">
              <div><p className="eyebrow">Make it yours</p><h1 id="settings-title">Timer settings</h1></div>
              <button className="icon-button close-button" aria-label="Close settings" onClick={() => setSettingsOpen(false)}><span aria-hidden="true">×</span></button>
            </div>
            <div className="duration-fields">
              {modes.map((mode) => (
                <label className="duration-field" key={mode}>
                  <span>{MODE_LABELS[mode]}</span>
                  <span className="number-input"><input type="number" min="1" max="90" value={draft.durations[mode]} onChange={(event) => handleDuration(mode, event.target.value)} aria-label={`${MODE_LABELS[mode]} duration in minutes`} /><small>min</small></span>
                </label>
              ))}
            </div>
            <label className="toggle-row"><span><strong>Completion sound</strong><small>A soft chime when a timer ends</small></span><input type="checkbox" checked={draft.sound} onChange={(event) => setDraft((current) => ({ ...current, sound: event.target.checked }))} /></label>
            <div className="notification-row">
              <span><strong>Browser notifications</strong><small>{notificationMessage || 'Get an alert when a session ends'}</small></span>
              <button className="text-button" onClick={() => void requestNotifications()}>{'Notification' in window && Notification.permission === 'granted' ? 'Enabled' : 'Enable'}</button>
            </div>
            <p className="settings-hint">Durations can be set from 1 to 90 minutes.</p>
            <div className="settings-actions">
              <button className="secondary-button" onClick={() => setSettingsOpen(false)}>Cancel</button>
              <button className="primary-button save-button" onClick={() => { timer.updatePreferences(draft); setSettingsOpen(false) }}>Save changes</button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

export default App
