const App = {
  currentView: 'tasks',

  init() {
    console.log('nowtask - アプリを起動しました');

    Gauge.init();
    TaskManager.init();
    TaskEditor.init();
    SubtaskDetail.init();
    Calendar.init();
    RoutineManager.init();
    ShiftManager.init();
    Stats.init();
    Settings.init();

    this.setupEventListeners();
    this.applyInitialView();
    this.checkPastIncompleteTasks();

    console.log('初期化が完了しました');
  },

  applyInitialView() {
    const defaultView = Settings.getDefaultView();
    if (defaultView === 'calendar') {
      this.currentView = 'tasks';
      this.toggleView();
    }
  },

  setupEventListeners() {
    const viewToggleBtn = document.getElementById('viewToggleBtn');
    const quickInput = document.getElementById('quickInput');
    const timeBtn = document.getElementById('timeBtn');
    const timeSelect = document.getElementById('timeSelect');

    if (viewToggleBtn) {
      viewToggleBtn.addEventListener('click', () => {
        this.toggleView();
      });
    }

    if (quickInput) {
      quickInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          TaskManager.addTaskFromQuickInput();
        }
      });
    }

    if (timeBtn) {
      timeBtn.addEventListener('click', () => {
        this.toggleTimeSelect();
      });
    }

    if (timeSelect) {
      timeSelect.addEventListener('change', (e) => {
        if (e.target.value) {
          console.log('選択された時間:', e.target.value, '分');
        }
      });
    }
  },

  toggleTimeSelect() {
    const timeSelect = document.getElementById('timeSelect');
    if (!timeSelect) return;

    if (timeSelect.style.display === 'none' || !timeSelect.style.display) {
      timeSelect.style.display = 'block';
      timeSelect.focus();
    } else {
      timeSelect.style.display = 'none';
    }
  },

  toggleView() {
    const taskSection = document.getElementById('taskSection');
    const calendarSection = document.getElementById('calendarSection');
    const statsSection = document.getElementById('statsSection');

    if (this.currentView === 'tasks') {
      this.currentView = 'calendar';
      taskSection.style.display = 'none';
      calendarSection.style.display = 'block';
      statsSection.style.display = 'none';
      console.log('カレンダー表示に切り替えました');
    } else {
      this.currentView = 'tasks';
      taskSection.style.display = 'block';
      calendarSection.style.display = 'none';
      statsSection.style.display = 'none';
      console.log('タスク一覧表示に切り替えました');
    }
  },

  showStatsView() {
    const taskSection = document.getElementById('taskSection');
    const calendarSection = document.getElementById('calendarSection');
    const statsSection = document.getElementById('statsSection');

    this.currentView = 'stats';
    taskSection.style.display = 'none';
    calendarSection.style.display = 'none';
    statsSection.style.display = 'block';
    console.log('統計表示に切り替えました');
  },

  checkPastIncompleteTasks() {
    if (typeof TaskManager === 'undefined' || !TaskManager.tasks) {
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pastIncompleteTasks = TaskManager.tasks.filter(task => {
      if (task.completed) return false;
      if (!task.startTime) return false;

      const taskDate = new Date(task.startTime);
      taskDate.setHours(0, 0, 0, 0);

      return taskDate < today;
    });

    if (pastIncompleteTasks.length > 0) {
      console.log(`過去の未完了タスクが${pastIncompleteTasks.length}件あります`);

      const taskNames = pastIncompleteTasks
        .slice(0, 5)
        .map(t => `・${t.name}`)
        .join('\n');

      const moreText = pastIncompleteTasks.length > 5 ?
        `\n...他${pastIncompleteTasks.length - 5}件` : '';

      const message = `過去の未完了タスクが${pastIncompleteTasks.length}件あります:\n\n${taskNames}${moreText}\n\nタスク一覧で確認してください。`;

      setTimeout(() => {
        alert(message);
      }, 500);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
