const STORAGE_KEYS = {
  TASKS: 'nowtask_tasks',
  ROUTINES: 'nowtask_routines',
  SHIFTS: 'nowtask_shifts',
  SETTINGS: 'nowtask_settings'
};

const Storage = {
  saveTasks(tasks) {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
      return true;
    } catch (error) {
      console.error('タスクの保存に失敗しました:', error);
      return false;
    }
  },

  loadTasks() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TASKS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('タスクの読み込みに失敗しました:', error);
      return [];
    }
  },

  saveRoutines(routines) {
    try {
      localStorage.setItem(STORAGE_KEYS.ROUTINES, JSON.stringify(routines));
      return true;
    } catch (error) {
      console.error('ルーティンの保存に失敗しました:', error);
      return false;
    }
  },

  loadRoutines() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ROUTINES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('ルーティンの読み込みに失敗しました:', error);
      return [];
    }
  },

  saveShifts(shifts) {
    try {
      localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(shifts));
      return true;
    } catch (error) {
      console.error('シフトの保存に失敗しました:', error);
      return false;
    }
  },

  loadShifts() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SHIFTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('シフトの読み込みに失敗しました:', error);
      return [];
    }
  },

  saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('設定の保存に失敗しました:', error);
      return false;
    }
  },

  loadSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('設定の読み込みに失敗しました:', error);
      return {};
    }
  },

  clearAll() {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      console.log('全データを削除しました');
      return true;
    } catch (error) {
      console.error('データの削除に失敗しました:', error);
      return false;
    }
  }
};
