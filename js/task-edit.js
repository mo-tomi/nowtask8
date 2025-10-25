const TaskEditor = {
  currentTaskId: null,
  currentTask: null,

  init() {
    this.setupEventListeners();
  },

  setupEventListeners() {
    const modal = document.getElementById('taskEditModal');
    const closeBtn = document.getElementById('modalCloseBtn');
    const form = document.getElementById('taskEditForm');
    const deleteBtn = document.getElementById('deleteTaskBtn');
    const addSubtaskBtn = document.getElementById('addSubtaskBtn');
    const tagInput = document.getElementById('tagInput');
    const priorityBtns = document.querySelectorAll('.priority-btn');

    // 時間入力の自動計算
    const startTimeInput = document.getElementById('editStartTime');
    const endTimeInput = document.getElementById('editEndTime');
    const durationInput = document.getElementById('editDuration');

    if (startTimeInput && endTimeInput) {
      startTimeInput.addEventListener('change', () => this.calculateDuration());
      endTimeInput.addEventListener('change', () => this.calculateDuration());
    }

    if (durationInput) {
      durationInput.addEventListener('change', () => this.calculateEndTime());
    }

    // モーダルを閉じる
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeModal());
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeModal();
        }
      });
    }

    // フォーム送信
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveTask();
      });
    }

    // 削除ボタン
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        if (confirm('このタスクを削除しますか？')) {
          TaskManager.deleteTask(this.currentTaskId);
          this.closeModal();
        }
      });
    }

    // サブタスク追加
    if (addSubtaskBtn) {
      addSubtaskBtn.addEventListener('click', () => {
        this.addSubtaskInput();
      });
    }

    // タグ入力
    if (tagInput) {
      tagInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.addTag(tagInput.value.trim());
          tagInput.value = '';
        }
      });
    }

    // 優先度ボタン
    priorityBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        priorityBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  },

  openModal(taskId) {
    this.currentTaskId = taskId;

    if (taskId) {
      // 既存タスクの編集
      const task = TaskManager.tasks.find(t => t.id === taskId);
      if (!task) return;
      this.currentTask = task;
      this.populateForm(task);
    } else {
      // 新規タスクの追加
      this.currentTask = null;
      this.clearForm();
    }

    const modal = document.getElementById('taskEditModal');
    if (modal) {
      modal.style.display = 'flex';
    }
  },

  closeModal() {
    const modal = document.getElementById('taskEditModal');
    if (modal) {
      modal.style.display = 'none';
    }
    this.currentTaskId = null;
    this.currentTask = null;
  },

  populateForm(task) {
    // タスク名
    const taskNameInput = document.getElementById('editTaskName');
    if (taskNameInput) {
      taskNameInput.value = task.name;
    }

    // 開始時刻
    const startTimeInput = document.getElementById('editStartTime');
    if (startTimeInput && task.startTime) {
      startTimeInput.value = this.formatDateTimeLocal(task.startTime);
    }

    // 終了時刻
    const endTimeInput = document.getElementById('editEndTime');
    if (endTimeInput && task.endTime) {
      endTimeInput.value = this.formatDateTimeLocal(task.endTime);
    }

    // 所要時間
    const durationInput = document.getElementById('editDuration');
    if (durationInput && task.duration) {
      durationInput.value = task.duration;
    }

    // 優先度
    const priorityBtns = document.querySelectorAll('.priority-btn');
    priorityBtns.forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.priority === (task.priority || '')) {
        btn.classList.add('active');
      }
    });

    // タグ
    this.renderTags(task.tags || []);

    // サブタスク
    this.renderSubtasks(task.subtasks || []);
  },

  clearForm() {
    // タスク名
    const taskNameInput = document.getElementById('editTaskName');
    if (taskNameInput) {
      taskNameInput.value = '';
    }

    // 開始時刻
    const startTimeInput = document.getElementById('editStartTime');
    if (startTimeInput) {
      startTimeInput.value = '';
    }

    // 終了時刻
    const endTimeInput = document.getElementById('editEndTime');
    if (endTimeInput) {
      endTimeInput.value = '';
    }

    // 所要時間
    const durationInput = document.getElementById('editDuration');
    if (durationInput) {
      durationInput.value = '';
    }

    // 優先度
    const priorityBtns = document.querySelectorAll('.priority-btn');
    priorityBtns.forEach(btn => {
      btn.classList.remove('active');
    });
    // デフォルトで「なし」を選択
    const noneBtn = document.querySelector('.priority-btn[data-priority=""]');
    if (noneBtn) {
      noneBtn.classList.add('active');
    }

    // タグ
    this.renderTags([]);

    // サブタスク
    this.renderSubtasks([]);
  },

  formatDateTimeLocal(isoString) {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  },

  calculateDuration() {
    const startTimeInput = document.getElementById('editStartTime');
    const endTimeInput = document.getElementById('editEndTime');
    const durationInput = document.getElementById('editDuration');

    if (!startTimeInput.value || !endTimeInput.value) return;

    const start = new Date(startTimeInput.value);
    const end = new Date(endTimeInput.value);
    const diffMinutes = Math.round((end - start) / 1000 / 60);

    if (diffMinutes > 0) {
      durationInput.value = diffMinutes;
    }
  },

  calculateEndTime() {
    const startTimeInput = document.getElementById('editStartTime');
    const endTimeInput = document.getElementById('editEndTime');
    const durationInput = document.getElementById('editDuration');

    if (!startTimeInput.value || !durationInput.value) return;

    const start = new Date(startTimeInput.value);
    const duration = parseInt(durationInput.value);
    const end = new Date(start.getTime() + duration * 60 * 1000);

    endTimeInput.value = this.formatDateTimeLocal(end.toISOString());
  },

  renderTags(tags) {
    const tagList = document.getElementById('tagList');
    if (!tagList) return;

    tagList.innerHTML = tags.map(tag => `
      <div class="tag-item">
        <span>${this.escapeHtml(tag)}</span>
        <button type="button" class="tag-remove" data-tag="${this.escapeHtml(tag)}">×</button>
      </div>
    `).join('');

    // タグ削除イベント
    const removeButtons = tagList.querySelectorAll('.tag-remove');
    removeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.removeTag(btn.dataset.tag);
      });
    });
  },

  addTag(tag) {
    if (!tag || !this.currentTask) return;
    if (this.currentTask.tags.includes(tag)) return;

    this.currentTask.tags.push(tag);
    this.renderTags(this.currentTask.tags);
  },

  removeTag(tag) {
    if (!this.currentTask) return;
    this.currentTask.tags = this.currentTask.tags.filter(t => t !== tag);
    this.renderTags(this.currentTask.tags);
  },

  renderSubtasks(subtasks) {
    const subtaskList = document.getElementById('subtaskList');
    if (!subtaskList) return;

    subtaskList.innerHTML = subtasks.map((subtask, index) => `
      <div class="subtask-edit-item">
        <input
          type="text"
          class="subtask-edit-input"
          value="${this.escapeHtml(subtask.name)}"
          data-index="${index}"
          placeholder="サブタスク名"
        >
        <button type="button" class="subtask-remove" data-index="${index}">×</button>
      </div>
    `).join('');

    // サブタスク更新イベント
    const inputs = subtaskList.querySelectorAll('.subtask-edit-input');
    inputs.forEach(input => {
      input.addEventListener('input', (e) => {
        const index = parseInt(e.target.dataset.index);
        if (this.currentTask.subtasks[index]) {
          this.currentTask.subtasks[index].name = e.target.value;
        }
      });
    });

    // サブタスク削除イベント
    const removeButtons = subtaskList.querySelectorAll('.subtask-remove');
    removeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        this.removeSubtask(index);
      });
    });
  },

  addSubtaskInput() {
    if (!this.currentTask) return;

    const newSubtask = {
      id: `subtask_${Date.now()}`,
      name: '',
      completed: false,
      duration: null,
      subtasks: []
    };

    this.currentTask.subtasks.push(newSubtask);
    this.renderSubtasks(this.currentTask.subtasks);

    // 最後の入力欄にフォーカス
    const subtaskList = document.getElementById('subtaskList');
    const inputs = subtaskList.querySelectorAll('.subtask-edit-input');
    if (inputs.length > 0) {
      inputs[inputs.length - 1].focus();
    }
  },

  removeSubtask(index) {
    if (!this.currentTask) return;
    this.currentTask.subtasks.splice(index, 1);
    this.renderSubtasks(this.currentTask.subtasks);
  },

  saveTask() {
    const taskNameInput = document.getElementById('editTaskName');
    const startTimeInput = document.getElementById('editStartTime');
    const endTimeInput = document.getElementById('editEndTime');
    const durationInput = document.getElementById('editDuration');

    if (!taskNameInput.value.trim()) {
      alert('タスク名を入力してください');
      return;
    }

    if (this.currentTaskId) {
      // 既存タスクの編集
      const task = TaskManager.tasks.find(t => t.id === this.currentTaskId);
      if (!task) return;

      // タスク名
      task.name = taskNameInput.value.trim();

      // 時間設定
      task.startTime = startTimeInput.value ? new Date(startTimeInput.value).toISOString() : null;
      task.endTime = endTimeInput.value ? new Date(endTimeInput.value).toISOString() : null;
      task.duration = durationInput.value ? parseInt(durationInput.value) : null;

      // 優先度
      const activePriorityBtn = document.querySelector('.priority-btn.active');
      task.priority = activePriorityBtn ? activePriorityBtn.dataset.priority : null;

      // タグ
      task.tags = this.currentTask.tags;

      // サブタスク（空のものは削除）
      task.subtasks = this.currentTask.subtasks.filter(s => s.name.trim());

      // 更新日時
      task.updatedAt = new Date().toISOString();

      console.log('タスクを更新しました:', task);
    } else {
      // 新規タスクの追加
      const now = new Date().toISOString();
      const taskId = 'task_' + Date.now();

      const newTask = {
        id: taskId,
        name: taskNameInput.value.trim(),
        startTime: startTimeInput.value ? new Date(startTimeInput.value).toISOString() : null,
        endTime: endTimeInput.value ? new Date(endTimeInput.value).toISOString() : null,
        duration: durationInput.value ? parseInt(durationInput.value) : null,
        priority: null,
        tags: this.currentTask ? this.currentTask.tags : [],
        completed: false,
        completedAt: null,
        createdAt: now,
        updatedAt: now,
        subtasks: this.currentTask ? this.currentTask.subtasks.filter(s => s.name.trim()) : []
      };

      // 優先度
      const activePriorityBtn = document.querySelector('.priority-btn.active');
      newTask.priority = activePriorityBtn ? activePriorityBtn.dataset.priority : null;

      TaskManager.tasks.push(newTask);
      console.log('タスクを追加しました:', newTask);
    }

    // 保存
    Storage.saveTasks(TaskManager.tasks);
    TaskManager.renderTasks();
    Gauge.updateGauge();
    if (typeof Calendar !== 'undefined' && Calendar.renderCalendar) {
      Calendar.renderCalendar();
    }

    this.closeModal();
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};
