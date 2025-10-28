const STORAGE_KEYS = {
  TASKS: 'nowtask_tasks',
  ROUTINES: 'nowtask_routines',
  SHIFT_PRESETS: 'nowtask_shift_presets',
  SHIFTS: 'nowtask_shifts',
  SETTINGS: 'nowtask_settings',
  TEMPLATES: 'nowtask_templates',
  MULTIDAY_PATTERNS: 'nowtask_multiday_patterns'
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

  saveShiftPresets(presets) {
    try {
      localStorage.setItem(STORAGE_KEYS.SHIFT_PRESETS, JSON.stringify(presets));
      return true;
    } catch (error) {
      console.error('シフトプリセットの保存に失敗しました:', error);
      return false;
    }
  },

  loadShiftPresets() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SHIFT_PRESETS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('シフトプリセットの読み込みに失敗しました:', error);
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
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('シフトの読み込みに失敗しました:', error);
      return {};
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

  saveTemplates(templates) {
    try {
      localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
      return true;
    } catch (error) {
      console.error('テンプレートの保存に失敗しました:', error);
      return false;
    }
  },

  loadTemplates() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('テンプレートの読み込みに失敗しました:', error);
      return [];
    }
  },

  saveMultiDayPatterns(patterns) {
    try {
      localStorage.setItem(STORAGE_KEYS.MULTIDAY_PATTERNS, JSON.stringify(patterns));
      return true;
    } catch (error) {
      console.error('複数日パターンの保存に失敗しました:', error);
      return false;
    }
  },

  loadMultiDayPatterns() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MULTIDAY_PATTERNS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('複数日パターンの読み込みに失敗しました:', error);
      return [];
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
