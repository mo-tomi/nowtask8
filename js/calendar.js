const Calendar = {
  currentDate: new Date(),
  selectedDate: null,

  init() {
    console.log('カレンダーを初期化しました');
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

    let shift = null;
    let hasShiftClass = '';
    if (window.ShiftManager) {
      shift = ShiftManager.getShiftForDate(date);
      if (shift) {
        hasShiftClass = 'has-shift';
      }
    }

    return `
      <div class="day-cell ${classes} ${hasTasksClass} ${hasShiftClass}" data-date="${dateStr}">
        <div class="day-number">${day}</div>
        ${shift ? `<div class="shift-label">${this.escapeHtml(shift.name)}</div>` : ''}
        <div class="day-tasks">
          ${taskCount > 0 ? `<div class="task-count">${taskCount}</div>` : ''}
        </div>
      </div>
    `;
  },

  setupDayCellListeners() {
    const cells = document.querySelectorAll('.day-cell');
    cells.forEach(cell => {
      cell.addEventListener('click', () => {
        const dateStr = cell.getAttribute('data-date');
        if (dateStr) {
          if (window.ShiftManager && ShiftManager.shiftMode) {
            const date = new Date(dateStr);
            ShiftManager.selectDate(date);
          } else {
            this.selectDay(dateStr);
          }
        }
      });
    });
  },

  selectDay(dateOrStr) {
    const date = dateOrStr instanceof Date ? dateOrStr : new Date(dateOrStr);
    const dateStr = this.formatDateKey(date);
    this.selectedDate = date;

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
    if (window.ShiftManager && ShiftManager.shiftMode) {
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

    // タスク一覧を表示
    if (tasks.length > 0) {
      selectedDayTaskList.innerHTML = tasks.map(task => this.renderTaskForDay(task)).join('');
    } else {
      selectedDayTaskList.innerHTML = '<div class="empty-state-text">この日はタスクがありません</div>';
    }

    // 表示状態を更新
    selectedDayTasks.classList.add('visible');
    if (container) {
      container.classList.add('with-selected-day');
    }
  },

  renderTaskForDay(task) {
    const timeLabel = this.formatTaskTime(task);
    const priorityClass = task.priority ? `priority-${task.priority}` : '';

    return `
      <div class="task-card ${priorityClass}" data-task-id="${task.id}">
        <div class="task-card-header">
          <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
          ${task.priority ? `<span class="priority-dot ${priorityClass}"></span>` : ''}
          <span class="task-name ${task.completed ? 'completed' : ''}">${task.name}</span>
        </div>
        ${timeLabel ? `<div class="task-time">${timeLabel}</div>` : ''}
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
    if (!window.TaskManager || !window.TaskManager.tasks) return [];

    const dateStr = this.formatDateKey(date);
    return window.TaskManager.tasks.filter(task => {
      if (task.startTime) {
        const taskDate = new Date(task.startTime);
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
  }
};
