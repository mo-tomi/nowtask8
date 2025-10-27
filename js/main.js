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
    const quickInputForm = document.getElementById('quickInputForm');
    const quickInput = document.getElementById('quickInput');

    if (viewToggleBtn) {
      viewToggleBtn.addEventListener('click', () => {
        this.toggleView();
      });
    }

    // フォーム送信イベントをハンドリング（スマホのEnterキー対応の主要な方法）
    if (quickInputForm) {
      quickInputForm.addEventListener('submit', (e) => {
        e.preventDefault();
        console.log('フォーム送信イベント発火');
        TaskManager.addTaskFromQuickInput();
      });
    }

    // 追加のキーボードイベント対応（バックアップ）
    if (quickInput) {
      // keydown イベント
      quickInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.keyCode === 13) {
          e.preventDefault();
          console.log('keydown Enter検出');
          TaskManager.addTaskFromQuickInput();
        }
      });

      // keyup イベント（さらなるバックアップ）
      quickInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter' || e.keyCode === 13) {
          e.preventDefault();
          console.log('keyup Enter検出');
          TaskManager.addTaskFromQuickInput();
        }
      });

      // change イベント（一部のスマホで有効）
      quickInput.addEventListener('change', () => {
        if (quickInput.value.trim()) {
          console.log('change イベント発火');
          TaskManager.addTaskFromQuickInput();
        }
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
