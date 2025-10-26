// task-gestures.js - ドラッグ&ドロップ、スワイプ、マルチセレクト機能

// ジェスチャー関連のプロパティを追加
Object.assign(TaskManager, {
  draggedElement: null,
  draggedTaskId: null,
  swipeStartX: 0,
  swipeStartY: 0,
  swipeElement: null,
  multiSelectMode: false,
  selectedTasks: [],
  longPressTimer: null,
  longPressDelay: 500
});

// ジェスチャー関連のメソッドを追加
Object.assign(TaskManager, {
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
        this.toggleTaskComplete(taskId);
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
        const taskItem = taskCard.closest('.task-item');
        if (taskItem) {
          this.toggleTaskSelection(taskItem.dataset.taskId);
        }
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

      const taskItem = e.target.closest('.task-item');
      if (taskItem) {
        e.preventDefault();
        this.toggleTaskSelection(taskItem.dataset.taskId);
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
    const taskItem = document.querySelector(`.task-item[data-task-id="${taskId}"]`);
    const taskCard = taskItem ? taskItem.querySelector('.task-card') : null;

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
      const task = this.tasks.find(t => t.id === taskId);
      if (task && !task.completed) {
        task.completed = true;
        task.completedAt = new Date().toISOString();
        task.updatedAt = new Date().toISOString();
      }
    });

    Storage.saveTasks(this.tasks);
    this.renderTasks();
    Gauge.updateGauge();

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
      const taskIndex = this.tasks.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        this.tasks.splice(taskIndex, 1);
      }
    });

    Storage.saveTasks(this.tasks);
    this.renderTasks();
    Gauge.updateGauge();

    this.exitMultiSelectMode();
  }
});
