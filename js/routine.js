const RoutineManager = {
  routines: [],
  currentRoutineId: null,
  defaultRoutines: [
    { name: '睡眠', duration: 480, startTime: '23:00', pattern: 'daily', repeatDays: [0,1,2,3,4,5,6] },
    { name: '朝食', duration: 30, startTime: '07:00', pattern: 'daily', repeatDays: [0,1,2,3,4,5,6] },
    { name: '昼食', duration: 45, startTime: '12:00', pattern: 'daily', repeatDays: [0,1,2,3,4,5,6] },
    { name: '夕食', duration: 60, startTime: '19:00', pattern: 'daily', repeatDays: [0,1,2,3,4,5,6] },
    { name: '入浴', duration: 30, startTime: '22:00', pattern: 'daily', repeatDays: [0,1,2,3,4,5,6] },
    { name: '歯磨き', duration: 5, startTime: '22:50', pattern: 'daily', repeatDays: [0,1,2,3,4,5,6] }
  ],

  init() {
    this.routines = Storage.loadRoutines();

    if (!Array.isArray(this.routines)) {
      this.routines = [];
    }

    if (this.routines.length === 0) {
      this.initializeDefaultRoutines();
    }

    this.setupEventListeners();
    this.generateDailyTasks();
  },

  initializeDefaultRoutines() {
    this.defaultRoutines.forEach(routine => {
      const newRoutine = this.createRoutine(
        routine.name,
        routine.duration,
        routine.startTime,
        routine.pattern,
        routine.repeatDays
      );
      this.routines.push(newRoutine);
    });
    Storage.saveRoutines(this.routines);
    console.log('デフォルトルーティンを初期化しました');
  },

  setupEventListeners() {
    const manageBtn = document.getElementById('manageRoutinesBtn');
    const closeBtn = document.getElementById('routineCloseBtn');
    const modal = document.getElementById('routineModal');
    const addBtn = document.getElementById('addRoutineBtn');

    const editCloseBtn = document.getElementById('routineEditCloseBtn');
    const editModal = document.getElementById('routineEditModal');
    const editForm = document.getElementById('routineEditForm');
    const deleteBtn = document.getElementById('deleteRoutineBtn');
    const patternSelect = document.getElementById('editRoutinePattern');
    const addExcludeDateBtn = document.getElementById('addExcludeDateBtn');

    if (manageBtn) {
      manageBtn.addEventListener('click', () => {
        this.openRoutineModal();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.closeRoutineModal();
      });
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeRoutineModal();
        }
      });
    }

    if (addBtn) {
      addBtn.addEventListener('click', () => {
        this.openRoutineEditModal();
      });
    }

    if (editCloseBtn) {
      editCloseBtn.addEventListener('click', () => {
        this.closeRoutineEditModal();
      });
    }

    if (editModal) {
      editModal.addEventListener('click', (e) => {
        if (e.target === editModal) {
          this.closeRoutineEditModal();
        }
      });
    }

    if (editForm) {
      editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveRoutine();
      });
    }

    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        this.deleteRoutine();
      });
    }

    if (patternSelect) {
      patternSelect.addEventListener('change', (e) => {
        const weekdayGroup = document.getElementById('weekdayGroup');
        if (weekdayGroup) {
          weekdayGroup.style.display = e.target.value === 'weekly' ? 'block' : 'none';
        }
      });
    }

    if (addExcludeDateBtn) {
      addExcludeDateBtn.addEventListener('click', () => {
        this.addExcludeDate();
      });
    }
  },

  openRoutineModal() {
    const modal = document.getElementById('routineModal');
    if (modal) {
      this.renderRoutineList();
      modal.style.display = 'flex';
    }
  },

  closeRoutineModal() {
    const modal = document.getElementById('routineModal');
    if (modal) {
      modal.style.display = 'none';
    }
  },

  renderRoutineList() {
    const list = document.getElementById('routineList');
    if (!list) return;

    if (this.routines.length === 0) {
      list.innerHTML = '<div class="empty-state-text">ルーティンがありません</div>';
      return;
    }

    list.innerHTML = this.routines.map(routine => {
      const patternText = this.getPatternText(routine);
      const timeText = routine.startTime ? `${routine.startTime}~` : '';
      const durationText = `${routine.duration}分`;

      return `
        <div class="routine-item" data-routine-id="${routine.id}">
          <div class="routine-name">${this.escapeHtml(routine.name)}</div>
          <div class="routine-details">
            <div class="routine-detail">${patternText}</div>
            ${timeText ? `<div class="routine-detail">${timeText}</div>` : ''}
            <div class="routine-detail">${durationText}</div>
          </div>
        </div>
      `;
    }).join('');

    const items = list.querySelectorAll('.routine-item');
    items.forEach(item => {
      item.addEventListener('click', () => {
        const routineId = item.dataset.routineId;
        this.openRoutineEditModal(routineId);
      });
    });
  },

  getPatternText(routine) {
    if (routine.pattern === 'daily') {
      return '毎日';
    } else if (routine.pattern === 'weekly') {
      const days = ['日', '月', '火', '水', '木', '金', '土'];
      const selectedDays = routine.repeatDays.map(d => days[d]).join('・');
      return `毎週 ${selectedDays}`;
    } else if (routine.pattern === 'monthly') {
      return '毎月';
    }
    return routine.pattern;
  },

  openRoutineEditModal(routineId = null) {
    this.currentRoutineId = routineId;
    const modal = document.getElementById('routineEditModal');
    if (!modal) return;

    if (routineId) {
      const routine = this.routines.find(r => r.id === routineId);
      if (routine) {
        this.populateRoutineForm(routine);
      }
    } else {
      this.clearRoutineForm();
    }

    modal.style.display = 'flex';
  },

  closeRoutineEditModal() {
    const modal = document.getElementById('routineEditModal');
    if (modal) {
      modal.style.display = 'none';
    }
    this.currentRoutineId = null;
  },

  populateRoutineForm(routine) {
    const nameInput = document.getElementById('editRoutineName');
    const durationInput = document.getElementById('editRoutineDuration');
    const startTimeInput = document.getElementById('editRoutineStartTime');
    const patternSelect = document.getElementById('editRoutinePattern');
    const weekdayGroup = document.getElementById('weekdayGroup');

    if (nameInput) nameInput.value = routine.name;
    if (durationInput) durationInput.value = routine.duration || '';
    if (startTimeInput) startTimeInput.value = routine.startTime || '';
    if (patternSelect) {
      patternSelect.value = routine.pattern || 'daily';
      if (weekdayGroup) {
        weekdayGroup.style.display = routine.pattern === 'weekly' ? 'block' : 'none';
      }
    }

    const checkboxes = document.querySelectorAll('.weekday-checkbox input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      checkbox.checked = routine.repeatDays && routine.repeatDays.includes(parseInt(checkbox.value));
    });

    this.renderExcludeDates(routine.excludeDates || []);
  },

  renderExcludeDates(excludeDates) {
    const list = document.getElementById('excludeDatesList');
    if (!list) return;

    if (excludeDates.length === 0) {
      list.innerHTML = '';
      return;
    }

    list.innerHTML = excludeDates.map(dateStr => `
      <div class="exclude-date-item">
        <span>${dateStr}</span>
        <button type="button" class="remove-exclude-date-btn" data-date="${dateStr}">×</button>
      </div>
    `).join('');

    const removeButtons = list.querySelectorAll('.remove-exclude-date-btn');
    removeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.removeExcludeDate(btn.dataset.date);
      });
    });
  },

  addExcludeDate() {
    const dateInput = document.getElementById('excludeDateInput');
    if (!dateInput || !dateInput.value) {
      alert('日付を選択してください');
      return;
    }

    if (!this.currentRoutineId) {
      alert('ルーティンを保存してから除外日を追加してください');
      return;
    }

    const routine = this.routines.find(r => r.id === this.currentRoutineId);
    if (!routine) return;

    if (!routine.excludeDates) {
      routine.excludeDates = [];
    }

    if (routine.excludeDates.includes(dateInput.value)) {
      alert('この日付は既に追加されています');
      return;
    }

    routine.excludeDates.push(dateInput.value);
    Storage.saveRoutines(this.routines);
    this.renderExcludeDates(routine.excludeDates);
    dateInput.value = '';
    console.log('除外日を追加しました:', dateInput.value);
  },

  removeExcludeDate(dateStr) {
    if (!this.currentRoutineId) return;

    const routine = this.routines.find(r => r.id === this.currentRoutineId);
    if (!routine) return;

    routine.excludeDates = routine.excludeDates.filter(d => d !== dateStr);
    Storage.saveRoutines(this.routines);
    this.renderExcludeDates(routine.excludeDates);
    console.log('除外日を削除しました:', dateStr);
  },

  clearRoutineForm() {
    const nameInput = document.getElementById('editRoutineName');
    const durationInput = document.getElementById('editRoutineDuration');
    const startTimeInput = document.getElementById('editRoutineStartTime');
    const patternSelect = document.getElementById('editRoutinePattern');
    const weekdayGroup = document.getElementById('weekdayGroup');

    if (nameInput) nameInput.value = '';
    if (durationInput) durationInput.value = '';
    if (startTimeInput) startTimeInput.value = '';
    if (patternSelect) {
      patternSelect.value = 'daily';
      if (weekdayGroup) weekdayGroup.style.display = 'none';
    }

    const checkboxes = document.querySelectorAll('.weekday-checkbox input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      checkbox.checked = false;
    });

    this.renderExcludeDates([]);
  },

  saveRoutine() {
    const nameInput = document.getElementById('editRoutineName');
    const durationInput = document.getElementById('editRoutineDuration');
    const startTimeInput = document.getElementById('editRoutineStartTime');
    const patternSelect = document.getElementById('editRoutinePattern');

    if (!nameInput.value.trim()) {
      alert('ルーティン名を入力してください');
      return;
    }

    const selectedDays = [];
    const checkboxes = document.querySelectorAll('.weekday-checkbox input[type="checkbox"]:checked');
    checkboxes.forEach(checkbox => {
      selectedDays.push(parseInt(checkbox.value));
    });

    if (this.currentRoutineId) {
      const routine = this.routines.find(r => r.id === this.currentRoutineId);
      if (routine) {
        routine.name = nameInput.value.trim();
        routine.duration = parseInt(durationInput.value) || null;
        routine.startTime = startTimeInput.value || null;
        routine.pattern = patternSelect.value;
        routine.repeatDays = selectedDays.length > 0 ? selectedDays : [0,1,2,3,4,5,6];
        routine.updatedAt = new Date().toISOString();
      }
    } else {
      const newRoutine = this.createRoutine(
        nameInput.value.trim(),
        parseInt(durationInput.value) || null,
        startTimeInput.value || null,
        patternSelect.value,
        selectedDays.length > 0 ? selectedDays : [0,1,2,3,4,5,6]
      );
      this.routines.push(newRoutine);
    }

    Storage.saveRoutines(this.routines);
    this.closeRoutineEditModal();
    this.renderRoutineList();
    console.log('ルーティンを保存しました');
  },

  deleteRoutine() {
    if (!this.currentRoutineId) return;

    if (confirm('このルーティンを削除しますか？')) {
      this.routines = this.routines.filter(r => r.id !== this.currentRoutineId);
      Storage.saveRoutines(this.routines);
      this.closeRoutineEditModal();
      this.renderRoutineList();
      console.log('ルーティンを削除しました');
    }
  },

  createRoutine(name, duration, startTime, pattern, repeatDays) {
    return {
      id: `routine_${Date.now()}`,
      name: name,
      duration: duration,
      startTime: startTime,
      pattern: pattern,
      repeatDays: repeatDays,
      excludeDates: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  },

  generateDailyTasks() {
    const today = new Date();
    const todayDayOfWeek = today.getDay();
    const todayDateStr = this.formatDateKey(today);

    this.routines.forEach(routine => {
      if (this.shouldGenerateTask(routine, todayDayOfWeek, todayDateStr)) {
        this.createTaskFromRoutine(routine, today);
      }
    });
  },

  shouldGenerateTask(routine, dayOfWeek, dateStr) {
    if (routine.excludeDates && routine.excludeDates.includes(dateStr)) {
      return false;
    }

    if (routine.pattern === 'daily') {
      return true;
    } else if (routine.pattern === 'weekly') {
      return routine.repeatDays && routine.repeatDays.includes(dayOfWeek);
    } else if (routine.pattern === 'monthly') {
      return true;
    }

    return false;
  },

  createTaskFromRoutine(routine, date) {
    if (!window.TaskManager) return;

    const existingTask = TaskManager.tasks.find(task => {
      return task.name === routine.name &&
             task.startTime &&
             new Date(task.startTime).toDateString() === date.toDateString();
    });

    if (existingTask) {
      return;
    }

    let startTime = null;
    let endTime = null;

    if (routine.startTime) {
      const [hours, minutes] = routine.startTime.split(':');
      const start = new Date(date);
      start.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      startTime = start.toISOString();

      if (routine.duration) {
        const end = new Date(start.getTime() + routine.duration * 60 * 1000);
        endTime = end.toISOString();
      }
    }

    const task = TaskManager.createTask(routine.name, {
      startTime: startTime,
      endTime: endTime,
      duration: routine.duration,
      tags: ['ルーティン']
    });

    TaskManager.tasks.push(task);
    Storage.saveTasks(TaskManager.tasks);

    console.log('ルーティンからタスクを生成しました:', routine.name);
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
