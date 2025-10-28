// task-core.js - タスク管理のコア機能（CRUD、フィルタ、データ管理）

const TaskManager = {
  tasks: [],
  lastAddTime: 0, // 重複追加防止用
  filters: {
    search: '',
    priorities: [],
    tags: [],
    statuses: [] // デフォルトは空（完了・未完了両方表示）
  },

  init() {
    this.tasks = Storage.loadTasks();
    this.renderTasks();
    this.setupEventListeners();
    this.setupSwipeGestures();
    this.setupMultiSelect();
  },

  setupEventListeners() {
    const addTaskBtn = document.getElementById('addTaskBtn');
    const completedToggle = document.getElementById('completedToggle');
    const filterBtn = document.getElementById('filterBtn');
    const filterCloseBtn = document.getElementById('filterCloseBtn');
    const filterModal = document.getElementById('filterModal');
    const applyFilterBtn = document.getElementById('applyFilterBtn');
    const clearFilterBtn = document.getElementById('clearFilterBtn');

    if (addTaskBtn) {
      let longPressTimer = null;
      let isLongPress = false;

      // タッチ/マウス開始
      const startLongPress = () => {
        isLongPress = false;
        longPressTimer = setTimeout(() => {
          isLongPress = true;
          // 長押し検出：テンプレートクイック追加を開く
          if (typeof TemplateQuickAdd !== 'undefined') {
            TemplateQuickAdd.openModal();
          }
        }, 500); // 500msで長押し判定
      };

      // タッチ/マウス終了
      const endLongPress = () => {
        if (longPressTimer) {
          clearTimeout(longPressTimer);
        }
        if (!isLongPress) {
          // 通常のタップ：タスク編集モーダルを開く
          const currentDate = Gauge.currentDate;
          this.showTaskMenu(null, currentDate);
        }
        isLongPress = false;
      };

      // キャンセル
      const cancelLongPress = () => {
        if (longPressTimer) {
          clearTimeout(longPressTimer);
        }
        isLongPress = false;
      };

      // イベントリスナー
      addTaskBtn.addEventListener('mousedown', startLongPress);
      addTaskBtn.addEventListener('mouseup', endLongPress);
      addTaskBtn.addEventListener('mouseleave', cancelLongPress);
      addTaskBtn.addEventListener('touchstart', startLongPress);
      addTaskBtn.addEventListener('touchend', endLongPress);
      addTaskBtn.addEventListener('touchcancel', cancelLongPress);

      // クリックイベントを防ぐ（長押し時）
      addTaskBtn.addEventListener('click', (e) => {
        if (isLongPress) {
          e.preventDefault();
          e.stopPropagation();
        }
      });
    }

    if (completedToggle) {
      completedToggle.addEventListener('click', () => {
        this.toggleCompletedTasks();
      });
    }

    if (filterBtn) {
      filterBtn.addEventListener('click', () => {
        this.openFilterModal();
      });
    }

    if (filterCloseBtn) {
      filterCloseBtn.addEventListener('click', () => {
        this.closeFilterModal();
      });
    }

    if (filterModal) {
      filterModal.addEventListener('click', (e) => {
        if (e.target === filterModal) {
          this.closeFilterModal();
        }
      });
    }

    if (applyFilterBtn) {
      applyFilterBtn.addEventListener('click', () => {
        this.applyFilters();
      });
    }

    if (clearFilterBtn) {
      clearFilterBtn.addEventListener('click', () => {
        this.clearFilters();
      });
    }

    this.setupDragAndDrop();
  },

  addTaskFromQuickInput() {
    // 重複実行防止（300ms以内の連続実行を防ぐ）
    const now = Date.now();
    if (now - this.lastAddTime < 300) {
      console.log('重複実行を防止しました');
      return;
    }
    this.lastAddTime = now;

    const input = document.getElementById('quickInput');
    const timeSelect = document.getElementById('timeSelect');
    const taskName = input.value.trim();

    if (!taskName) {
      console.log('タスク名が空のため追加をキャンセル');
      return;
    }

    const options = {};

    // 時間が選択されている場合
    if (timeSelect && timeSelect.value) {
      options.duration = parseInt(timeSelect.value);
    }

    const task = this.createTask(taskName, options);
    this.tasks.push(task);
    Storage.saveTasks(this.tasks);

    input.value = '';
    if (timeSelect) {
      timeSelect.value = '';
    }

    // キーボードを閉じる（スマホ対応）
    input.blur();

    this.renderTasks();
    Gauge.updateGauge();
    if (window.Calendar) Calendar.renderCalendar();

    console.log('タスクを追加しました:', task);
  },

  createTask(name, options = {}) {
    const now = new Date().toISOString();
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const taskId = `task_${dateStr}_${Date.now()}`;

    return {
      id: taskId,
      name: name,
      startTime: options.startTime || null,
      endTime: options.endTime || null,
      duration: options.duration || null,
      priority: options.priority || null,
      tags: options.tags || [],
      completed: false,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
      subtasks: []
    };
  },

  deleteTask(taskId) {
    const taskIndex = this.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const task = this.tasks[taskIndex];
    if (confirm(`「${task.name}」を削除しますか？`)) {
      this.tasks.splice(taskIndex, 1);
      Storage.saveTasks(this.tasks);
      this.renderTasks();
      Gauge.updateGauge();
      if (window.Calendar) Calendar.renderCalendar();
      console.log('タスクを削除しました:', task);
    }
  },

  toggleTaskComplete(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;

    task.completed = !task.completed;
    task.completedAt = task.completed ? new Date().toISOString() : null;
    task.updatedAt = new Date().toISOString();

    Storage.saveTasks(this.tasks);
    this.renderTasks();
    Gauge.updateGauge();
    if (window.Calendar) Calendar.renderCalendar();

    console.log('タスクの完了状態を変更しました:', task);
  },

  getTodayTasks() {
    const today = Gauge.currentDate.toDateString();
    return this.tasks.filter(task => {
      const isToday = task.startTime
        ? new Date(task.startTime).toDateString() === today
        : new Date(task.createdAt).toDateString() === today;

      if (!isToday) return false;

      return this.filterTask(task);
    });
  },

  getEffectiveDuration(task) {
    // メインタスクに時間設定がある場合はそれを使用
    if (task.duration) {
      return task.duration;
    }

    // メインタスクに時間設定がない場合、サブタスクの合計を返す
    if (task.subtasks && task.subtasks.length > 0) {
      return task.subtasks.reduce((sum, subtask) => {
        return sum + (subtask.duration || 0);
      }, 0);
    }

    return 0;
  },

  toggleSubtaskComplete(taskId, subtaskIndex) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task || !task.subtasks || !task.subtasks[subtaskIndex]) return;

    task.subtasks[subtaskIndex].completed = !task.subtasks[subtaskIndex].completed;
    task.updatedAt = new Date().toISOString();

    Storage.saveTasks(this.tasks);
    this.renderTasks();

    console.log('サブタスクの完了状態を変更しました:', task.subtasks[subtaskIndex]);
  },

  showSubtaskDetail(taskId, subtaskIndex) {
    if (typeof SubtaskDetail !== 'undefined' && SubtaskDetail.openModal) {
      SubtaskDetail.openModal(taskId, subtaskIndex);
    }
  },

  addSubtaskInline(taskId, subtaskName) {
    if (!subtaskName) return;

    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;

    const newSubtask = {
      id: `subtask_${Date.now()}`,
      name: subtaskName,
      completed: false,
      duration: null,
      subtasks: []
    };

    if (!task.subtasks) {
      task.subtasks = [];
    }

    task.subtasks.push(newSubtask);
    task.updatedAt = new Date().toISOString();

    Storage.saveTasks(this.tasks);
    this.renderTasks();
    Gauge.updateGauge();

    console.log('サブタスクを追加しました:', subtaskName);
  },

  showTaskMenu(taskId, defaultDate) {
    if (typeof TaskEditor !== 'undefined' && TaskEditor.openModal) {
      TaskEditor.openModal(taskId, defaultDate);
    }
  },

  toggleCompletedTasks() {
    const completedTasks = document.getElementById('completedTasks');
    const toggle = document.getElementById('completedToggle');

    if (!completedTasks || !toggle) return;

    const isVisible = completedTasks.style.display !== 'none';

    completedTasks.style.display = isVisible ? 'none' : 'block';
    toggle.classList.toggle('active', !isVisible);
  },

  openFilterModal() {
    const modal = document.getElementById('filterModal');
    if (!modal) return;

    this.populateTagFilters();
    this.populateCurrentFilters();

    modal.style.display = 'flex';
  },

  closeFilterModal() {
    const modal = document.getElementById('filterModal');
    if (modal) {
      modal.style.display = 'none';
    }
  },

  populateTagFilters() {
    const tagSet = new Set();
    this.tasks.forEach(task => {
      if (task.tags && task.tags.length > 0) {
        task.tags.forEach(tag => tagSet.add(tag));
      }
    });

    const tagArray = Array.from(tagSet).sort();
    const tagFilterList = document.getElementById('tagFilterList');
    if (!tagFilterList) return;

    if (tagArray.length === 0) {
      tagFilterList.innerHTML = '<div class="empty-state-text">タグがありません</div>';
      return;
    }

    tagFilterList.innerHTML = tagArray.map(tag => `
      <label class="filter-checkbox">
        <input type="checkbox" value="${this.escapeHtml(tag)}" class="tag-filter"> ${this.escapeHtml(tag)}
      </label>
    `).join('');
  },

  populateCurrentFilters() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.value = this.filters.search;
    }

    const priorityFilters = document.querySelectorAll('.priority-filter');
    priorityFilters.forEach(checkbox => {
      checkbox.checked = this.filters.priorities.includes(checkbox.value);
    });

    const tagFilters = document.querySelectorAll('.tag-filter');
    tagFilters.forEach(checkbox => {
      checkbox.checked = this.filters.tags.includes(checkbox.value);
    });

    const statusFilters = document.querySelectorAll('.status-filter');
    statusFilters.forEach(checkbox => {
      checkbox.checked = this.filters.statuses.includes(checkbox.value);
    });
  },

  applyFilters() {
    const searchInput = document.getElementById('searchInput');
    this.filters.search = searchInput ? searchInput.value.trim() : '';

    this.filters.priorities = [];
    const priorityFilters = document.querySelectorAll('.priority-filter:checked');
    priorityFilters.forEach(checkbox => {
      this.filters.priorities.push(checkbox.value);
    });

    this.filters.tags = [];
    const tagFilters = document.querySelectorAll('.tag-filter:checked');
    tagFilters.forEach(checkbox => {
      this.filters.tags.push(checkbox.value);
    });

    this.filters.statuses = [];
    const statusFilters = document.querySelectorAll('.status-filter:checked');
    statusFilters.forEach(checkbox => {
      this.filters.statuses.push(checkbox.value);
    });

    this.closeFilterModal();
    this.renderTasks();

    console.log('フィルターを適用しました:', this.filters);
  },

  clearFilters() {
    this.filters = {
      search: '',
      priorities: [],
      tags: [],
      statuses: [] // デフォルトは空（完了・未完了両方表示）
    };

    this.populateCurrentFilters();
    this.renderTasks();

    console.log('フィルターをクリアしました');
  },

  filterTask(task) {
    if (this.filters.search) {
      const searchLower = this.filters.search.toLowerCase();
      if (!task.name.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    if (this.filters.priorities.length > 0) {
      const taskPriority = task.priority || 'none';
      if (!this.filters.priorities.includes(taskPriority)) {
        return false;
      }
    }

    if (this.filters.tags.length > 0) {
      if (!task.tags || task.tags.length === 0) {
        return false;
      }
      const hasMatchingTag = task.tags.some(tag => this.filters.tags.includes(tag));
      if (!hasMatchingTag) {
        return false;
      }
    }

    if (this.filters.statuses.length > 0) {
      const taskStatus = task.completed ? 'completed' : 'incomplete';
      if (!this.filters.statuses.includes(taskStatus)) {
        return false;
      }
    }

    return true;
  },

  formatTimeLabel(startTime) {
    const date = new Date(startTime);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  },

  formatDuration(minutes) {
    if (minutes < 60) {
      return `${minutes}分`;
    }

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (mins === 0) {
      return `${hours}時間`;
    }

    return `${hours}時間${mins}分`;
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};
