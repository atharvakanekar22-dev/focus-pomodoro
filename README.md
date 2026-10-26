# Focus

Focus is a calm, browser-based Pomodoro timer built with React, TypeScript, and Vite. It provides focused work sessions, short and long breaks, visual progress feedback, optional completion sounds, browser notifications, and a responsive web-app interface.

The timer is calculated from timestamps rather than relying only on interval counts. This keeps the countdown accurate when the browser throttles a background tab or when the page becomes temporarily hidden.

## Features

- Focus, short-break, and long-break timer modes.
- Default Pomodoro durations:
  - Focus: **50 minutes**
  - Short break: **5 minutes**
  - Long break: **15 minutes**
- Four-session cadence:
  - Completing a focus session increments today's focus-session count.
  - The fourth completed focus session selects a long break.
  - Other completed focus sessions select a short break.
  - Completing either type of break returns to Focus mode.
- Start, pause, resume, reset, skip, and mode-selection controls.
- Radial timer display with progress ticks.
- Startup intro animation with a “trust the process” message.
- Optional completion sound.
- Optional browser notifications when a timer ends.
- Settings dialog for changing each duration from 1 to 90 minutes.
- Daily completed-session tracking.
- Local persistence for preferences and today's session count.
- Responsive layout for desktop and smaller screens.
- Keyboard-accessible controls and visible focus states.
- Reduced-motion support for users who prefer less animation.

## Getting started

### Requirements

- Node.js with npm.
- A modern browser with JavaScript enabled.

### Install dependencies

```sh
npm install
```

### Start the development server

```sh
npm run dev
```

Vite will print the local development URL in the terminal, usually:

```text
http://localhost:5173
```

### Create a production build

```sh
npm run build
```

The production files are generated in the `dist/` directory.

### Preview the production build

```sh
npm run preview
```

## Using the timer

1. Select **Focus**, **Short break**, or **Long break** from the mode tabs.
2. Select **Start focus** to begin the current timer.
3. Use **Pause** to pause a running timer.
4. Use **Resume** to continue a paused timer.
5. Use **Break** to move from Focus to a short break, or back to Focus from a break.
6. Open the menu button to access settings.
7. Select the centered **Focus** title to refresh the application.

Selecting a timer mode loads that mode's configured duration. Changing modes while a timer is running or paused resets the timer to the selected mode's full duration.

## Settings

The settings dialog allows users to:

- Change the Focus duration.
- Change the Short break duration.
- Change the Long break duration.
- Enable or disable the completion sound.
- Request browser notification permission.

Duration values are normalized to whole minutes between 1 and 90. Preferences are applied when **Save changes** is selected. Canceling the dialog discards the current draft changes.

## Notifications and sound

Completion sound is enabled by default. The sound is generated in the browser using the Web Audio API and may be restricted by browser autoplay policies.

Browser notifications are opt-in. The application requests permission only after the user selects **Enable** in settings. Notifications depend on browser support and the permission granted for the current site.

## Local storage

Focus uses browser `localStorage` when it is available:

| Key | Purpose |
| --- | --- |
| `focus.preferences` | Saved durations and completion-sound preference |
| `focus.sessions` | Today's local date and completed focus-session count |

The completed-session count is associated with the browser's local calendar date. When a new local day begins, the displayed count resets to zero automatically.

If storage is unavailable, the application continues to work for the current visit using in-memory state.

## Project structure

```text
Focus/
├── index.html             # HTML entry point and document metadata
├── package.json           # Scripts and dependencies
├── tsconfig.json          # TypeScript configuration
├── vite.config.ts         # Vite configuration
├── src/
│   ├── App.tsx            # Main interface and settings dialog
│   ├── main.tsx           # React application entry point
│   ├── styles.css         # Layout, responsive styles, and animations
│   ├── timer.ts           # Timer modes, durations, formatting, and storage helpers
│   └── usePomodoro.ts     # Timer state, countdown lifecycle, sound, and notifications
└── tests/
    └── timer.test.ts      # Timer logic and storage tests
```

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Run TypeScript checks and create a production build |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run the Node.js test suite |

## Validation

Run the test suite:

```sh
npm test
```

The tests cover:

- Focus-to-break cadence.
- Long-break selection after four focus sessions.
- Break-to-focus transitions.
- Completed-session counting.
- Daily session rollover.
- Countdown formatting and clamping.

Run the production validation:

```sh
npm run build
```

This runs the TypeScript project build before bundling the application with Vite.

## Technology

- React 19
- TypeScript 5
- Vite 6
- Node.js built-in test runner
- Web Audio API for the optional completion sound
- Browser Notification API for optional timer notifications

## License

This project does not currently declare a license. Add a license file and update this section before distributing the project publicly.
