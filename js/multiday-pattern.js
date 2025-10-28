// multiday-pattern.js - 複数日パターン管理

const MultiDayPatternManager = {
  patterns: [],
  currentPatternId: null,

  init() {
    console.log('MultiDayPatternManager を初期化しました');
    this.patterns = Storage.loadMultiDayPatterns();
    this.setupEventListeners();
  },

  setupEventListeners() {
    const managePatternsBtn = document.getElementById('manageMultiDayPatternsBtn');
    const patternModal = document.getElementById('multiDayPatternModal');
    const patternCloseBtn = document.getElementById('multiDayPatternCloseBtn');
    const addPatternBtn = document.getElementById('addMultiDayPatternBtn');
    const patternEditModal = document.getElementById('multiDayPatternEditModal');
    const patternEditCloseBtn = document.getElementById('multiDayPatternEditCloseBtn');
    const patternEditForm = document.getElementById('multiDayPatternEditForm');
    const deletePatternBtn = document.getElementById('deleteMultiDayPatternBtn');

    if (managePatternsBtn) {
      managePatternsBtn.addEventListener('click', () => {
        this.openPatternModal();
      });
    }

    if (patternCloseBtn) {
      patternCloseBtn.addEventListener('click', () => {
        this.closePatternModal();
      });
    }

    if (patternModal) {
      patternModal.addEventListener('click', (e) => {
        if (e.target === patternModal) {
          this.closePatternModal();
        }
      });
    }

    if (addPatternBtn) {
      addPatternBtn.addEventListener('click', () => {
        this.openPatternEditModal();
      });
    }

    if (patternEditCloseBtn) {
      patternEditCloseBtn.addEventListener('click', () => {
        this.closePatternEditModal();
      });
    }

    if (patternEditModal) {
      patternEditModal.addEventListener('click', (e) => {
        if (e.target === patternEditModal) {
          this.closePatternEditModal();
        }
      });
    }

    if (patternEditForm) {
      patternEditForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.savePattern();
      });
    }

    if (deletePatternBtn) {
      deletePatternBtn.addEventListener('click', () => {
        if (confirm('このパターンを削除しますか？')) {
          this.deletePattern();
        }
      });
    }
  },

  openPatternModal() {
    this.renderPatternList();
    const modal = document.getElementById('multiDayPatternModal');
    if (modal) {
      modal.style.display = 'flex';
    }
  },

  closePatternModal() {
    const modal = document.getElementById('multiDayPatternModal');
    if (modal) {
      modal.style.display = 'none';
    }
  },

  renderPatternList() {
    const container = document.getElementById('multiDayPatternList');
    if (!container) return;

    if (this.patterns.length === 0) {
      container.innerHTML = '<div class="empty-state-text">パターンがありません</div>';
      return;
    }

    const html = this.patterns.map(pattern => this.renderPatternItem(pattern)).join('');
    container.innerHTML = html;

    // イベントリスナーを設定
    container.querySelectorAll('.pattern-item').forEach(item => {
      item.addEventListener('click', () => {
        const patternId = item.dataset.patternId;
        this.openPatternEditModal(patternId);
      });
    });
  },

  renderPatternItem(pattern) {
    return `
      <div class="pattern-item" data-pattern-id="${pattern.id}">
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
    `;
  },

  openPatternEditModal(patternId = null) {
    this.currentPatternId = patternId;

    if (patternId) {
      const pattern = this.patterns.find(p => p.id === patternId);
      if (!pattern) return;
      this.populatePatternForm(pattern);
      document.getElementById('deleteMultiDayPatternBtn').style.display = 'block';
    } else {
      this.clearPatternForm();
      document.getElementById('deleteMultiDayPatternBtn').style.display = 'none';
    }

    const modal = document.getElementById('multiDayPatternEditModal');
    if (modal) {
      modal.style.display = 'flex';
    }
  },

  closePatternEditModal() {
    const modal = document.getElementById('multiDayPatternEditModal');
    if (modal) {
      modal.style.display = 'none';
    }
    this.currentPatternId = null;
  },

  populatePatternForm(pattern) {
    document.getElementById('editPatternName').value = pattern.name;
    document.getElementById('editPatternDays').value = pattern.days;
    this.renderDayPatternsEdit(pattern.dayPatterns);
  },

  clearPatternForm() {
    document.getElementById('editPatternName').value = '';
    document.getElementById('editPatternDays').value = '2';
    this.renderDayPatternsEdit([
      { dayNumber: 1, label: '', tasks: [] },
      { dayNumber: 2, label: '', tasks: [] }
    ]);
  },

  renderDayPatternsEdit(dayPatterns) {
    const container = document.getElementById('dayPatternsContainer');
    if (!container) return;

    const html = dayPatterns.map((day, idx) => this.renderDayPatternEdit(day, idx)).join('');
    container.innerHTML = html;

    // 日数変更イベント
    const daysInput = document.getElementById('editPatternDays');
    if (daysInput) {
      daysInput.addEventListener('change', () => {
        this.updateDayPatternsCount(parseInt(daysInput.value));
      });
    }

    // タスク追加ボタンイベント
    container.querySelectorAll('.add-pattern-task-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const dayIndex = parseInt(btn.dataset.dayIndex);
        this.addTaskToDay(dayIndex);
      });
    });

    // タスク削除ボタンイベント
    container.querySelectorAll('.remove-pattern-task-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const dayIndex = parseInt(btn.dataset.dayIndex);
        const taskIndex = parseInt(btn.dataset.taskIndex);
        this.removeTaskFromDay(dayIndex, taskIndex);
      });
    });
  },

  renderDayPatternEdit(day, dayIndex) {
    const tasksHtml = day.tasks.map((task, taskIndex) => `
      <div class="pattern-task-item">
        <input type="time" class="pattern-task-time" value="${task.time || ''}" data-day-index="${dayIndex}" data-task-index="${taskIndex}">
        <select class="pattern-task-template" data-day-index="${dayIndex}" data-task-index="${taskIndex}">
          <option value="">手動入力</option>
          ${TemplateManager.templates.map(t =>
            `<option value="${t.id}" ${task.templateId === t.id ? 'selected' : ''}>${this.escapeHtml(t.name)}</option>`
          ).join('')}
        </select>
        <input type="text" class="pattern-task-name" placeholder="タスク名" value="${this.escapeHtml(task.taskName || '')}" data-day-index="${dayIndex}" data-task-index="${taskIndex}" ${task.templateId ? 'disabled' : ''}>
        <button type="button" class="remove-pattern-task-btn" data-day-index="${dayIndex}" data-task-index="${taskIndex}">×</button>
      </div>
    `).join('');

    return `
      <div class="day-pattern-edit-section">
        <div class="day-pattern-header">
          <div class="day-pattern-number">Day ${dayIndex + 1}</div>
          <input type="text" class="day-pattern-label-input" placeholder="例: 夜勤明け" value="${this.escapeHtml(day.label || '')}" data-day-index="${dayIndex}">
        </div>
        <div class="pattern-tasks-list">
          ${tasksHtml}
        </div>
        <button type="button" class="add-pattern-task-btn" data-day-index="${dayIndex}">+ タスク追加</button>
      </div>
    `;
  },

  updateDayPatternsCount(newDays) {
    const container = document.getElementById('dayPatternsContainer');
    if (!container) return;

    const currentDayPatterns = this.getCurrentDayPatternsFromForm();
    const adjustedPatterns = [];

    for (let i = 0; i < newDays; i++) {
      if (i < currentDayPatterns.length) {
        adjustedPatterns.push(currentDayPatterns[i]);
      } else {
        adjustedPatterns.push({ dayNumber: i + 1, label: '', tasks: [] });
      }
    }

    this.renderDayPatternsEdit(adjustedPatterns);
  },

  getCurrentDayPatternsFromForm() {
    const container = document.getElementById('dayPatternsContainer');
    if (!container) return [];

    const dayPatterns = [];
    const sections = container.querySelectorAll('.day-pattern-edit-section');

    sections.forEach((section, dayIndex) => {
      const labelInput = section.querySelector('.day-pattern-label-input');
      const taskItems = section.querySelectorAll('.pattern-task-item');

      const tasks = [];
      taskItems.forEach((item) => {
        const time = item.querySelector('.pattern-task-time').value;
        const templateSelect = item.querySelector('.pattern-task-template');
        const taskNameInput = item.querySelector('.pattern-task-name');

        if (time) {
          tasks.push({
            time,
            templateId: templateSelect.value || null,
            taskName: templateSelect.value ? null : taskNameInput.value
          });
        }
      });

      dayPatterns.push({
        dayNumber: dayIndex + 1,
        label: labelInput ? labelInput.value : '',
        tasks
      });
    });

    return dayPatterns;
  },

  addTaskToDay(dayIndex) {
    const dayPatterns = this.getCurrentDayPatternsFromForm();
    dayPatterns[dayIndex].tasks.push({ time: '', templateId: null, taskName: '' });
    this.renderDayPatternsEdit(dayPatterns);
  },

  removeTaskFromDay(dayIndex, taskIndex) {
    const dayPatterns = this.getCurrentDayPatternsFromForm();
    dayPatterns[dayIndex].tasks.splice(taskIndex, 1);
    this.renderDayPatternsEdit(dayPatterns);
  },

  savePattern() {
    const name = document.getElementById('editPatternName').value.trim();
    const days = parseInt(document.getElementById('editPatternDays').value);

    if (!name) {
      alert('パターン名を入力してください');
      return;
    }

    const dayPatterns = this.getCurrentDayPatternsFromForm();
    const now = new Date().toISOString();

    if (this.currentPatternId) {
      // 既存パターンの編集
      const pattern = this.patterns.find(p => p.id === this.currentPatternId);
      if (!pattern) return;

      pattern.name = name;
      pattern.days = days;
      pattern.dayPatterns = dayPatterns;
      pattern.updatedAt = now;

      console.log('パターンを更新しました:', pattern);
    } else {
      // 新規パターンの作成
      const newPattern = {
        id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        days,
        dayPatterns,
        createdAt: now,
        updatedAt: now
      };

      this.patterns.push(newPattern);
      console.log('パターンを作成しました:', newPattern);
    }

    Storage.saveMultiDayPatterns(this.patterns);
    this.renderPatternList();
    this.closePatternEditModal();
  },

  deletePattern() {
    if (!this.currentPatternId) return;

    this.patterns = this.patterns.filter(p => p.id !== this.currentPatternId);
    Storage.saveMultiDayPatterns(this.patterns);

    console.log('パターンを削除しました');
    this.renderPatternList();
    this.closePatternEditModal();
  },

  // カレンダーからパターンを適用
  applyPatternToDate(patternId, startDate) {
    const pattern = this.patterns.find(p => p.id === patternId);
    if (!pattern) {
      console.error('パターンが見つかりません:', patternId);
      return;
    }

    const tasksToAdd = [];
    const baseDate = new Date(startDate);

    pattern.dayPatterns.forEach((dayPattern, dayOffset) => {
      const taskDate = new Date(baseDate);
      taskDate.setDate(taskDate.getDate() + dayOffset);
      const dateStr = taskDate.toISOString().split('T')[0];

      dayPattern.tasks.forEach(taskDef => {
        let taskName = taskDef.taskName;
        let duration = null;
        let tags = [];

        // テンプレートから情報を取得
        if (taskDef.templateId) {
          const template = TemplateManager.templates.find(t => t.id === taskDef.templateId);
          if (template) {
            taskName = template.name;
            duration = template.duration;
            tags = [...template.tags];
          }
        }

        if (!taskName) return;

        const startTime = `${dateStr}T${taskDef.time}`;
        let endTime = null;

        if (duration) {
          const start = new Date(startTime);
          const end = new Date(start.getTime() + duration * 60 * 1000);
          endTime = end.toISOString();
        }

        const task = TaskManager.createTask(taskName, {
          startTime,
          endTime,
          duration,
          tags
        });

        tasksToAdd.push(task);
      });
    });

    return tasksToAdd;
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};
