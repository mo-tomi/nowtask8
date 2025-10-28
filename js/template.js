// template.js - タスクテンプレート管理

const TemplateManager = {
  templates: [],

  // カテゴリー定義
  CATEGORIES: ['睡眠', '食事', 'カフェイン', '仕事', '自由時間', 'その他'],

  // デフォルトテンプレート
  DEFAULT_TEMPLATES: [
    { name: 'メイン睡眠', category: '睡眠', duration: 330, tags: ['ルーティン'], addFromCalendar: true },
    { name: 'サブ睡眠', category: '睡眠', duration: 420, tags: ['ルーティン'], addFromCalendar: true },
    { name: '仮眠', category: '睡眠', duration: 150, tags: [], addFromCalendar: true },
    { name: '朝食', category: '食事', duration: 30, tags: ['ルーティン'], addFromCalendar: true },
    { name: '昼食', category: '食事', duration: 30, tags: ['ルーティン'], addFromCalendar: true },
    { name: '軽食', category: '食事', duration: 15, tags: [], addFromCalendar: true },
    { name: 'コーヒー', category: 'カフェイン', duration: 5, tags: [], addFromCalendar: true },
    { name: 'エナジードリンク', category: 'カフェイン', duration: 5, tags: [], addFromCalendar: true },
    { name: 'ゼリー補給', category: 'その他', duration: 10, tags: [], addFromCalendar: true },
    { name: '入浴・準備', category: 'その他', duration: 30, tags: ['ルーティン'], addFromCalendar: true }
  ],

  init() {
    console.log('TemplateManager を初期化しました');
    this.templates = Storage.loadTemplates();

    // 初回起動時のみデフォルトテンプレートを作成
    if (this.templates.length === 0) {
      this.initializeDefaultTemplates();
    }

    this.setupEventListeners();
  },

  setupEventListeners() {
    const manageTemplatesBtn = document.getElementById('manageTemplatesBtn');
    const templateModal = document.getElementById('templateModal');
    const templateCloseBtn = document.getElementById('templateCloseBtn');
    const addTemplateBtn = document.getElementById('addTemplateBtn');
    const templateEditModal = document.getElementById('templateEditModal');
    const templateEditCloseBtn = document.getElementById('templateEditCloseBtn');
    const templateEditForm = document.getElementById('templateEditForm');
    const deleteTemplateBtn = document.getElementById('deleteTemplateBtn');

    if (manageTemplatesBtn) {
      manageTemplatesBtn.addEventListener('click', () => {
        this.openTemplateModal();
      });
    }

    if (templateCloseBtn) {
      templateCloseBtn.addEventListener('click', () => {
        this.closeTemplateModal();
      });
    }

    if (templateModal) {
      templateModal.addEventListener('click', (e) => {
        if (e.target === templateModal) {
          this.closeTemplateModal();
        }
      });
    }

    if (addTemplateBtn) {
      addTemplateBtn.addEventListener('click', () => {
        this.openTemplateEditModal();
      });
    }

    if (templateEditCloseBtn) {
      templateEditCloseBtn.addEventListener('click', () => {
        this.closeTemplateEditModal();
      });
    }

    if (templateEditModal) {
      templateEditModal.addEventListener('click', (e) => {
        if (e.target === templateEditModal) {
          this.closeTemplateEditModal();
        }
      });
    }

    if (templateEditForm) {
      templateEditForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveTemplate();
      });
    }

    if (deleteTemplateBtn) {
      deleteTemplateBtn.addEventListener('click', () => {
        if (confirm('このテンプレートを削除しますか？')) {
          this.deleteTemplate();
        }
      });
    }
  },

  initializeDefaultTemplates() {
    const now = new Date().toISOString();
    this.DEFAULT_TEMPLATES.forEach(template => {
      const newTemplate = {
        id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: template.name,
        category: template.category,
        duration: template.duration || null,
        startTime: template.startTime || null,
        tags: template.tags || [],
        addFromCalendar: template.addFromCalendar !== false,
        createdAt: now,
        updatedAt: now
      };
      this.templates.push(newTemplate);
    });
    Storage.saveTemplates(this.templates);
    console.log('デフォルトテンプレートを作成しました');
  },

  openTemplateModal() {
    this.renderTemplateList();
    const modal = document.getElementById('templateModal');
    if (modal) {
      modal.style.display = 'flex';
    }
  },

  closeTemplateModal() {
    const modal = document.getElementById('templateModal');
    if (modal) {
      modal.style.display = 'none';
    }
  },

  renderTemplateList() {
    const container = document.getElementById('templateList');
    if (!container) return;

    if (this.templates.length === 0) {
      container.innerHTML = '<div class="empty-state-text">テンプレートがありません</div>';
      return;
    }

    // カテゴリー別にグループ化
    const grouped = {};
    this.CATEGORIES.forEach(cat => {
      grouped[cat] = this.templates.filter(t => t.category === cat);
    });

    let html = '';
    this.CATEGORIES.forEach(category => {
      const items = grouped[category];
      if (items.length === 0) return;

      html += `
        <div class="template-category-section">
          <div class="template-category-title">${category}</div>
          <div class="template-items">
            ${items.map(template => this.renderTemplateItem(template)).join('')}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

    // イベントリスナーを設定
    container.querySelectorAll('.template-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (!e.target.classList.contains('template-item-edit')) {
          const templateId = item.dataset.templateId;
          this.openTemplateEditModal(templateId);
        }
      });
    });
  },

  renderTemplateItem(template) {
    const durationText = template.duration ? `${template.duration}分` : '時間なし';
    const startTimeText = template.startTime ? `${template.startTime}〜` : '';
    const tagsHtml = template.tags.map(tag => `<span class="template-tag">${tag}</span>`).join('');

    return `
      <div class="template-item" data-template-id="${template.id}">
        <div class="template-item-header">
          <div class="template-item-name">${this.escapeHtml(template.name)}</div>
          <button type="button" class="template-item-edit">編集</button>
        </div>
        <div class="template-item-details">
          ${startTimeText} ${durationText}
        </div>
        ${tagsHtml ? `<div class="template-item-tags">${tagsHtml}</div>` : ''}
      </div>
    `;
  },

  openTemplateEditModal(templateId = null) {
    this.currentTemplateId = templateId;

    if (templateId) {
      const template = this.templates.find(t => t.id === templateId);
      if (!template) return;
      this.populateTemplateForm(template);
      document.getElementById('deleteTemplateBtn').style.display = 'block';
    } else {
      this.clearTemplateForm();
      document.getElementById('deleteTemplateBtn').style.display = 'none';
    }

    const modal = document.getElementById('templateEditModal');
    if (modal) {
      modal.style.display = 'flex';
    }
  },

  closeTemplateEditModal() {
    const modal = document.getElementById('templateEditModal');
    if (modal) {
      modal.style.display = 'none';
    }
    this.currentTemplateId = null;
  },

  populateTemplateForm(template) {
    document.getElementById('editTemplateName').value = template.name;
    document.getElementById('editTemplateCategory').value = template.category;
    document.getElementById('editTemplateDuration').value = template.duration || '';
    document.getElementById('editTemplateStartTime').value = template.startTime || '';
    document.getElementById('editTemplateAddFromCalendar').checked = template.addFromCalendar !== false;
  },

  clearTemplateForm() {
    document.getElementById('editTemplateName').value = '';
    document.getElementById('editTemplateCategory').value = '睡眠';
    document.getElementById('editTemplateDuration').value = '';
    document.getElementById('editTemplateStartTime').value = '';
    document.getElementById('editTemplateAddFromCalendar').checked = true;
  },

  saveTemplate() {
    const name = document.getElementById('editTemplateName').value.trim();
    const category = document.getElementById('editTemplateCategory').value;
    const duration = document.getElementById('editTemplateDuration').value;
    const startTime = document.getElementById('editTemplateStartTime').value;
    const addFromCalendar = document.getElementById('editTemplateAddFromCalendar').checked;

    if (!name) {
      alert('テンプレート名を入力してください');
      return;
    }

    const now = new Date().toISOString();

    if (this.currentTemplateId) {
      // 既存テンプレートの編集
      const template = this.templates.find(t => t.id === this.currentTemplateId);
      if (!template) return;

      template.name = name;
      template.category = category;
      template.duration = duration ? parseInt(duration) : null;
      template.startTime = startTime || null;
      template.addFromCalendar = addFromCalendar;
      template.updatedAt = now;

      console.log('テンプレートを更新しました:', template);
    } else {
      // 新規テンプレートの作成
      const newTemplate = {
        id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        category,
        duration: duration ? parseInt(duration) : null,
        startTime: startTime || null,
        tags: [],
        addFromCalendar,
        createdAt: now,
        updatedAt: now
      };

      this.templates.push(newTemplate);
      console.log('テンプレートを作成しました:', newTemplate);
    }

    Storage.saveTemplates(this.templates);
    this.renderTemplateList();
    this.closeTemplateEditModal();
  },

  deleteTemplate() {
    if (!this.currentTemplateId) return;

    this.templates = this.templates.filter(t => t.id !== this.currentTemplateId);
    Storage.saveTemplates(this.templates);

    console.log('テンプレートを削除しました');
    this.renderTemplateList();
    this.closeTemplateEditModal();
  },

  // テンプレートからタスクを生成
  createTaskFromTemplate(templateId, options = {}) {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) {
      console.error('テンプレートが見つかりません:', templateId);
      return null;
    }

    const taskOptions = {
      duration: template.duration,
      tags: [...template.tags],
      ...options
    };

    // 開始時刻が指定されている場合
    if (options.startTime) {
      taskOptions.startTime = options.startTime;
    } else if (template.startTime) {
      // テンプレートにデフォルトの開始時刻がある場合
      const today = new Date().toISOString().split('T')[0];
      taskOptions.startTime = `${today}T${template.startTime}`;
    }

    return TaskManager.createTask(template.name, taskOptions);
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};
