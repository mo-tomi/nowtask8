const TaskManager = {
  tasks: [],
  filters: {
    search: '',
    priorities: [],
    tags: [],
    statuses: ['incomplete']
  },

  draggedElement: null,
  draggedTaskId: null,
  swipeStartX: 0,
  swipeStartY: 0,
  swipeElement: null,
  multiSelectMode: false,
  selectedTasks: [],
  longPressTimer: null,
  longPressDelay: 500,

  init() {
    this.tasks = Storage.loadTasks();
    this.renderTasks();
    this.setupEventListeners();
    this.setupSwipeGestures();
    this.setupMultiSelect();
  },

  setupEventListeners() {
    const completedToggle = document.getElementById('completedToggle');
    const filterBtn = document.getElementById('filterBtn');
    const filterCloseBtn = document.getElementById('filterCloseBtn');
    const filterModal = document.getElementById('filterModal');
    const applyFilterBtn = document.getElementById('applyFilterBtn');
    const clearFilterBtn = document.getElementById('clearFilterBtn');

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

  setupDragAndDrop() {
    const taskList = document.getElementById('taskList');
    if (!taskList) return;

    taskList.addEventListener('dragstart', (e) => {
      if (e.target.classList.contains('task-item')) {
        this.draggedElement = e.target;
        this.draggedTaskId = e.target.dataset.taskId;
        e.target.style.opacity = '0.5';
      }
    });

    taskList.addEventListener('dragend', (e) => {
      if (e.target.classList.contains('task-item')) {
        e.target.style.opacity = '1';
        this.draggedElement = null;
        this.draggedTaskId = null;
      }
    });

    taskList.addEventListener('dragover', (e) => {
      e.preventDefault();
      const targetItem = e.target.closest('.task-item');
      if (targetItem && targetItem !== this.draggedElement) {
        const rect = targetItem.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        if (e.clientY < midpoint) {
          taskList.insertBefore(this.draggedElement, targetItem);
        } else {
          taskList.insertBefore(this.draggedElement, targetItem.nextSibling);
        }
      }
    });

    taskList.addEventListener('drop', (e) => {
      e.preventDefault();
      this.reorderTasks();
    });
  },

  reorderTasks() {
    const taskList = document.getElementById('taskList');
    if (!taskList) return;

    const taskItems = Array.from(taskList.querySelectorAll('.task-item'));
    const newOrder = taskItems.map(item => item.dataset.taskId);

    const todayTasks = this.getTodayTasks().filter(t => !t.completed);
    const reorderedTasks = [];

    newOrder.forEach(id => {
      const task = todayTasks.find(t => t.id === id);
      if (task) reorderedTasks.push(task);
    });

    const otherTasks = this.tasks.filter(t => {
      const isToday = this.getTodayTasks().includes(t);
      return !isToday || t.completed;
    });

    this.tasks = [...reorderedTasks, ...otherTasks];
    Storage.saveTasks(this.tasks);

    console.log('タスクの順序を変更しました');
  },

  addTaskFromQuickInput() {
    const input = document.getElementById('quickInput');
    const taskName = input.value.trim();

    if (!taskName) return;

    const task = this.createTask(taskName);
    this.tasks.push(task);
    Storage.saveTasks(this.tasks);

    input.value = '';

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

  renderTasks() {
    const taskList = document.getElementById('taskList');
    const completedTasks = document.getElementById('completedTasks');

    if (!taskList || !completedTasks) return;

    const todayTasks = this.getTodayTasks();
    const activeTasks = todayTasks.filter(t => !t.completed);
    const doneTasks = todayTasks.filter(t => t.completed);

    taskList.innerHTML = activeTasks.length > 0
      ? activeTasks.map(task => this.renderTaskCard(task)).join('')
      : '<div class="empty-state"><div class="empty-state-text">タスクがありません</div></div>';

    completedTasks.innerHTML = doneTasks.map(task => this.renderTaskCard(task)).join('');

    const completedCount = document.getElementById('completedCount');
    if (completedCount) {
      completedCount.textContent = doneTasks.length;
    }

    this.attachTaskEventListeners();
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

  renderTaskCard(task) {
    const priorityMarkHtml = task.priority
      ? `<span class="priority-dot ${task.priority}"></span>`
      : '';

    const tagsHtml = task.tags && task.tags.length > 0
      ? `<div class="task-tags">${task.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}</div>`
      : '';

    const timeLabel = task.startTime
      ? this.formatTimeLabel(task.startTime)
      : '';

    const timeLabelHtml = timeLabel
      ? `<div class="task-time">${timeLabel}</div>`
      : '';

    const completedClass = task.completed ? 'completed' : '';
    const taskNameClass = task.completed ? 'task-name completed' : 'task-name';

    const subtasksHtml = task.subtasks && task.subtasks.length > 0
      ? this.renderSubtasks(task.subtasks)
      : '';

    const gaugeHtml = this.renderTaskGauge(task);

    return `
      <div class="task-item" draggable="true" data-task-id="${task.id}">
        ${timeLabelHtml}
        <div class="task-card ${completedClass}">
          <div class="task-main">
            <input
              type="checkbox"
              class="task-checkbox"
              data-task-id="${task.id}"
              ${task.completed ? 'checked' : ''}
            >
            <div class="task-content">
              <div class="task-header">
                ${priorityMarkHtml}
                <div class="${taskNameClass}">${this.escapeHtml(task.name)}</div>
                <button class="task-menu" data-task-id="${task.id}">⋮</button>
              </div>
              ${tagsHtml}
              ${subtasksHtml}
              ${gaugeHtml}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderTaskGauge(task) {
    if (!task.duration || !task.subtasks || task.subtasks.length === 0) {
      return '';
    }

    const totalDuration = task.duration;
    const subtasksDuration = task.subtasks.reduce((sum, subtask) => {
      return sum + (subtask.duration || 0);
    }, 0);

    const usedPercent = Math.min((subtasksDuration / totalDuration) * 100, 100);
    const remainingTime = totalDuration - subtasksDuration;

    return `
      <div class="main-task-gauge">
        <div class="gauge-bar">
          <div class="gauge-fill" style="width: ${usedPercent}%"></div>
        </div>
        <div class="gauge-text">
          残り: ${remainingTime}分 （使用: ${subtasksDuration}分 / 全体: ${totalDuration}分）
        </div>
      </div>
    `;
  },

  renderSubtasks(subtasks) {
    if (!subtasks || subtasks.length === 0) return '';

    const subtasksHtml = subtasks.map(subtask => {
      const completedClass = subtask.completed ? 'completed' : '';
      return `
        <div class="subtask-item">
          <div class="subtask-checkbox ${completedClass}"></div>
          <div class="subtask-name ${completedClass}">${this.escapeHtml(subtask.name)}</div>
        </div>
      `;
    }).join('');

    return `<div class="subtasks">${subtasksHtml}</div>`;
  },

  formatTimeLabel(startTime) {
    const date = new Date(startTime);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  attachTaskEventListeners() {
    const checkboxes = document.querySelectorAll('.task-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const taskId = e.target.dataset.taskId;
        this.toggleTaskComplete(taskId);
      });
    });

    const menuButtons = document.querySelectorAll('.task-menu');
    menuButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const taskId = e.currentTarget.dataset.taskId;
        this.showTaskMenu(taskId);
      });
    });
  },

  showTaskMenu(taskId) {
    if (window.TaskEditor) {
      TaskEditor.openModal(taskId);
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
      statuses: ['incomplete']
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

  setupSwipeGestures() {
    const taskList = document.getElementById('taskList');
    const completedTasks = document.getElementById('completedTasks');

    if (taskList) {
      this.addSwipeListeners(taskList);
    }
    if (completedTasks) {
      this.addSwipeListeners(completedTasks);
    }
  },

  addSwipeListeners(container) {
    container.addEventListener('touchstart', (e) => {
      const taskCard = e.target.closest('.task-card');
      if (taskCard && !taskCard.classList.contains('swiped')) {
        this.swipeElement = taskCard;
        this.swipeStartX = e.touches[0].clientX;
        this.swipeStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
      if (!this.swipeElement) return;

      const deltaX = e.touches[0].clientX - this.swipeStartX;
      const deltaY = e.touches[0].clientY - this.swipeStartY;

      // 縦スクロールの場合はスワイプキャンセル
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        this.swipeElement = null;
        return;
      }

      // 横スワイプの場合
      if (Math.abs(deltaX) > 10) {
        e.preventDefault();
        this.swipeElement.style.transform = `translateX(${deltaX}px)`;
        this.swipeElement.style.transition = 'none';
      }
    });

    container.addEventListener('touchend', (e) => {
      if (!this.swipeElement) return;

      const deltaX = e.changedTouches[0].clientX - this.swipeStartX;

      this.swipeElement.style.transition = 'transform 0.3s ease';

      // 右スワイプ（完了）
      if (deltaX > 80) {
        this.swipeElement.style.transform = 'translateX(80px)';
        this.swipeElement.classList.add('swiped-right');
        this.showSwipeAction(this.swipeElement, 'complete');
      }
      // 左スワイプ（削除）
      else if (deltaX < -80) {
        this.swipeElement.style.transform = 'translateX(-80px)';
        this.swipeElement.classList.add('swiped-left');
        this.showSwipeAction(this.swipeElement, 'delete');
      }
      // 戻す
      else {
        this.swipeElement.style.transform = 'translateX(0)';
        this.swipeElement.classList.remove('swiped-right', 'swiped-left');
      }

      this.swipeElement = null;
    });
  },

  showSwipeAction(element, action) {
    const taskId = element.dataset.taskId;

    // 既存のスワイプボタンを削除
    const existingActions = document.querySelectorAll('.swipe-action');
    existingActions.forEach(btn => btn.remove());

    // スワイプアクションボタンを作成
    const actionBtn = document.createElement('div');
    actionBtn.className = `swipe-action swipe-${action}`;

    if (action === 'complete') {
      actionBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
      actionBtn.style.left = '0';
      actionBtn.addEventListener('click', () => {
        this.toggleTaskCompletion(taskId);
        this.resetSwipe(element);
      });
    } else if (action === 'delete') {
      actionBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="white"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>';
      actionBtn.style.right = '0';
      actionBtn.addEventListener('click', () => {
        if (confirm('このタスクを削除しますか？')) {
          this.deleteTask(taskId);
        }
        this.resetSwipe(element);
      });
    }

    element.appendChild(actionBtn);

    // 他の場所をタップしたら戻す
    setTimeout(() => {
      document.addEventListener('click', (e) => {
        if (!element.contains(e.target)) {
          this.resetSwipe(element);
        }
      }, { once: true });
    }, 100);
  },

  resetSwipe(element) {
    if (!element) return;
    element.style.transform = 'translateX(0)';
    element.classList.remove('swiped-right', 'swiped-left');
    const actionBtn = element.querySelector('.swipe-action');
    if (actionBtn) {
      actionBtn.remove();
    }
  },

  setupMultiSelect() {
    const editModeBtn = document.getElementById('editModeBtn');
    const completeSelectedBtn = document.getElementById('completeSelectedBtn');
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
    const cancelSelectBtn = document.getElementById('cancelSelectBtn');

    // 編集ボタン
    if (editModeBtn) {
      editModeBtn.addEventListener('click', () => {
        this.toggleMultiSelectMode();
      });
    }

    // 完了ボタン
    if (completeSelectedBtn) {
      completeSelectedBtn.addEventListener('click', () => {
        this.completeSelectedTasks();
      });
    }

    // 削除ボタン
    if (deleteSelectedBtn) {
      deleteSelectedBtn.addEventListener('click', () => {
        this.deleteSelectedTasks();
      });
    }

    // キャンセルボタン
    if (cancelSelectBtn) {
      cancelSelectBtn.addEventListener('click', () => {
        this.exitMultiSelectMode();
      });
    }

    // 長押しイベント
    this.setupLongPress();
  },

  setupLongPress() {
    const taskList = document.getElementById('taskList');
    if (!taskList) return;

    taskList.addEventListener('touchstart', (e) => {
      const taskCard = e.target.closest('.task-card');
      if (!taskCard || this.multiSelectMode) return;

      this.longPressTimer = setTimeout(() => {
        this.enterMultiSelectMode();
        this.toggleTaskSelection(taskCard.dataset.taskId);
      }, this.longPressDelay);
    });

    taskList.addEventListener('touchend', () => {
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
    });

    taskList.addEventListener('touchmove', () => {
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
    });

    // クリックイベント（複数選択モード中）
    taskList.addEventListener('click', (e) => {
      if (!this.multiSelectMode) return;

      const taskCard = e.target.closest('.task-card');
      if (taskCard) {
        e.preventDefault();
        this.toggleTaskSelection(taskCard.dataset.taskId);
      }
    });
  },

  toggleMultiSelectMode() {
    if (this.multiSelectMode) {
      this.exitMultiSelectMode();
    } else {
      this.enterMultiSelectMode();
    }
  },

  enterMultiSelectMode() {
    this.multiSelectMode = true;
    this.selectedTasks = [];

    // UIを更新
    const quickInputBar = document.getElementById('quickInputBar');
    const multiSelectBar = document.getElementById('multiSelectBar');
    const editModeBtn = document.getElementById('editModeBtn');

    if (quickInputBar) quickInputBar.style.display = 'none';
    if (multiSelectBar) multiSelectBar.style.display = 'flex';
    if (editModeBtn) editModeBtn.classList.add('active');

    console.log('複数選択モードに入りました');
  },

  exitMultiSelectMode() {
    this.multiSelectMode = false;
    this.selectedTasks = [];

    // UIを更新
    const quickInputBar = document.getElementById('quickInputBar');
    const multiSelectBar = document.getElementById('multiSelectBar');
    const editModeBtn = document.getElementById('editModeBtn');

    if (quickInputBar) quickInputBar.style.display = 'flex';
    if (multiSelectBar) multiSelectBar.style.display = 'none';
    if (editModeBtn) editModeBtn.classList.remove('active');

    // 選択状態を解除
    const selectedCards = document.querySelectorAll('.task-card.selected');
    selectedCards.forEach(card => card.classList.remove('selected'));

    console.log('複数選択モードを終了しました');
  },

  toggleTaskSelection(taskId) {
    const index = this.selectedTasks.indexOf(taskId);
    const taskCard = document.querySelector(`.task-card[data-task-id="${taskId}"]`);

    if (index > -1) {
      // 選択解除
      this.selectedTasks.splice(index, 1);
      if (taskCard) taskCard.classList.remove('selected');
    } else {
      // 選択追加
      this.selectedTasks.push(taskId);
      if (taskCard) taskCard.classList.add('selected');
    }

    console.log('選択中のタスク:', this.selectedTasks.length);
  },

  completeSelectedTasks() {
    if (this.selectedTasks.length === 0) {
      alert('タスクを選択してください');
      return;
    }

    this.selectedTasks.forEach(taskId => {
      this.toggleTaskCompletion(taskId);
    });

    this.exitMultiSelectMode();
  },

  deleteSelectedTasks() {
    if (this.selectedTasks.length === 0) {
      alert('タスクを選択してください');
      return;
    }

    if (!confirm(`${this.selectedTasks.length}件のタスクを削除しますか？`)) {
      return;
    }

    this.selectedTasks.forEach(taskId => {
      this.deleteTask(taskId);
    });

    this.exitMultiSelectMode();
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};
