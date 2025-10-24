const Settings = {
  defaultSettings: {
    defaultView: 'tasks'
  },

  init() {
    this.loadSettings();
    this.setupEventListeners();
  },

  setupEventListeners() {
    const settingsBtn = document.getElementById('settingsBtn');
    const closeBtn = document.getElementById('settingsCloseBtn');
    const modal = document.getElementById('settingsModal');
    const defaultViewSelect = document.getElementById('defaultView');
    const clearAllBtn = document.getElementById('clearAllDataBtn');

    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        this.openModal();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.closeModal();
      });
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeModal();
        }
      });
    }

    if (defaultViewSelect) {
      defaultViewSelect.addEventListener('change', (e) => {
        this.saveSetting('defaultView', e.target.value);
      });
    }

    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        this.clearAllData();
      });
    }
  },

  openModal() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
      modal.style.display = 'flex';
      this.loadSettingsToForm();
    }
  },

  closeModal() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
      modal.style.display = 'none';
    }
  },

  loadSettings() {
    const settings = Storage.loadSettings();
    const mergedSettings = { ...this.defaultSettings, ...settings };
    Storage.saveSettings(mergedSettings);
    return mergedSettings;
  },

  loadSettingsToForm() {
    const settings = this.loadSettings();

    const defaultViewSelect = document.getElementById('defaultView');
    if (defaultViewSelect) {
      defaultViewSelect.value = settings.defaultView || 'tasks';
    }
  },

  saveSetting(key, value) {
    const settings = this.loadSettings();
    settings[key] = value;
    Storage.saveSettings(settings);
    console.log('設定を保存しました:', key, value);
  },

  clearAllData() {
    const confirmation = confirm(
      '全てのデータを削除しますか？\n\n' +
      '・全てのタスク\n' +
      '・全てのルーティン\n' +
      '・全てのシフト\n' +
      '・全ての設定\n\n' +
      '※この操作は取り消せません'
    );

    if (!confirmation) return;

    const doubleConfirmation = confirm(
      '本当に削除しますか？\n\n' +
      'この操作は取り消せません。'
    );

    if (doubleConfirmation) {
      Storage.clearAll();
      console.log('全データを削除しました');
      alert('全データを削除しました。ページをリロードします。');
      location.reload();
    }
  },

  getDefaultView() {
    const settings = this.loadSettings();
    return settings.defaultView || 'tasks';
  }
};
