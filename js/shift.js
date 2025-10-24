const ShiftManager = {
  shifts: [],
  currentShiftId: null,

  init() {
    this.shifts = Storage.loadShifts();
    this.setupEventListeners();
  },

  setupEventListeners() {
    const manageBtn = document.getElementById('manageShiftsBtn');
    const closeBtn = document.getElementById('shiftCloseBtn');
    const modal = document.getElementById('shiftModal');
    const addBtn = document.getElementById('addShiftBtn');

    const editCloseBtn = document.getElementById('shiftEditCloseBtn');
    const editModal = document.getElementById('shiftEditModal');
    const editForm = document.getElementById('shiftEditForm');
    const deleteBtn = document.getElementById('deleteShiftBtn');
    const patternSelect = document.getElementById('editShiftPattern');

    if (manageBtn) {
      manageBtn.addEventListener('click', () => {
        this.openShiftModal();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.closeShiftModal();
      });
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeShiftModal();
        }
      });
    }

    if (addBtn) {
      addBtn.addEventListener('click', () => {
        this.openShiftEditModal();
      });
    }

    if (editCloseBtn) {
      editCloseBtn.addEventListener('click', () => {
        this.closeShiftEditModal();
      });
    }

    if (editModal) {
      editModal.addEventListener('click', (e) => {
        if (e.target === editModal) {
          this.closeShiftEditModal();
        }
      });
    }

    if (editForm) {
      editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveShift();
      });
    }

    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        this.deleteShift();
      });
    }

    if (patternSelect) {
      patternSelect.addEventListener('change', (e) => {
        const weekdayGroup = document.getElementById('shiftWeekdayGroup');
        if (weekdayGroup) {
          weekdayGroup.style.display = e.target.value === 'weekly' ? 'block' : 'none';
        }
      });
    }
  },

  openShiftModal() {
    const modal = document.getElementById('shiftModal');
    if (modal) {
      this.renderShiftList();
      modal.style.display = 'flex';
    }
  },

  closeShiftModal() {
    const modal = document.getElementById('shiftModal');
    if (modal) {
      modal.style.display = 'none';
    }
  },

  renderShiftList() {
    const list = document.getElementById('shiftList');
    if (!list) return;

    if (this.shifts.length === 0) {
      list.innerHTML = '<div class="empty-state-text">シフトがありません</div>';
      return;
    }

    list.innerHTML = this.shifts.map(shift => {
      const dateText = this.getDateText(shift);
      const timeText = `${shift.startTime}～${shift.endTime}`;
      const durationText = this.calculateDurationText(shift);
      const patternText = this.getPatternText(shift);

      return `
        <div class="shift-item" data-shift-id="${shift.id}">
          <div class="shift-name">${this.escapeHtml(shift.name)}</div>
          <div class="shift-details">
            <div class="shift-detail">${dateText}</div>
            <div class="shift-detail">${timeText}</div>
            <div class="shift-detail">${durationText}</div>
            ${patternText ? `<div class="shift-detail">${patternText}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');

    const items = list.querySelectorAll('.shift-item');
    items.forEach(item => {
      item.addEventListener('click', () => {
        const shiftId = item.dataset.shiftId;
        this.openShiftEditModal(shiftId);
      });
    });
  },

  getDateText(shift) {
    const startDate = new Date(shift.startDate);
    const startStr = this.formatDate(startDate);

    if (shift.endDate) {
      const endDate = new Date(shift.endDate);
      const endStr = this.formatDate(endDate);
      return `${startStr} ～ ${endStr}`;
    }

    return startStr;
  },

  getPatternText(shift) {
    if (shift.pattern === 'weekly') {
      const days = ['日', '月', '火', '水', '木', '金', '土'];
      const selectedDays = shift.repeatDays.map(d => days[d]).join('・');
      return `毎週 ${selectedDays}`;
    }
    return '';
  },

  calculateDurationText(shift) {
    const [startHour, startMin] = shift.startTime.split(':').map(Number);
    const [endHour, endMin] = shift.endTime.split(':').map(Number);

    let duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);

    if (duration < 0) {
      duration += 24 * 60;
    }

    if (shift.breakTime) {
      duration -= shift.breakTime;
    }

    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;

    if (minutes === 0) {
      return `${hours}時間`;
    }
    return `${hours}時間${minutes}分`;
  },

  formatDate(date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
  },

  openShiftEditModal(shiftId = null) {
    this.currentShiftId = shiftId;
    const modal = document.getElementById('shiftEditModal');
    if (!modal) return;

    if (shiftId) {
      const shift = this.shifts.find(s => s.id === shiftId);
      if (shift) {
        this.populateShiftForm(shift);
      }
    } else {
      this.clearShiftForm();
    }

    modal.style.display = 'flex';
  },

  closeShiftEditModal() {
    const modal = document.getElementById('shiftEditModal');
    if (modal) {
      modal.style.display = 'none';
    }
    this.currentShiftId = null;
  },

  populateShiftForm(shift) {
    const nameInput = document.getElementById('editShiftName');
    const startDateInput = document.getElementById('editShiftStartDate');
    const endDateInput = document.getElementById('editShiftEndDate');
    const startTimeInput = document.getElementById('editShiftStartTime');
    const endTimeInput = document.getElementById('editShiftEndTime');
    const breakTimeInput = document.getElementById('editShiftBreakTime');
    const patternSelect = document.getElementById('editShiftPattern');
    const weekdayGroup = document.getElementById('shiftWeekdayGroup');

    if (nameInput) nameInput.value = shift.name;
    if (startDateInput) startDateInput.value = shift.startDate;
    if (endDateInput) endDateInput.value = shift.endDate || '';
    if (startTimeInput) startTimeInput.value = shift.startTime;
    if (endTimeInput) endTimeInput.value = shift.endTime;
    if (breakTimeInput) breakTimeInput.value = shift.breakTime || '';
    if (patternSelect) {
      patternSelect.value = shift.pattern || 'none';
      if (weekdayGroup) {
        weekdayGroup.style.display = shift.pattern === 'weekly' ? 'block' : 'none';
      }
    }

    const checkboxes = document.querySelectorAll('#shiftWeekdayGroup .weekday-checkbox input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      checkbox.checked = shift.repeatDays && shift.repeatDays.includes(parseInt(checkbox.value));
    });
  },

  clearShiftForm() {
    const nameInput = document.getElementById('editShiftName');
    const startDateInput = document.getElementById('editShiftStartDate');
    const endDateInput = document.getElementById('editShiftEndDate');
    const startTimeInput = document.getElementById('editShiftStartTime');
    const endTimeInput = document.getElementById('editShiftEndTime');
    const breakTimeInput = document.getElementById('editShiftBreakTime');
    const patternSelect = document.getElementById('editShiftPattern');
    const weekdayGroup = document.getElementById('shiftWeekdayGroup');

    if (nameInput) nameInput.value = '';
    if (startDateInput) startDateInput.value = '';
    if (endDateInput) endDateInput.value = '';
    if (startTimeInput) startTimeInput.value = '';
    if (endTimeInput) endTimeInput.value = '';
    if (breakTimeInput) breakTimeInput.value = '';
    if (patternSelect) {
      patternSelect.value = 'none';
      if (weekdayGroup) weekdayGroup.style.display = 'none';
    }

    const checkboxes = document.querySelectorAll('#shiftWeekdayGroup .weekday-checkbox input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      checkbox.checked = false;
    });
  },

  saveShift() {
    const nameInput = document.getElementById('editShiftName');
    const startDateInput = document.getElementById('editShiftStartDate');
    const endDateInput = document.getElementById('editShiftEndDate');
    const startTimeInput = document.getElementById('editShiftStartTime');
    const endTimeInput = document.getElementById('editShiftEndTime');
    const breakTimeInput = document.getElementById('editShiftBreakTime');
    const patternSelect = document.getElementById('editShiftPattern');

    if (!nameInput.value.trim()) {
      alert('シフト名を入力してください');
      return;
    }

    if (!startDateInput.value) {
      alert('開始日を入力してください');
      return;
    }

    if (!startTimeInput.value || !endTimeInput.value) {
      alert('勤務時間を入力してください');
      return;
    }

    const selectedDays = [];
    const checkboxes = document.querySelectorAll('#shiftWeekdayGroup .weekday-checkbox input[type="checkbox"]:checked');
    checkboxes.forEach(checkbox => {
      selectedDays.push(parseInt(checkbox.value));
    });

    if (this.currentShiftId) {
      const shift = this.shifts.find(s => s.id === this.currentShiftId);
      if (shift) {
        shift.name = nameInput.value.trim();
        shift.startDate = startDateInput.value;
        shift.endDate = endDateInput.value || null;
        shift.startTime = startTimeInput.value;
        shift.endTime = endTimeInput.value;
        shift.breakTime = parseInt(breakTimeInput.value) || 0;
        shift.pattern = patternSelect.value;
        shift.repeatDays = selectedDays.length > 0 ? selectedDays : [];
        shift.updatedAt = new Date().toISOString();
      }
    } else {
      const newShift = this.createShift(
        nameInput.value.trim(),
        startDateInput.value,
        endDateInput.value || null,
        startTimeInput.value,
        endTimeInput.value,
        parseInt(breakTimeInput.value) || 0,
        patternSelect.value,
        selectedDays
      );
      this.shifts.push(newShift);
    }

    Storage.saveShifts(this.shifts);
    this.generateTasksFromShifts();
    this.closeShiftEditModal();
    this.renderShiftList();
    console.log('シフトを保存しました');
  },

  deleteShift() {
    if (!this.currentShiftId) return;

    if (confirm('このシフトを削除しますか？')) {
      this.shifts = this.shifts.filter(s => s.id !== this.currentShiftId);
      Storage.saveShifts(this.shifts);
      this.closeShiftEditModal();
      this.renderShiftList();
      console.log('シフトを削除しました');
    }
  },

  createShift(name, startDate, endDate, startTime, endTime, breakTime, pattern, repeatDays) {
    return {
      id: `shift_${Date.now()}`,
      name: name,
      startDate: startDate,
      endDate: endDate,
      startTime: startTime,
      endTime: endTime,
      breakTime: breakTime,
      pattern: pattern,
      repeatDays: repeatDays,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  },

  generateTasksFromShifts() {
    this.shifts.forEach(shift => {
      const startDate = new Date(shift.startDate);
      const endDate = shift.endDate ? new Date(shift.endDate) : new Date(shift.startDate);

      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        if (this.shouldGenerateTaskForDate(shift, currentDate)) {
          this.createTaskFromShift(shift, currentDate);
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });
  },

  shouldGenerateTaskForDate(shift, date) {
    if (shift.pattern === 'weekly') {
      const dayOfWeek = date.getDay();
      return shift.repeatDays && shift.repeatDays.includes(dayOfWeek);
    }
    return true;
  },

  createTaskFromShift(shift, date) {
    if (!window.TaskManager) return;

    const existingTask = TaskManager.tasks.find(task => {
      return task.name === shift.name &&
             task.startTime &&
             new Date(task.startTime).toDateString() === date.toDateString();
    });

    if (existingTask) {
      return;
    }

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

    const task = TaskManager.createTask(shift.name, {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration: duration,
      tags: ['シフト']
    });

    TaskManager.tasks.push(task);
    Storage.saveTasks(TaskManager.tasks);

    console.log('シフトからタスクを生成しました:', shift.name);
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};
