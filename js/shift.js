console.log('shift.js が読み込まれました');

const ShiftManager = {
  presets: [],
  shifts: {},
  currentPresetId: null,
  shiftMode: false,
  selectedDate: null,
  isApplyingPreset: false,

  defaultPresets: [
    { name: '夜勤', startTime: '16:00', endTime: '09:00', breakTime: 60, createTask: true },
    { name: '明け', startTime: null, endTime: null, breakTime: 0, createTask: false },
    { name: '休み', startTime: null, endTime: null, breakTime: 0, createTask: false },
    { name: '予定', startTime: null, endTime: null, breakTime: 0, createTask: false },
    { name: '研修', startTime: '09:00', endTime: '17:00', breakTime: 60, createTask: true },
    { name: '仕事', startTime: '09:00', endTime: '18:00', breakTime: 60, createTask: true }
  ],

  init() {
    this.presets = Storage.loadShiftPresets();
    this.shifts = Storage.loadShifts();

    if (!Array.isArray(this.presets)) {
      this.presets = [];
    }

    if (typeof this.shifts !== 'object' || this.shifts === null) {
      this.shifts = {};
    }

    if (this.presets.length === 0) {
      this.initializeDefaultPresets();
    }

    this.setupEventListeners();
  },

  initializeDefaultPresets() {
    this.defaultPresets.forEach((preset, index) => {
      const newPreset = this.createPreset(
        preset.name,
        preset.startTime,
        preset.endTime,
        preset.breakTime,
        preset.createTask,
        index
      );
      this.presets.push(newPreset);
    });
    Storage.saveShiftPresets(this.presets);
    console.log('デフォルトプリセットを初期化しました');
  },

  setupEventListeners() {
    const shiftModeBtn = document.getElementById('shiftModeBtn');
    const managePresetsBtn = document.getElementById('manageShiftPresetsBtn');
    const presetCloseBtn = document.getElementById('shiftPresetCloseBtn');
    const presetModal = document.getElementById('shiftPresetModal');
    const addPresetBtn = document.getElementById('addPresetBtn');
    const presetEditCloseBtn = document.getElementById('presetEditCloseBtn');
    const presetEditModal = document.getElementById('presetEditModal');
    const presetEditForm = document.getElementById('presetEditForm');
    const deletePresetBtn = document.getElementById('deletePresetBtn');

    if (shiftModeBtn) {
      shiftModeBtn.addEventListener('click', () => {
        this.toggleShiftMode();
      });
    }

    if (managePresetsBtn) {
      managePresetsBtn.addEventListener('click', () => {
        this.openPresetModal();
      });
    }

    if (presetCloseBtn) {
      presetCloseBtn.addEventListener('click', () => {
        this.closePresetModal();
      });
    }

    if (presetModal) {
      presetModal.addEventListener('click', (e) => {
        if (e.target === presetModal) {
          this.closePresetModal();
        }
      });
    }

    if (addPresetBtn) {
      addPresetBtn.addEventListener('click', () => {
        this.openPresetEditModal();
      });
    }

    if (presetEditCloseBtn) {
      presetEditCloseBtn.addEventListener('click', () => {
        this.closePresetEditModal();
      });
    }

    if (presetEditModal) {
      presetEditModal.addEventListener('click', (e) => {
        if (e.target === presetEditModal) {
          this.closePresetEditModal();
        }
      });
    }

    if (presetEditForm) {
      presetEditForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.savePreset();
      });
    }

    if (deletePresetBtn) {
      deletePresetBtn.addEventListener('click', () => {
        this.deletePreset();
      });
    }
  },

  toggleShiftMode() {
    this.shiftMode = !this.shiftMode;

    const shiftModeBtn = document.getElementById('shiftModeBtn');
    const shiftPresetArea = document.getElementById('shiftPresetArea');
    const quickInput = document.querySelector('.quick-input');

    if (shiftModeBtn) {
      shiftModeBtn.classList.toggle('active', this.shiftMode);
      shiftModeBtn.textContent = this.shiftMode ? 'シフト入力中' : 'シフト入力';
    }

    if (shiftPresetArea) {
      shiftPresetArea.style.display = this.shiftMode ? 'block' : 'none';
    }

    if (quickInput) {
      quickInput.style.display = this.shiftMode ? 'none' : 'flex';
    }

    if (this.shiftMode) {
      this.renderPresetButtons();

      // シフトモードON時に今日の日付を自動選択
      if (typeof Calendar !== 'undefined') {
        const today = new Date();
        Calendar.selectDay(today);
      }
    }

    // カレンダーを再描画（表示内容を切り替えるため）
    if (typeof Calendar !== 'undefined') {
      Calendar.renderCalendar();
    }

    console.log('シフト入力モード:', this.shiftMode);
  },

  renderPresetButtons() {
    const container = document.getElementById('shiftPresetButtons');
    if (!container) return;

    console.log('renderPresetButtons() called');
    console.log('this.presets:', this.presets);

    // 現在選択中の日付のシフト一覧を取得
    let appliedPresetIds = [];
    if (this.selectedDate) {
      const dateKey = this.formatDateKey(this.selectedDate);
      const shifts = this.shifts[dateKey];
      if (Array.isArray(shifts)) {
        appliedPresetIds = shifts.map(s => s.presetId);
      }
    }

    container.innerHTML = this.presets.map(preset => {
      console.log('プリセット:', preset.name, preset.id);
      const isApplied = appliedPresetIds.includes(preset.id);
      return `
        <button class="shift-preset-btn ${isApplied ? 'active' : ''}" data-preset-id="${preset.id}">
          ${this.escapeHtml(preset.name)}
          ${isApplied ? '<span class="applied-mark">✓</span>' : ''}
        </button>
      `;
    }).join('');

    const buttons = container.querySelectorAll('.shift-preset-btn');
    console.log('プリセットボタン数:', buttons.length);
    buttons.forEach(button => {
      button.addEventListener('click', () => {
        const presetId = button.dataset.presetId;
        const presetName = this.presets.find(p => p.id === presetId)?.name;
        console.log('ボタンクリック:', presetName, presetId);
        this.selectPreset(presetId);
      });
    });
  },

  selectPreset(presetId) {
    console.log('プリセットを選択:', presetId);
    console.log('selectedDate:', this.selectedDate);
    console.log('isApplyingPreset:', this.isApplyingPreset);

    // 選択された日付があればシフトを適用（ユーザー操作として）
    if (this.selectedDate && !this.isApplyingPreset) {
      console.log('applyPresetを呼び出します');
      this.applyPreset(presetId, true);
    } else {
      console.log('applyPresetをスキップ - 条件不一致');
    }
  },

  selectDate(date) {
    this.selectedDate = date;
    console.log('ShiftManager.selectDate() called:', date);
    console.log('ShiftManager.selectedDate set to:', this.selectedDate);

    const dateLabel = document.getElementById('shiftSelectedDate');
    if (dateLabel) {
      const month = date.getMonth() + 1;
      const day = date.getDate();
      dateLabel.textContent = `${month}月${day}日`;
    }

    // プリセットボタンの表示を更新（適用済みマークを反映）
    this.renderPresetButtons();
  },

  applyPreset(presetId, autoMoveNext = false) {
    if (!this.selectedDate) {
      alert('日付を選択してください');
      return;
    }

    const preset = this.presets.find(p => p.id === presetId);
    if (!preset) return;

    const dateKey = this.formatDateKey(this.selectedDate);

    // 配列形式で管理（最大2個まで）
    if (!Array.isArray(this.shifts[dateKey])) {
      this.shifts[dateKey] = [];
    }

    // 同じプリセットが既に登録されているか確認
    const existingIndex = this.shifts[dateKey].findIndex(s => s.presetId === preset.id);
    if (existingIndex !== -1) {
      // 既に登録済みの場合は削除
      this.shifts[dateKey].splice(existingIndex, 1);
      console.log('シフトを削除しました:', preset.name, dateKey);
    } else {
      // 最大2個までチェック
      if (this.shifts[dateKey].length >= 2) {
        alert('1日に登録できるシフトは2個までです');
        return;
      }

      // 新しいシフトを追加
      const newShift = {
        presetId: preset.id,
        name: preset.name,
        startTime: preset.startTime,
        endTime: preset.endTime,
        breakTime: preset.breakTime,
        createTask: preset.createTask !== false,
        date: dateKey
      };
      this.shifts[dateKey].push(newShift);
      console.log('シフトを登録しました:', preset.name, dateKey);
    }

    // 空配列の場合は削除
    if (this.shifts[dateKey].length === 0) {
      delete this.shifts[dateKey];
    }

    Storage.saveShifts(this.shifts);

    // この日付のすべてのシフトタスクを再生成
    this.regenerateShiftTasksForDate(this.selectedDate);

    // プリセットボタンの表示を更新（適用済みマークを反映）
    this.renderPresetButtons();

    if (typeof Calendar !== 'undefined') {
      Calendar.renderCalendar();
    }

    // ユーザー操作の場合のみ次の日に自動移動
    if (autoMoveNext) {
      this.moveToNextDay();
    }
  },

  moveToNextDay() {
    if (!this.selectedDate) return;

    const nextDate = new Date(this.selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);

    console.log('次の日に移動:', nextDate);

    if (typeof Calendar !== 'undefined') {
      Calendar.selectDay(nextDate);
    }
  },

  regenerateShiftTasksForDate(date) {
    if (typeof TaskManager === 'undefined') return;

    // この日付の既存シフトタスクをすべて削除
    const dateString = date.toDateString();
    TaskManager.tasks = TaskManager.tasks.filter(task => {
      if (!task.tags || !task.tags.includes('シフト')) return true;

      if (task.startTime) {
        return new Date(task.startTime).toDateString() !== dateString;
      }
      return new Date(task.createdAt).toDateString() !== dateString;
    });

    // この日付のすべてのシフトからタスクを生成
    const dateKey = this.formatDateKey(date);
    const shifts = this.shifts[dateKey];

    if (Array.isArray(shifts)) {
      shifts.forEach(shift => {
        this.createTaskFromShift(shift, date);
      });
    }

    Storage.saveTasks(TaskManager.tasks);

    // UIを更新
    if (typeof TaskManager.renderTasks === 'function') {
      TaskManager.renderTasks();
    }
    if (typeof Gauge !== 'undefined' && typeof Gauge.updateGauge === 'function') {
      Gauge.updateGauge();
    }
  },

  createTaskFromShift(shift, date) {
    if (typeof TaskManager === 'undefined') return;

    // createTask=falseの場合はタスクを作成しない（カレンダーにのみ表示）
    if (shift.createTask === false) {
      console.log('createTask=falseのため、タスクを生成しません:', shift.name);
      return;
    }

    let taskData = {
      tags: ['シフト']
    };

    // 時刻ありシフトの場合
    if (shift.startTime && shift.endTime) {
      const [startHour, startMin] = shift.startTime.split(':').map(Number);
      const [endHour, endMin] = shift.endTime.split(':').map(Number);

      const startTime = new Date(date);
      startTime.setHours(startHour, startMin, 0, 0);

      const endTime = new Date(date);
      endTime.setHours(endHour, endMin, 0, 0);

      if (endTime <= startTime) {
        endTime.setDate(endTime.getDate() + 1);
      }

      let duration = Math.round((endTime - startTime) / 1000 / 60);
      if (shift.breakTime) {
        duration -= shift.breakTime;
      }

      taskData.startTime = startTime.toISOString();
      taskData.endTime = endTime.toISOString();
      taskData.duration = duration;
    }

    const task = TaskManager.createTask(shift.name, taskData);
    TaskManager.tasks.push(task);

    console.log('シフトからタスクを生成しました:', shift.name);
  },

  getShiftForDate(date) {
    const dateKey = this.formatDateKey(date);
    const shifts = this.shifts[dateKey];
    // 配列で返す（互換性のため、なければ空配列）
    return Array.isArray(shifts) ? shifts : [];
  },

  getShiftsForDate(date) {
    // getShiftForDateと同じ（配列を返す）
    return this.getShiftForDate(date);
  },

  openPresetModal() {
    const modal = document.getElementById('shiftPresetModal');
    if (modal) {
      this.renderPresetList();
      modal.style.display = 'flex';
    }
  },

  closePresetModal() {
    const modal = document.getElementById('shiftPresetModal');
    if (modal) {
      modal.style.display = 'none';
    }
  },

  renderPresetList() {
    const list = document.getElementById('presetList');
    if (!list) return;

    if (this.presets.length === 0) {
      list.innerHTML = '<div class="empty-state-text">プリセットがありません</div>';
      return;
    }

    list.innerHTML = this.presets.map(preset => {
      let details = '';
      if (preset.startTime && preset.endTime) {
        details = `${preset.startTime}～${preset.endTime}`;
        if (preset.breakTime) {
          details += ` (休憩${preset.breakTime}分)`;
        }
      } else {
        details = '時間設定なし';
      }

      return `
        <div class="preset-item" data-preset-id="${preset.id}">
          <div class="preset-name">${this.escapeHtml(preset.name)}</div>
          <div class="preset-details">${details}</div>
        </div>
      `;
    }).join('');

    const items = list.querySelectorAll('.preset-item');
    items.forEach(item => {
      item.addEventListener('click', () => {
        const presetId = item.dataset.presetId;
        this.openPresetEditModal(presetId);
      });
    });
  },

  openPresetEditModal(presetId = null) {
    this.currentPresetId = presetId;
    const modal = document.getElementById('presetEditModal');
    if (!modal) return;

    if (presetId) {
      const preset = this.presets.find(p => p.id === presetId);
      if (preset) {
        this.populatePresetForm(preset);
      }
    } else {
      this.clearPresetForm();
    }

    modal.style.display = 'flex';
  },

  closePresetEditModal() {
    const modal = document.getElementById('presetEditModal');
    if (modal) {
      modal.style.display = 'none';
    }
    this.currentPresetId = null;
  },

  populatePresetForm(preset) {
    const nameInput = document.getElementById('editPresetName');
    const startTimeInput = document.getElementById('editPresetStartTime');
    const endTimeInput = document.getElementById('editPresetEndTime');
    const breakTimeInput = document.getElementById('editPresetBreakTime');
    const createTaskInput = document.getElementById('editPresetCreateTask');

    if (nameInput) nameInput.value = preset.name;
    if (startTimeInput) startTimeInput.value = preset.startTime || '';
    if (endTimeInput) endTimeInput.value = preset.endTime || '';
    if (breakTimeInput) breakTimeInput.value = preset.breakTime || '';
    if (createTaskInput) createTaskInput.checked = preset.createTask !== false;
  },

  clearPresetForm() {
    const nameInput = document.getElementById('editPresetName');
    const startTimeInput = document.getElementById('editPresetStartTime');
    const endTimeInput = document.getElementById('editPresetEndTime');
    const breakTimeInput = document.getElementById('editPresetBreakTime');
    const createTaskInput = document.getElementById('editPresetCreateTask');

    if (nameInput) nameInput.value = '';
    if (startTimeInput) startTimeInput.value = '';
    if (endTimeInput) endTimeInput.value = '';
    if (breakTimeInput) breakTimeInput.value = '';
    if (createTaskInput) createTaskInput.checked = true; // デフォルトはtrue
  },

  savePreset() {
    const nameInput = document.getElementById('editPresetName');
    const startTimeInput = document.getElementById('editPresetStartTime');
    const endTimeInput = document.getElementById('editPresetEndTime');
    const breakTimeInput = document.getElementById('editPresetBreakTime');
    const createTaskInput = document.getElementById('editPresetCreateTask');

    if (!nameInput.value.trim()) {
      alert('プリセット名を入力してください');
      return;
    }

    if (this.currentPresetId) {
      const preset = this.presets.find(p => p.id === this.currentPresetId);
      if (preset) {
        preset.name = nameInput.value.trim();
        preset.startTime = startTimeInput.value || null;
        preset.endTime = endTimeInput.value || null;
        preset.breakTime = parseInt(breakTimeInput.value) || 0;
        preset.createTask = createTaskInput ? createTaskInput.checked : true;
        preset.updatedAt = new Date().toISOString();
      }
    } else {
      const newPreset = this.createPreset(
        nameInput.value.trim(),
        startTimeInput.value || null,
        endTimeInput.value || null,
        parseInt(breakTimeInput.value) || 0,
        createTaskInput ? createTaskInput.checked : true
      );
      this.presets.push(newPreset);
    }

    Storage.saveShiftPresets(this.presets);
    this.closePresetEditModal();
    this.renderPresetList();
    this.renderPresetButtons();

    console.log('プリセットを保存しました');
  },

  deletePreset() {
    if (!this.currentPresetId) return;

    if (confirm('このプリセットを削除しますか？')) {
      this.presets = this.presets.filter(p => p.id !== this.currentPresetId);
      Storage.saveShiftPresets(this.presets);
      this.closePresetEditModal();
      this.renderPresetList();
      this.renderPresetButtons();
      console.log('プリセットを削除しました');
    }
  },

  createPreset(name, startTime, endTime, breakTime, createTask = true, index = 0) {
    return {
      id: `preset_${Date.now()}_${index}`,
      name: name,
      startTime: startTime,
      endTime: endTime,
      breakTime: breakTime,
      createTask: createTask !== false, // デフォルトtrue
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  },

  formatDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};
