# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**nowtask（ナウタスク）** is a task management app that visualizes available free time by subtracting from 24 hours.

- **Target Release**: December 2025
- **Tech Stack**: Vanilla HTML/CSS/JavaScript only (no external libraries)
- **Database**: localStorage (Phase 1) → Firebase (Phase 2)
- **Target Device**: Mobile-first (375px width), but works on PC too
- **Developer**: TOMI (beginner programmer)

## Critical Rules

### Absolutely Forbidden
1. ❌ **NO external libraries** (no jQuery, React, Vue, etc.)
2. ❌ **NO features not in specification docs** (proposals OK, but must ask first)
3. ❌ **NO colors except monochrome** (white/black/gray) - ONLY exception: priority colors (high=red, medium=yellow, low=blue)
4. ❌ **NO emojis in UI** (use SVG icons instead)

### Must Always Do
1. ✅ **Read specification docs BEFORE implementing**:
   - `docs/nowtask_confirmed_specifications_v1.1.md` - All feature specifications
   - `docs/nowtask_technical_specifications_v1.1.md` - Technical guidelines
2. ✅ **Ask before implementing** if unclear about specifications
3. ✅ **Keep code simple** (TOMI is a beginner)
4. ✅ **Propose file splits** when files exceed 800 lines (must split at 1000 lines)
5. ✅ **Use Japanese comments** (but keep minimal - code should be self-documenting)

## Architecture

### Data Flow
```
User Input → Task Manager → Storage Layer → localStorage
                ↓
            24h Gauge Calculator
                ↓
            UI Renderer
```

### File Structure (flexible, can be modified)
```
nowtask/
├── index.html          # Main app structure
├── css/
│   ├── base.css        # Reset CSS, common styles, color variables
│   ├── gauge.css       # 24-hour gauge (dot timeline & circular)
│   ├── task.css        # Task cards, quick input
│   ├── calendar.css    # Calendar display
│   └── stats.css       # Statistics/analysis
└── js/
    ├── main.js         # App initialization, screen switching
    ├── task.js         # Task CRUD, subtasks, drag-and-drop
    ├── gauge.js        # 24h gauge rendering, free time calculation
    ├── storage.js      # localStorage (will be replaced with Firebase later)
    ├── calendar.js     # Calendar display and operations
    ├── routine.js      # Routine templates, auto-task generation
    ├── shift.js        # Shift registration
    └── stats.js        # Statistics, tag analysis, graphs
```

**File split rule**: Ideal 500-800 lines/file, max 1000 lines. Split by feature when exceeded.

### Data Structures

**Task Object** (stored in localStorage as `nowtask_tasks`):
```javascript
{
  id: "task_20251024_001",
  name: "タスク名",
  startTime: "2025-10-24T09:00",  // optional
  endTime: "2025-10-24T12:00",    // optional
  duration: 180,                   // minutes, optional
  priority: "high|medium|low",     // optional
  tags: ["仕事", "重要"],          // optional
  completed: false,
  completedAt: null,
  createdAt: "2025-10-24T08:00",
  updatedAt: "2025-10-24T08:30",
  subtasks: [...]                  // max 5 levels deep
}
```

**Time Setting Logic**: 3 modes allowed:
1. startTime + endTime → auto-calculate duration
2. startTime + duration → auto-calculate endTime
3. duration only → no start/end time

**Free Time Calculation**:
```javascript
totalTime = 24 hours
elapsedTime = current time
scheduledTime = sum of all task durations
freeTime = totalTime - elapsedTime - scheduledTime
```

## Core Features

### Phase 1 Priority (Must implement first)
1. Task add/delete/complete
2. 24-hour gauge (dot type)
3. Free time calculation & display
4. Quick input (fixed at bottom)
5. localStorage save/load

### 24-Hour Gauge (2 patterns adopted)
- **Pattern A: Dot Timeline (V1 standard)** - for main screen
  - 24 dots in a row, each = 1 hour
  - Current time = large black dot
  - Scheduled = dark gray dot
  - Elapsed = light gray dot
  - Free = outline-only dot

- **Pattern B: Circular Progress Bar (V3)** - for stats screen
  - 24 hours as a clock circle
  - Center shows: current time + elapsed + remaining
  - Monochrome colors only

### Subtask System
- Max 5 levels deep
- **Main task with time set**: Subtask total cannot exceed main task time (warn if exceeded)
- **Main task without time**: Subtask total becomes main task time
- **Main task free time gauge**: Display in task card showing remaining time after subtasks

### UI Design Principles
- **Monochrome** (white/black/gray) except priority colors
- **Time labels OUTSIDE task cards** (timeline style on left side)
- **Quick input fixed at bottom**
- **Completed tasks**: Strikethrough, collapsible ("Completed (N items)")
- **Mobile-first**: 375px width, one-handed operation

## Development Workflow

### Before Implementing
1. Read relevant sections in specification docs
2. If multiple approaches exist, ask TOMI which to choose
3. Present implementation plan before coding

### When to Ask Questions
- Specification is unclear or missing
- Multiple implementation methods, unsure which is best
- Performance vs simplicity tradeoff
- File should be split
- Any ambiguity about desired behavior

### Question Format Example
```
「タスクの並び替えの実装方法について質問です。

方法A: ドラッグ中にリアルタイムで並び替え（滑らか、実装複雑）
方法B: ドロップした時に並び替え（シンプル、実装簡単）

どちらが良いですか？」
```

### When Proposing File Splits
```
task.jsが1200行になりました。
以下のように分割することを提案します:
- task-add.js（追加機能: 400行）
- task-edit.js（編集機能: 400行）
- task-subtask.js（サブタスク管理: 400行）

この分割でよろしいですか？
```

## Coding Conventions

### Naming
- Variables: camelCase (English) - `taskList`, `currentDate`
- Functions: verb-first - `addTask()`, `deleteTask()`, `updateTask()`
- Constants: UPPER_SNAKE_CASE - `MAX_SUBTASK_LEVEL = 5`
- Comments: Japanese OK, but keep minimal

### Code Style
- Indent: 2 spaces
- Semicolons: always use
- Strings: single quotes preferred
- **Minimize comments** - code should be self-documenting through good variable/function names

### Error Messages
- Use Japanese for user-facing messages
- Make debugging easy with console.log
- TOMI is a beginner, so keep error messages clear

## localStorage Keys
```javascript
'nowtask_tasks'      // All tasks
'nowtask_routines'   // Routine templates
'nowtask_shifts'     // Shift schedules
'nowtask_settings'   // User settings
```

## Future Migration (Phase 2)
- Replace `storage.js` only when migrating to Firebase
- Other files should NOT need changes (design for this)
- Offline-first: must work without network
- Login is optional, works without account

## Testing
- Test in Chrome (PC) at 375px width
- Verify localStorage persistence (reload page)
- Test on actual Android device when available
- Check: add/delete/complete tasks, gauge display, data persistence
