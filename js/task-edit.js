const TaskEditor = {
  currentTaskId: null,
  currentTask: null,
  MAX_SUBTASK_LEVEL: 5, // 仕様書 6.4.1: サブタスクの階層は5階層まで

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
      durationInput.addEventListener('change', () => {
        this.calculateEndTime();
        this.checkSubtaskTimeWarning();
      });
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

  openModal(taskId, defaultDate) {
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
      this.clearForm(defaultDate);
    }

    const modal = document.getElementById('taskEditModal');
    if (modal) {
      modal.style.display = 'flex';
    }

    // モーダルが開いた後、ボタンのイベントリスナーを設定
    this.setupQuickActionButtons();
  },

  setupQuickActionButtons() {
    const applyTemplateBtn = document.getElementById('applyTemplateBtn');
    const applyPatternBtn = document.getElementById('applyPatternBtn');

    if (applyTemplateBtn) {
      // 既存のイベントリスナーを削除して再設定
      const newTemplateBtn = applyTemplateBtn.cloneNode(true);
      applyTemplateBtn.parentNode.replaceChild(newTemplateBtn, applyTemplateBtn);

      newTemplateBtn.addEventListener('click', () => {
        this.showTemplateSelectionModal();
      });
    }

    if (applyPatternBtn) {
      // 既存のイベントリスナーを削除して再設定
      const newPatternBtn = applyPatternBtn.cloneNode(true);
      applyPatternBtn.parentNode.replaceChild(newPatternBtn, applyPatternBtn);

      newPatternBtn.addEventListener('click', () => {
        this.showPatternSelectionModal();
      });
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
    if (durationInput) {
      durationInput.value = task.duration ? task.duration.toString() : '';
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

  clearForm(defaultDate) {
    // 新規タスク用のcurrentTaskオブジェクトを初期化
    this.currentTask = {
      tags: [],
      subtasks: []
    };

    // タスク名
    const taskNameInput = document.getElementById('editTaskName');
    if (taskNameInput) {
      taskNameInput.value = '';
    }

    // 開始時刻（デフォルト日付がある場合は設定）
    const startTimeInput = document.getElementById('editStartTime');
    if (startTimeInput) {
      if (defaultDate) {
        // デフォルト日付の9:00に設定
        const date = new Date(defaultDate);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        startTimeInput.value = `${year}-${month}-${day}T09:00`;
      } else {
        startTimeInput.value = '';
      }
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
      // 計算された時間に最も近いプルダウンの選択肢を探す
      const options = Array.from(durationInput.options);
      let closestOption = options.find(opt => opt.value && parseInt(opt.value) >= diffMinutes);

      if (closestOption) {
        durationInput.value = closestOption.value;
      } else {
        // 最大値より大きい場合は最大値を選択
        const maxOption = options[options.length - 1];
        durationInput.value = maxOption.value;
      }
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
        <input
          type="number"
          class="subtask-duration-input"
          value="${subtask.duration || ''}"
          data-index="${index}"
          placeholder="分"
          min="0"
        >
        <button type="button" class="subtask-remove" data-index="${index}">×</button>
      </div>
    `).join('');

    // サブタスク名更新イベント
    const inputs = subtaskList.querySelectorAll('.subtask-edit-input');
    inputs.forEach(input => {
      input.addEventListener('input', (e) => {
        const index = parseInt(e.target.dataset.index);
        if (this.currentTask.subtasks[index]) {
          this.currentTask.subtasks[index].name = e.target.value;
        }
      });
    });

    // サブタスク時間更新イベント
    const durationInputs = subtaskList.querySelectorAll('.subtask-duration-input');
    durationInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        const index = parseInt(e.target.dataset.index);
        if (this.currentTask.subtasks[index]) {
          const value = parseInt(e.target.value);
          this.currentTask.subtasks[index].duration = value > 0 ? value : null;
          this.checkSubtaskTimeWarning();
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

    // サブタスクの階層チェック（現在は1階層のみ追加可能）
    // 将来的に階層的なサブタスク追加UIを実装する際は、
    // calculateSubtaskDepth()を使用して階層数をチェックする
    const currentDepth = this.calculateSubtaskDepth(this.currentTask);
    if (currentDepth >= this.MAX_SUBTASK_LEVEL) {
      alert(`サブタスクは${this.MAX_SUBTASK_LEVEL}階層までです`);
      return;
    }

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

  checkSubtaskTimeWarning() {
    if (!this.currentTask) return;

    const durationInput = document.getElementById('editDuration');
    const mainTaskDuration = durationInput.value ? parseInt(durationInput.value) : null;

    if (!mainTaskDuration) return;

    const subtaskTotalDuration = this.calculateSubtaskTotalDuration(this.currentTask.subtasks);

    const warningEl = document.getElementById('subtaskTimeWarning');
    if (!warningEl) return;

    if (subtaskTotalDuration > mainTaskDuration) {
      warningEl.style.display = 'block';
      warningEl.textContent = `⚠ サブタスクの合計時間（${subtaskTotalDuration}分）がメインタスクの時間（${mainTaskDuration}分）を超えています`;
    } else {
      warningEl.style.display = 'none';
    }
  },

  calculateSubtaskTotalDuration(subtasks) {
    if (!subtasks || subtasks.length === 0) return 0;

    return subtasks.reduce((total, subtask) => {
      return total + (subtask.duration || 0);
    }, 0);
  },

  /**
   * サブタスクの階層数を計算（再帰的）
   * メインタスク = 0, 直下のサブタスク = 1, その下 = 2, ...
   * @param {Object} task - タスクまたはサブタスク
   * @param {number} currentDepth - 現在の階層（デフォルト0）
   * @returns {number} 最大階層数
   */
  calculateSubtaskDepth(task, currentDepth = 0) {
    if (!task.subtasks || task.subtasks.length === 0) {
      return currentDepth;
    }

    let maxDepth = currentDepth;
    task.subtasks.forEach(subtask => {
      const depth = this.calculateSubtaskDepth(subtask, currentDepth + 1);
      if (depth > maxDepth) {
        maxDepth = depth;
      }
    });

    return maxDepth;
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  showTemplateSelectionModal() {
    if (typeof TemplateManager === 'undefined' || !TemplateManager.templates) {
      alert('テンプレートが見つかりません');
      return;
    }

    const templates = TemplateManager.templates;
    if (templates.length === 0) {
      alert('テンプレートがありません。先にテンプレートを作成してください。');
      return;
    }

    // カテゴリごとにグループ化
    const categories = {};
    templates.forEach(template => {
      if (!categories[template.category]) {
        categories[template.category] = [];
      }
      categories[template.category].push(template);
    });

    // モーダルを作成
    const categoriesHtml = Object.keys(categories).map(category => `
      <div class="template-category-section">
        <div class="template-category-title">${category}</div>
        <div class="template-items">
          ${categories[category].map(template => `
            <div class="template-selection-item" data-template-id="${template.id}">
              <div class="template-item-name">${this.escapeHtml(template.name)}</div>
              <div class="template-item-duration">${template.duration ? template.duration + '分' : ''}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');

    const modalHtml = `
      <div class="modal" id="templateSelectionModal" style="display: flex;">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title">テンプレートを選択</h2>
            <button class="modal-close-btn" id="templateSelectionCloseBtn">×</button>
          </div>
          <div class="modal-body">
            ${categoriesHtml}
          </div>
        </div>
      </div>
    `;

    // モーダルを挿入
    const existingModal = document.getElementById('templateSelectionModal');
    if (existingModal) {
      existingModal.remove();
    }
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // イベントリスナーを設定
    const modal = document.getElementById('templateSelectionModal');
    const closeBtn = document.getElementById('templateSelectionCloseBtn');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.remove();
      });
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.remove();
        }
      });
    }

    // テンプレート選択
    const templateItems = document.querySelectorAll('.template-selection-item');
    templateItems.forEach(item => {
      item.addEventListener('click', () => {
        const templateId = item.dataset.templateId;
        this.applyTemplate(templateId);
        modal.remove();
      });
    });
  },

  applyTemplate(templateId) {
    const template = TemplateManager.templates.find(t => t.id === templateId);
    if (!template) return;

    // フォームにテンプレートの値を適用
    const taskNameInput = document.getElementById('editTaskName');
    const durationInput = document.getElementById('editDuration');
    const tagInput = document.getElementById('tagInput');

    if (taskNameInput && !taskNameInput.value) {
      taskNameInput.value = template.name;
    }

    if (durationInput && template.duration) {
      durationInput.value = template.duration;
      this.calculateEndTime();
    }

    if (template.tags && template.tags.length > 0) {
      template.tags.forEach(tag => {
        if (!this.currentTask.tags.includes(tag)) {
          this.addTag(tag);
        }
      });
    }

    console.log('テンプレートを適用しました:', template.name);
  },

  showPatternSelectionModal() {
    if (typeof MultiDayPatternManager === 'undefined' || !MultiDayPatternManager.patterns) {
      alert('パターンが見つかりません');
      return;
    }

    const patterns = MultiDayPatternManager.patterns;
    if (patterns.length === 0) {
      alert('パターンがありません。先にパターンを作成してください。');
      return;
    }

    const modalHtml = `
      <div class="modal" id="patternSelectionModalInEdit" style="display: flex;">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title">複数日パターンを選択</h2>
            <button class="modal-close-btn" id="patternSelectionInEditCloseBtn">×</button>
          </div>
          <div class="modal-body">
            <div class="pattern-selection-list">
              ${patterns.map(pattern => `
                <div class="pattern-selection-item" data-pattern-id="${pattern.id}">
                  <div class="pattern-item-header">
                    <div class="pattern-item-name">${this.escapeHtml(pattern.name)}</div>
                    <div class="pattern-item-days">${pattern.days}日間</div>
                  </div>
                  <div class="pattern-item-summary">
                    ${pattern.dayPatterns.map((day, idx) =>
                      `<span class="pattern-day-label">Day${idx + 1}: ${this.escapeHtml(day.label || '')} (${day.tasks.length}タスク)</span>`
                    ).join(' ')}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    // モーダルを挿入
    const existingModal = document.getElementById('patternSelectionModalInEdit');
    if (existingModal) {
      existingModal.remove();
    }
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // イベントリスナーを設定
    const modal = document.getElementById('patternSelectionModalInEdit');
    const closeBtn = document.getElementById('patternSelectionInEditCloseBtn');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.remove();
      });
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.remove();
        }
      });
    }

    // パターン選択
    const patternItems = document.querySelectorAll('#patternSelectionModalInEdit .pattern-selection-item');
    patternItems.forEach(item => {
      item.addEventListener('click', () => {
        const patternId = item.dataset.patternId;
        this.applyPattern(patternId);
        modal.remove();
      });
    });
  },

  applyPattern(patternId) {
    const startTimeInput = document.getElementById('editStartTime');
    const startDate = startTimeInput.value ? new Date(startTimeInput.value).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    const tasksToAdd = MultiDayPatternManager.applyPatternToDate(patternId, startDate);

    if (!tasksToAdd || tasksToAdd.length === 0) {
      alert('パターンの適用に失敗しました');
      return;
    }

    // タスクを追加
    TaskManager.tasks.push(...tasksToAdd);
    Storage.saveTasks(TaskManager.tasks);

    // 表示を更新
    TaskManager.renderTasks();
    Gauge.updateGauge();
    if (window.Calendar) Calendar.renderCalendar();

    const pattern = MultiDayPatternManager.patterns.find(p => p.id === patternId);
    alert(`パターン「${pattern.name}」を適用しました\n${tasksToAdd.length}個のタスクを追加しました`);

    // モーダルを閉じる
    this.closeModal();

    console.log('パターンを適用しました:', pattern.name, tasksToAdd);
  }
};
