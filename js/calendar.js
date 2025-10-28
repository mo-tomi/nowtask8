console.log('calendar.js が読み込まれました');

const Calendar = {
  currentDate: new Date(),
  selectedDate: null,

  init() {
    console.log('カレンダーを初期化しました');
    console.log('ShiftManager exists at init?', typeof ShiftManager !== 'undefined');
    this.renderCalendar();
    this.setupEventListeners();
  },

  setupEventListeners() {
    const prevBtn = document.getElementById('prevMonthBtn');
    const nextBtn = document.getElementById('nextMonthBtn');
    const closeDayBtn = document.getElementById('closeDayBtn');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.changeMonth(-1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.changeMonth(1);
      });
    }

    if (closeDayBtn) {
      closeDayBtn.addEventListener('click', () => {
        this.closeSelectedDay();
      });
    }
  },

  changeMonth(offset) {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    this.currentDate = new Date(year, month + offset, 1);
    this.renderCalendar();
    console.log('月を変更しました:', this.formatYearMonth(this.currentDate));
  },

  renderCalendar() {
    const container = document.getElementById('calendarContainer');
    if (!container) return;

    const html = `
      <div class="month-nav">
        <button class="nav-btn" id="prevMonthBtn">◀</button>
        <div class="month-title">${this.formatYearMonth(this.currentDate)}</div>
        <button class="nav-btn" id="nextMonthBtn">▶</button>
      </div>
      <div class="weekdays">
        <div class="weekday sunday">日</div>
        <div class="weekday">月</div>
        <div class="weekday">火</div>
        <div class="weekday">水</div>
        <div class="weekday">木</div>
        <div class="weekday">金</div>
        <div class="weekday saturday">土</div>
      </div>
      <div class="calendar-grid" id="calendarGrid">
        ${this.renderDays()}
      </div>
      <div class="selected-day-tasks" id="selectedDayTasks">
        <div class="selected-day-header">
          <div class="selected-day-title" id="selectedDayTitle"></div>
          <button class="close-day-btn" id="closeDayBtn">×</button>
        </div>
        <div class="selected-day-task-list" id="selectedDayTaskList"></div>
      </div>
    `;

    container.innerHTML = html;
    this.setupEventListeners();
    this.setupDayCellListeners();
  },

  renderDays() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prevLastDay = new Date(year, month, 0);

    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const daysInPrevMonth = prevLastDay.getDate();

    let html = '';
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

    // 前月の日付
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const date = new Date(year, month - 1, day);
      html += this.renderDayCell(date, day, 'other-month');
    }

    // 当月の日付
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay();
      let classes = '';

      if (dayOfWeek === 0) classes += ' sunday';
      if (dayOfWeek === 6) classes += ' saturday';
      if (isCurrentMonth && day === today.getDate()) classes += ' today';

      html += this.renderDayCell(date, day, classes);
    }

    // 翌月の日付（6週分埋める）
    const totalCells = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7;
    const remainingCells = totalCells - (firstDayOfWeek + daysInMonth);
    for (let day = 1; day <= remainingCells; day++) {
      const date = new Date(year, month + 1, day);
      html += this.renderDayCell(date, day, 'other-month');
    }

    return html;
  },

  renderDayCell(date, day, classes = '') {
    const taskCount = this.getTaskCountForDate(date);
    const hasTasksClass = taskCount > 0 ? 'has-tasks' : '';
    const dateStr = this.formatDateKey(date);

    let shifts = [];
    let hasShiftClass = '';
    let isShiftMode = false;
    if (typeof ShiftManager !== 'undefined') {
      isShiftMode = ShiftManager.shiftMode;
      shifts = ShiftManager.getShiftForDate(date);
      if (shifts.length > 0) {
        hasShiftClass = 'has-shift';
      }
    }

    // シフトモード中はシフト名のみ表示、それ以外はタスク数を表示
    let displayContent = '';
    if (isShiftMode) {
      // シフトモード：複数シフトを表示（最大2個）
      displayContent = shifts.length > 0
        ? shifts.map(shift => `<div class="shift-label">${this.escapeHtml(shift.name)}</div>`).join('')
        : '';
    } else {
      // 通常モード：シフトがある場合はシフト名のみ、ない場合はタスク数を表示
      if (shifts.length > 0) {
        // シフトがある日はシフト名のみ表示
        displayContent = shifts.map(shift => `<div class="shift-label">${this.escapeHtml(shift.name)}</div>`).join('');
      } else {
        // シフトがない日はタスク数を表示
        displayContent = `
          <div class="day-tasks">
            ${taskCount > 0 ? `<div class="task-count">${taskCount}</div>` : ''}
          </div>
        `;
      }
    }

    return `
      <div class="day-cell ${classes} ${hasTasksClass} ${hasShiftClass}" data-date="${dateStr}">
        <div class="day-number">${day}</div>
        ${displayContent}
      </div>
    `;
  },

  setupDayCellListeners() {
    const cells = document.querySelectorAll('.day-cell');
    cells.forEach(cell => {
      cell.addEventListener('click', () => {
        const dateStr = cell.getAttribute('data-date');
        if (dateStr) {
          this.selectDay(dateStr);
        }
      });
    });
  },

  selectDay(dateOrStr) {
    const date = dateOrStr instanceof Date ? dateOrStr : new Date(dateOrStr);
    const dateStr = this.formatDateKey(date);
    this.selectedDate = date;

    console.log('Calendar.selectDay() called:', date);
    console.log('ShiftManager exists?', typeof ShiftManager !== 'undefined');
    console.log('ShiftManager.shiftMode?', ShiftManager?.shiftMode);

    // 選択状態を更新
    const cells = document.querySelectorAll('.day-cell');
    cells.forEach(cell => {
      if (cell.getAttribute('data-date') === dateStr) {
        cell.classList.add('selected');
      } else {
        cell.classList.remove('selected');
      }
    });

    // シフトモード時はShiftManagerに通知
    if (typeof ShiftManager !== 'undefined' && ShiftManager.shiftMode) {
      console.log('Calling ShiftManager.selectDate()...');
      ShiftManager.selectDate(date);
    } else {
      // 選択された日のタスク一覧を表示
      this.showSelectedDayTasks(date);
    }

    console.log('日付を選択しました:', dateStr);
  },

  closeSelectedDay() {
    this.selectedDate = null;

    // 選択状態を解除
    const cells = document.querySelectorAll('.day-cell');
    cells.forEach(cell => cell.classList.remove('selected'));

    // タスク一覧を非表示
    const selectedDayTasks = document.getElementById('selectedDayTasks');
    if (selectedDayTasks) {
      selectedDayTasks.classList.remove('visible');
    }

    const container = document.getElementById('calendarContainer');
    if (container) {
      container.classList.remove('with-selected-day');
    }

    console.log('日付選択を解除しました');
  },

  showSelectedDayTasks(date) {
    const selectedDayTasks = document.getElementById('selectedDayTasks');
    const selectedDayTitle = document.getElementById('selectedDayTitle');
    const selectedDayTaskList = document.getElementById('selectedDayTaskList');
    const container = document.getElementById('calendarContainer');

    if (!selectedDayTasks || !selectedDayTitle || !selectedDayTaskList) return;

    // タイトルを更新
    selectedDayTitle.textContent = this.formatDateWithDay(date);

    // その日のタスクを取得
    const tasks = this.getTasksForDate(date);

    // パターン適用ボタンを追加
    let patternButtonHtml = '';
    if (typeof MultiDayPatternManager !== 'undefined') {
      patternButtonHtml = `
        <button class="apply-pattern-btn" id="applyPatternBtn" title="複数日パターンを適用">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          パターン適用
        </button>
      `;
    }

    // タスク一覧を表示
    if (tasks.length > 0) {
      selectedDayTaskList.innerHTML = patternButtonHtml + tasks.map(task => this.renderTaskForDay(task)).join('');
    } else {
      selectedDayTaskList.innerHTML = patternButtonHtml + '<div class="empty-state-text">この日はタスクがありません</div>';
    }

    // 表示状態を更新
    selectedDayTasks.classList.add('visible');
    if (container) {
      container.classList.add('with-selected-day');
    }

    // イベントリスナーを設定
    this.setupTaskEventListeners();
    this.setupDragAndDrop();
    this.setupPatternButton(date);
  },

  renderTaskForDay(task) {
    const timeLabel = this.formatTaskTime(task);
    const priorityClass = task.priority ? `priority-${task.priority}` : '';

    return `
      <div class="task-card ${priorityClass}" data-task-id="${task.id}" draggable="true">
        <div class="task-card-header">
          <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
          ${task.priority ? `<span class="priority-dot ${priorityClass}"></span>` : ''}
          <span class="task-name ${task.completed ? 'completed' : ''}">${this.escapeHtml(task.name)}</span>
        </div>
        ${timeLabel ? `<div class="task-time">${timeLabel}</div>` : ''}
        <div class="task-actions">
          <button class="task-action-btn duplicate-btn" title="複製">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
        </div>
      </div>
    `;
  },

  formatTaskTime(task) {
    if (task.startTime && task.endTime) {
      const start = new Date(task.startTime);
      const end = new Date(task.endTime);
      return `${this.formatTime(start)} - ${this.formatTime(end)}`;
    } else if (task.startTime) {
      const start = new Date(task.startTime);
      return `${this.formatTime(start)}~`;
    } else if (task.duration) {
      const hours = Math.floor(task.duration / 60);
      const minutes = task.duration % 60;
      return hours > 0 ? `${hours}時間${minutes > 0 ? minutes + '分' : ''}` : `${minutes}分`;
    }
    return '';
  },

  getTasksForDate(date) {
    if (typeof TaskManager === 'undefined' || !TaskManager.tasks) return [];

    const dateStr = this.formatDateKey(date);
    return TaskManager.tasks.filter(task => {
      // startTimeがある場合はそれを使用
      if (task.startTime) {
        const taskDate = new Date(task.startTime);
        return this.formatDateKey(taskDate) === dateStr;
      }
      // startTimeがない場合はcreatedAtを使用
      if (task.createdAt) {
        const taskDate = new Date(task.createdAt);
        return this.formatDateKey(taskDate) === dateStr;
      }
      return false;
    });
  },

  getTaskCountForDate(date) {
    return this.getTasksForDate(date).length;
  },

  formatYearMonth(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return `${year}年${month}月`;
  },

  formatDateWithDay(date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
    return `${month}月${day}日（${dayOfWeek}）`;
  },

  formatDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  setupTaskEventListeners() {
    // チェックボックス
    const checkboxes = document.querySelectorAll('.selected-day-task-list .task-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        e.stopPropagation();
        const taskCard = e.target.closest('.task-card');
        const taskId = taskCard.dataset.taskId;
        if (taskId && typeof TaskManager !== 'undefined') {
          TaskManager.toggleTaskComplete(taskId);
          this.renderCalendar();
        }
      });
    });

    // 複製ボタン
    const duplicateBtns = document.querySelectorAll('.duplicate-btn');
    duplicateBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const taskCard = e.target.closest('.task-card');
        const taskId = taskCard.dataset.taskId;
        this.duplicateTask(taskId);
      });
    });
  },

  setupDragAndDrop() {
    const taskCards = document.querySelectorAll('.selected-day-task-list .task-card');
    const dayCells = document.querySelectorAll('.day-cell');

    taskCards.forEach(card => {
      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', card.dataset.taskId);
        card.classList.add('dragging');
      });

      card.addEventListener('dragend', (e) => {
        card.classList.remove('dragging');
      });
    });

    dayCells.forEach(cell => {
      cell.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        cell.classList.add('drag-over');
      });

      cell.addEventListener('dragleave', (e) => {
        cell.classList.remove('drag-over');
      });

      cell.addEventListener('drop', (e) => {
        e.preventDefault();
        cell.classList.remove('drag-over');

        const taskId = e.dataTransfer.getData('text/plain');
        const targetDateStr = cell.dataset.date;

        if (taskId && targetDateStr) {
          this.moveTask(taskId, targetDateStr);
        }
      });
    });
  },

  moveTask(taskId, targetDateStr) {
    if (typeof TaskManager === 'undefined' || !TaskManager.tasks) return;

    const task = TaskManager.tasks.find(t => t.id === taskId);
    if (!task) return;

    const targetDate = new Date(targetDateStr);

    // 時刻がある場合は日付部分のみ変更
    if (task.startTime) {
      const oldStart = new Date(task.startTime);
      const newStart = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate(),
        oldStart.getHours(),
        oldStart.getMinutes()
      );
      task.startTime = newStart.toISOString();

      if (task.endTime) {
        const oldEnd = new Date(task.endTime);
        const newEnd = new Date(
          targetDate.getFullYear(),
          targetDate.getMonth(),
          targetDate.getDate(),
          oldEnd.getHours(),
          oldEnd.getMinutes()
        );
        task.endTime = newEnd.toISOString();
      }
    } else {
      // 時刻がない場合は新しい日付で作成
      task.startTime = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate(),
        9, 0
      ).toISOString();
    }

    task.updatedAt = new Date().toISOString();

    Storage.saveTasks(TaskManager.tasks);
    this.renderCalendar();
    if (typeof Gauge !== 'undefined') Gauge.updateGauge();
    if (typeof TaskManager !== 'undefined') TaskManager.renderTasks();

    console.log('タスクを移動しました:', task.name, '→', targetDateStr);
  },

  duplicateTask(taskId) {
    if (typeof TaskManager === 'undefined' || !TaskManager.tasks) return;

    const task = TaskManager.tasks.find(t => t.id === taskId);
    if (!task) return;

    const now = new Date().toISOString();
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const newTaskId = `task_${dateStr}_${Date.now()}`;

    const newTask = {
      ...task,
      id: newTaskId,
      name: task.name + ' (コピー)',
      completed: false,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
      subtasks: task.subtasks ? JSON.parse(JSON.stringify(task.subtasks)) : []
    };

    TaskManager.tasks.push(newTask);
    Storage.saveTasks(TaskManager.tasks);

    this.renderCalendar();
    if (this.selectedDate) {
      this.showSelectedDayTasks(this.selectedDate);
    }
    if (typeof Gauge !== 'undefined') Gauge.updateGauge();
    if (typeof TaskManager !== 'undefined') TaskManager.renderTasks();

    console.log('タスクを複製しました:', newTask.name);
  },

  setupPatternButton(date) {
    const applyPatternBtn = document.getElementById('applyPatternBtn');
    if (!applyPatternBtn) return;

    applyPatternBtn.addEventListener('click', () => {
      this.showPatternSelectionModal(date);
    });
  },

  showPatternSelectionModal(startDate) {
    if (typeof MultiDayPatternManager === 'undefined' || !MultiDayPatternManager.patterns) {
      alert('パターンが見つかりません');
      return;
    }

    const patterns = MultiDayPatternManager.patterns;
    if (patterns.length === 0) {
      alert('パターンがありません。先にパターンを作成してください。');
      return;
    }

    // モーダルを作成
    const modalHtml = `
      <div class="modal" id="patternSelectionModal" style="display: flex;">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title">パターンを選択</h2>
            <button class="modal-close-btn" id="patternSelectionCloseBtn">×</button>
          </div>
          <div class="modal-body">
            <div class="pattern-selection-list">
              ${patterns.map(pattern => `
                <div class="pattern-selection-item" data-pattern-id="${pattern.id}">
                  <div class="pattern-item-header">
                    <div class="pattern-item-name">${this.escapeHtml(pattern.name)}</div>
                    <div class="pattern-item-days">${pattern.days}日間</div>
                  </div>
                  <div class="pattern-item-summary">
                    ${pattern.dayPatterns.map((day, idx) =>
                      `<span class="pattern-day-label">Day${idx + 1}: ${this.escapeHtml(day.label || '')} (${day.tasks.length}タスク)</span>`
                    ).join(' ')}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    // モーダルを挿入
    const existingModal = document.getElementById('patternSelectionModal');
    if (existingModal) {
      existingModal.remove();
    }
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // イベントリスナーを設定
    const modal = document.getElementById('patternSelectionModal');
    const closeBtn = document.getElementById('patternSelectionCloseBtn');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.remove();
      });
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.remove();
        }
      });
    }

    // パターン選択
    const patternItems = document.querySelectorAll('.pattern-selection-item');
    patternItems.forEach(item => {
      item.addEventListener('click', () => {
        const patternId = item.dataset.patternId;
        this.applyPattern(patternId, startDate);
        modal.remove();
      });
    });
  },

  applyPattern(patternId, startDate) {
    if (typeof MultiDayPatternManager === 'undefined') return;

    const dateStr = this.formatDateKey(startDate);
    const tasksToAdd = MultiDayPatternManager.applyPatternToDate(patternId, dateStr);

    if (!tasksToAdd || tasksToAdd.length === 0) {
      alert('パターンの適用に失敗しました');
      return;
    }

    // タスクを追加
    TaskManager.tasks.push(...tasksToAdd);
    Storage.saveTasks(TaskManager.tasks);

    // 表示を更新
    this.renderCalendar();
    if (this.selectedDate) {
      this.showSelectedDayTasks(this.selectedDate);
    }
    if (typeof Gauge !== 'undefined') Gauge.updateGauge();
    if (typeof TaskManager !== 'undefined') TaskManager.renderTasks();

    const pattern = MultiDayPatternManager.patterns.find(p => p.id === patternId);
    alert(`パターン「${pattern.name}」を適用しました\n${tasksToAdd.length}個のタスクを追加しました`);
    console.log('パターンを適用しました:', pattern.name, tasksToAdd);
  }
};
