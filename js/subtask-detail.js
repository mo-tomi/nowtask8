const SubtaskDetail = {
  currentTaskId: null,
  currentSubtaskIndex: null,
  currentTask: null,

  init() {
    this.setupEventListeners();
  },

  setupEventListeners() {
    const modal = document.getElementById('subtaskDetailModal');
    const closeBtn = document.getElementById('subtaskDetailCloseBtn');
    const form = document.getElementById('subtaskDetailForm');
    const deleteBtn = document.getElementById('deleteSubtaskBtn');

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
        this.saveSubtask();
      });
    }

    // 削除ボタン
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        if (confirm('このサブタスクを削除しますか？')) {
          this.deleteSubtask();
        }
      });
    }
  },

  openModal(taskId, subtaskIndex) {
    this.currentTaskId = taskId;
    this.currentSubtaskIndex = subtaskIndex;

    const task = TaskManager.tasks.find(t => t.id === taskId);
    if (!task) return;

    this.currentTask = task;
    const subtask = task.subtasks[subtaskIndex];
    if (!subtask) return;

    this.populateForm(subtask);

    const modal = document.getElementById('subtaskDetailModal');
    if (modal) {
      modal.style.display = 'flex';
    }
  },

  closeModal() {
    const modal = document.getElementById('subtaskDetailModal');
    if (modal) {
      modal.style.display = 'none';
    }

    this.currentTaskId = null;
    this.currentSubtaskIndex = null;
    this.currentTask = null;
  },

  populateForm(subtask) {
    const nameInput = document.getElementById('editSubtaskName');
    const durationInput = document.getElementById('editSubtaskDuration');

    if (nameInput) nameInput.value = subtask.name || '';
    if (durationInput) durationInput.value = subtask.duration || '';
  },

  saveSubtask() {
    const nameInput = document.getElementById('editSubtaskName');
    const durationInput = document.getElementById('editSubtaskDuration');

    if (!nameInput.value.trim()) {
      alert('サブタスク名を入力してください');
      return;
    }

    if (!this.currentTask || this.currentSubtaskIndex === null) return;

    const subtask = this.currentTask.subtasks[this.currentSubtaskIndex];
    if (!subtask) return;

    // サブタスク情報を更新
    subtask.name = nameInput.value.trim();
    subtask.duration = durationInput.value ? parseInt(durationInput.value) : null;

    // タスクの更新日時を更新
    this.currentTask.updatedAt = new Date().toISOString();

    // 保存
    Storage.saveTasks(TaskManager.tasks);
    TaskManager.renderTasks();

    console.log('サブタスクを更新しました:', subtask);

    this.closeModal();
  },

  deleteSubtask() {
    if (!this.currentTask || this.currentSubtaskIndex === null) return;

    // サブタスクを削除
    this.currentTask.subtasks.splice(this.currentSubtaskIndex, 1);

    // タスクの更新日時を更新
    this.currentTask.updatedAt = new Date().toISOString();

    // 保存
    Storage.saveTasks(TaskManager.tasks);
    TaskManager.renderTasks();

    console.log('サブタスクを削除しました');

    this.closeModal();
  }
};
