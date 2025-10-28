// task-render.js - タスクのレンダリングとUI表示

Object.assign(TaskManager, {
  renderTasks() {
    const taskList = document.getElementById('taskList');
    const completedTasks = document.getElementById('completedTasks');

    if (!taskList || !completedTasks) return;

    // フィルタを適用したすべてのタスクを取得
    const allFilteredTasks = this.tasks.filter(task => this.filterTask(task));

    // 完了済みと未完了に分ける
    const activeTasks = allFilteredTasks.filter(t => !t.completed);
    const doneTasks = allFilteredTasks.filter(t => t.completed);

    // 未完了タスクを日付ごとにグループ化
    const tasksByDate = this.groupTasksByDate(activeTasks);

    // 日付ごとにレンダリング
    taskList.innerHTML = tasksByDate.length > 0
      ? tasksByDate.map(group => this.renderDateGroup(group)).join('')
      : '<div class="empty-state"><div class="empty-state-text">タスクがありません</div></div>';

    completedTasks.innerHTML = doneTasks.map(task => this.renderTaskCard(task)).join('');

    const completedCount = document.getElementById('completedCount');
    if (completedCount) {
      completedCount.textContent = doneTasks.length;
    }

    this.attachTaskEventListeners();
  },

  groupTasksByDate(tasks) {
    const groups = {};

    tasks.forEach(task => {
      let dateKey;
      if (task.startTime) {
        dateKey = new Date(task.startTime).toDateString();
      } else {
        dateKey = new Date(task.createdAt).toDateString();
      }

      if (!groups[dateKey]) {
        groups[dateKey] = {
          dateKey: dateKey,
          date: task.startTime ? new Date(task.startTime) : new Date(task.createdAt),
          tasks: []
        };
      }
      groups[dateKey].tasks.push(task);
    });

    // 日付順にソート
    return Object.values(groups).sort((a, b) => a.date - b.date);
  },

  renderDateGroup(group) {
    const dateObj = group.date;
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    const dayOfWeek = dayNames[dateObj.getDay()];

    const today = new Date();
    const isToday = dateObj.toDateString() === today.toDateString();
    const dateLabel = isToday ? '今日' : `${month}月${day}日（${dayOfWeek}）`;

    const tasksHtml = this.renderTasksWithOverlapDetection(group.tasks);

    // 日付をISO形式で保存（data属性用）
    const dateString = dateObj.toISOString();

    return `
      <div class="date-group">
        <div class="date-group-header">
          <span class="date-group-label">${dateLabel}</span>
          <button class="date-add-task-btn" data-date="${dateString}" title="タスク追加">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>
        ${tasksHtml}
      </div>
    `;
  },

  renderTasksWithOverlapDetection(tasks) {
    const overlapGroups = this.detectOverlaps(tasks);
    let html = '';

    overlapGroups.forEach(group => {
      if (group.isOverlap) {
        html += this.renderOverlapGroup(group.tasks);
      } else {
        html += group.tasks.map(task => this.renderTaskCard(task)).join('');
      }
    });

    return html;
  },

  detectOverlaps(tasks) {
    const tasksWithTime = tasks.filter(t => t.startTime && t.endTime);
    const tasksWithoutTime = tasks.filter(t => !t.startTime || !t.endTime);

    if (tasksWithTime.length === 0) {
      return [{ isOverlap: false, tasks: tasks }];
    }

    const sorted = [...tasksWithTime].sort((a, b) =>
      new Date(a.startTime) - new Date(b.startTime)
    );

    const groups = [];
    const processed = new Set();

    sorted.forEach((task, index) => {
      if (processed.has(task.id)) return;

      const overlapping = [task];
      processed.add(task.id);

      for (let i = index + 1; i < sorted.length; i++) {
        const other = sorted[i];
        if (processed.has(other.id)) continue;

        if (this.tasksOverlap(task, other) ||
            overlapping.some(t => this.tasksOverlap(t, other))) {
          overlapping.push(other);
          processed.add(other.id);
        }
      }

      if (overlapping.length > 1) {
        groups.push({ isOverlap: true, tasks: overlapping });
      } else {
        groups.push({ isOverlap: false, tasks: overlapping });
      }
    });

    if (tasksWithoutTime.length > 0) {
      groups.push({ isOverlap: false, tasks: tasksWithoutTime });
    }

    return groups;
  },

  tasksOverlap(task1, task2) {
    const start1 = new Date(task1.startTime);
    const end1 = new Date(task1.endTime);
    const start2 = new Date(task2.startTime);
    const end2 = new Date(task2.endTime);

    return start1 < end2 && start2 < end1;
  },

  renderOverlapGroup(tasks) {
    const count = tasks.length;
    const taskCards = tasks.map(task => this.renderTaskCard(task)).join('');

    return `
      <div class="overlap-group">
        <div class="overlap-warning">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <span>${count}件のタスクが重複しています</span>
        </div>
        <div class="overlap-tasks">
          ${taskCards}
        </div>
      </div>
    `;
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

    // 実効時間を取得（メインタスクの時間 or サブタスクの合計）
    const effectiveDuration = this.getEffectiveDuration(task);
    const durationBadge = effectiveDuration > 0
      ? `<span class="task-duration-badge">${this.formatDuration(effectiveDuration)}</span>`
      : '';

    const completedClass = task.completed ? 'completed' : '';
    const taskNameClass = task.completed ? 'task-name completed' : 'task-name';

    const subtasksHtml = this.renderSubtasks(task.subtasks, task.id);

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
                ${durationBadge}
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
    if (!task.subtasks || task.subtasks.length === 0) {
      return '';
    }

    const subtasksDuration = task.subtasks.reduce((sum, subtask) => {
      return sum + (subtask.duration || 0);
    }, 0);

    // サブタスクに時間が設定されていない場合は表示しない
    if (subtasksDuration === 0) {
      return '';
    }

    const totalDuration = task.duration || subtasksDuration;
    const usedPercent = Math.min((subtasksDuration / totalDuration) * 100, 100);
    const remainingTime = totalDuration - subtasksDuration;

    return `
      <div class="main-task-gauge">
        <div class="gauge-bar">
          <div class="gauge-fill" style="width: ${usedPercent}%"></div>
        </div>
        <div class="gauge-text">
          残り: ${this.formatDuration(remainingTime)}
        </div>
      </div>
    `;
  },

  renderSubtasks(subtasks, taskId) {
    const subtasksHtml = (subtasks && subtasks.length > 0)
      ? subtasks.map((subtask, index) => {
          const completedClass = subtask.completed ? 'completed' : '';
          const durationText = subtask.duration ? `<span class="subtask-duration">${this.formatDuration(subtask.duration)}</span>` : '';
          return `
            <div class="subtask-item">
              <div class="subtask-checkbox ${completedClass}" data-task-id="${taskId}" data-subtask-index="${index}"></div>
              <div class="subtask-name ${completedClass}" data-task-id="${taskId}" data-subtask-index="${index}">${this.escapeHtml(subtask.name)}</div>
              ${durationText}
            </div>
          `;
        }).join('')
      : '';

    return `
      <div class="subtasks">
        ${subtasksHtml}
        <button class="add-subtask-inline-btn" data-task-id="${taskId}" title="サブタスクを追加">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span class="add-subtask-label">サブタスクを追加</span>
        </button>
        <div class="subtask-quick-input" data-task-id="${taskId}" style="display: none;">
          <input type="text" class="subtask-quick-input-field" placeholder="サブタスク名を入力" />
          <button class="subtask-quick-save">追加</button>
          <button class="subtask-quick-cancel">×</button>
        </div>
      </div>
    `;
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
        e.stopPropagation();
        const taskId = e.currentTarget.dataset.taskId;
        this.showTaskContextMenu(e.currentTarget, taskId);
      });
    });

    // 日付グループの追加ボタン
    const dateAddBtns = document.querySelectorAll('.date-add-task-btn');
    dateAddBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const dateString = e.currentTarget.dataset.date;
        const date = new Date(dateString);
        this.showTaskMenu(null, date);
      });
    });

    // サブタスク追加ボタン
    const addSubtaskBtns = document.querySelectorAll('.add-subtask-inline-btn');
    addSubtaskBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const taskId = e.currentTarget.dataset.taskId;
        this.showSubtaskQuickInput(taskId);
      });
    });

    // サブタスククイック追加の保存
    const subtaskSaveBtns = document.querySelectorAll('.subtask-quick-save');
    subtaskSaveBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const container = e.currentTarget.closest('.subtask-quick-input');
        const taskId = container.dataset.taskId;
        const input = container.querySelector('.subtask-quick-input-field');
        this.addSubtaskInline(taskId, input.value.trim());
      });
    });

    // サブタスククイック追加のキャンセル
    const subtaskCancelBtns = document.querySelectorAll('.subtask-quick-cancel');
    subtaskCancelBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const container = e.currentTarget.closest('.subtask-quick-input');
        this.hideSubtaskQuickInput(container);
      });
    });

    // サブタスククイック追加のEnterキー・Escキー
    const subtaskInputs = document.querySelectorAll('.subtask-quick-input-field');
    subtaskInputs.forEach(input => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          const container = e.currentTarget.closest('.subtask-quick-input');
          const taskId = container.dataset.taskId;
          this.addSubtaskInline(taskId, e.target.value.trim());
        } else if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          const container = e.currentTarget.closest('.subtask-quick-input');
          this.hideSubtaskQuickInput(container);
        }
      });
    });

    // サブタスクのチェックボックス
    const subtaskCheckboxes = document.querySelectorAll('.subtask-checkbox');
    subtaskCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('click', (e) => {
        e.stopPropagation();
        const taskId = e.currentTarget.dataset.taskId;
        const subtaskIndex = parseInt(e.currentTarget.dataset.subtaskIndex);
        this.toggleSubtaskComplete(taskId, subtaskIndex);
      });
    });

    // サブタスク名のクリック
    const subtaskNames = document.querySelectorAll('.subtask-name');
    subtaskNames.forEach(nameEl => {
      nameEl.addEventListener('click', (e) => {
        const taskId = e.currentTarget.dataset.taskId;
        const subtaskIndex = parseInt(e.currentTarget.dataset.subtaskIndex);
        this.showSubtaskDetail(taskId, subtaskIndex);
      });
    });
  },

  showSubtaskQuickInput(taskId) {
    const taskItem = document.querySelector(`.task-item[data-task-id="${taskId}"]`);
    if (!taskItem) return;

    const addBtn = taskItem.querySelector('.add-subtask-inline-btn');
    const quickInput = taskItem.querySelector('.subtask-quick-input');

    if (addBtn) addBtn.style.display = 'none';
    if (quickInput) {
      quickInput.style.display = 'flex';
      const input = quickInput.querySelector('.subtask-quick-input-field');
      if (input) input.focus();

      // 外側をタップしたらキャンセル（スマホ対応）
      setTimeout(() => {
        const handleOutsideClick = (e) => {
          if (!quickInput.contains(e.target)) {
            this.hideSubtaskQuickInput(quickInput);
            document.removeEventListener('click', handleOutsideClick);
          }
        };
        document.addEventListener('click', handleOutsideClick);
      }, 0);
    }
  },

  hideSubtaskQuickInput(container) {
    const taskId = container.dataset.taskId;
    const taskItem = document.querySelector(`.task-item[data-task-id="${taskId}"]`);
    if (!taskItem) return;

    const addBtn = taskItem.querySelector('.add-subtask-inline-btn');
    const input = container.querySelector('.subtask-quick-input-field');

    if (container) container.style.display = 'none';
    if (addBtn) addBtn.style.display = 'flex';
    if (input) input.value = '';
  },

  showTaskContextMenu(button, taskId) {
    // 既存のメニューを削除
    const existingMenu = document.querySelector('.task-context-menu');
    if (existingMenu) {
      existingMenu.remove();
    }

    // メニューを作成
    const menu = document.createElement('div');
    menu.className = 'task-context-menu';
    menu.innerHTML = `
      <div class="context-menu-item" data-action="edit">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
        <span>編集</span>
      </div>
      <div class="context-menu-item" data-action="duplicate">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <span>複製</span>
      </div>
      <div class="context-menu-item danger" data-action="delete">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
        <span>削除</span>
      </div>
    `;

    // ボタンの位置を取得
    const rect = button.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.top = `${rect.bottom + 5}px`;
    menu.style.left = `${rect.left - 120}px`; // メニュー幅150pxの80%左に

    document.body.appendChild(menu);

    // メニューアイテムのクリックイベント
    menu.querySelectorAll('.context-menu-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;

        if (action === 'edit') {
          this.showTaskMenu(taskId);
        } else if (action === 'duplicate') {
          this.duplicateTask(taskId);
        } else if (action === 'delete') {
          this.deleteTask(taskId);
        }

        menu.remove();
      });
    });

    // 外側クリックでメニューを閉じる
    setTimeout(() => {
      const closeMenu = (e) => {
        if (!menu.contains(e.target)) {
          menu.remove();
          document.removeEventListener('click', closeMenu);
        }
      };
      document.addEventListener('click', closeMenu);
    }, 0);
  },

  duplicateTask(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
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

    this.tasks.push(newTask);
    Storage.saveTasks(this.tasks);

    this.renderTasks();
    Gauge.updateGauge();
    if (window.Calendar) Calendar.renderCalendar();

    console.log('タスクを複製しました:', newTask.name);
  }
});
