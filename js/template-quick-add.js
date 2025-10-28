// template-quick-add.js - テンプレートクイック追加UI

const TemplateQuickAdd = {
  currentCategory: '睡眠',

  init() {
    console.log('TemplateQuickAdd を初期化しました');
    this.setupEventListeners();
  },

  setupEventListeners() {
    const quickAddModal = document.getElementById('templateQuickAddModal');
    const quickAddCloseBtn = document.getElementById('templateQuickAddCloseBtn');

    if (quickAddCloseBtn) {
      quickAddCloseBtn.addEventListener('click', () => {
        this.closeModal();
      });
    }

    if (quickAddModal) {
      quickAddModal.addEventListener('click', (e) => {
        if (e.target === quickAddModal) {
          this.closeModal();
        }
      });
    }
  },

  openModal() {
    this.currentCategory = TemplateManager.CATEGORIES[0]; // デフォルトは最初のカテゴリー
    this.renderTabs();
    this.renderTemplateCards();

    const modal = document.getElementById('templateQuickAddModal');
    if (modal) {
      modal.style.display = 'flex';
    }
  },

  closeModal() {
    const modal = document.getElementById('templateQuickAddModal');
    if (modal) {
      modal.style.display = 'none';
    }
  },

  renderTabs() {
    const tabsContainer = document.getElementById('templateQuickTabs');
    if (!tabsContainer) return;

    const tabs = TemplateManager.CATEGORIES.map(category => {
      const isActive = category === this.currentCategory ? 'active' : '';
      return `<button class="template-quick-tab ${isActive}" data-category="${category}">${category}</button>`;
    }).join('');

    tabsContainer.innerHTML = tabs;

    // タブクリックイベント
    tabsContainer.querySelectorAll('.template-quick-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.currentCategory = tab.dataset.category;
        this.renderTabs();
        this.renderTemplateCards();
      });
    });
  },

  renderTemplateCards() {
    const contentContainer = document.getElementById('templateQuickContent');
    if (!contentContainer) return;

    // 現在のカテゴリーのテンプレートを取得
    const templates = TemplateManager.templates.filter(t =>
      t.category === this.currentCategory && t.addFromCalendar !== false
    );

    if (templates.length === 0) {
      contentContainer.innerHTML = '<div class="template-quick-empty">このカテゴリーにテンプレートがありません</div>';
      return;
    }

    const cards = templates.map(template => this.renderTemplateCard(template)).join('');
    contentContainer.innerHTML = `<div class="template-quick-cards">${cards}</div>`;

    // カードクリックイベント
    contentContainer.querySelectorAll('.template-quick-card').forEach(card => {
      card.addEventListener('click', () => {
        const templateId = card.dataset.templateId;
        this.addTaskFromTemplate(templateId);
      });
    });
  },

  renderTemplateCard(template) {
    const durationText = template.duration ? `${template.duration}分` : '時間なし';

    return `
      <div class="template-quick-card" data-template-id="${template.id}">
        <div class="template-quick-card-name">${this.escapeHtml(template.name)}</div>
        <div class="template-quick-card-duration">${durationText}</div>
      </div>
    `;
  },

  addTaskFromTemplate(templateId) {
    const template = TemplateManager.templates.find(t => t.id === templateId);
    if (!template) {
      console.error('テンプレートが見つかりません:', templateId);
      return;
    }

    // 現在時刻を開始時刻として使用
    const now = new Date();
    const startTime = now.toISOString();

    // テンプレートからタスクを生成
    const taskOptions = {
      duration: template.duration,
      startTime: startTime,
      tags: [...template.tags]
    };

    // 終了時刻を計算
    if (template.duration) {
      const endTime = new Date(now.getTime() + template.duration * 60 * 1000);
      taskOptions.endTime = endTime.toISOString();
    }

    const task = TaskManager.createTask(template.name, taskOptions);
    TaskManager.tasks.push(task);
    Storage.saveTasks(TaskManager.tasks);

    // UI更新
    TaskManager.renderTasks();
    Gauge.updateGauge();
    if (window.Calendar && Calendar.renderCalendar) {
      Calendar.renderCalendar();
    }

    console.log('テンプレートからタスクを追加しました:', task);

    // 視覚的フィードバック
    this.showFeedback(`${template.name} を追加しました`);
  },

  showFeedback(message) {
    const feedback = document.createElement('div');
    feedback.textContent = message;
    feedback.style.cssText = 'position:fixed;top:70px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.85);color:white;padding:12px 20px;border-radius:6px;z-index:10000;font-size:14px;font-weight:600;';
    document.body.appendChild(feedback);

    setTimeout(() => {
      feedback.style.opacity = '0';
      feedback.style.transition = 'opacity 0.3s';
      setTimeout(() => feedback.remove(), 300);
    }, 1500);
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};
