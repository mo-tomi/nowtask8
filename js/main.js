const App = {
  currentView: 'tasks',

  init() {
    console.log('nowtask - アプリを起動しました');

    Gauge.init();
    TaskManager.init();
    TaskEditor.init();
    Calendar.init();
    RoutineManager.init();
    ShiftManager.init();
    Stats.init();
    Settings.init();

    this.setupEventListeners();
    this.applyInitialView();

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
        console.log('時間設定ボタンがクリックされました');
      });
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
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
