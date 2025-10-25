const Stats = {
  currentPeriod: 'today',

  init() {
    this.setupEventListeners();
  },

  setupEventListeners() {
    const statsBtn = document.getElementById('statsBtn');
    const periodBtns = document.querySelectorAll('.period-btn');

    if (statsBtn) {
      statsBtn.addEventListener('click', () => {
        this.showStats();
      });
    }

    periodBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.changePeriod(e.target.dataset.period);
      });
    });
  },

  showStats() {
    if (typeof App !== 'undefined' && App.showStatsView) {
      App.showStatsView();
    }
    this.updateStats();
  },

  changePeriod(period) {
    this.currentPeriod = period;

    const periodBtns = document.querySelectorAll('.period-btn');
    periodBtns.forEach(btn => {
      if (btn.dataset.period === period) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    this.updateStats();
  },

  updateStats() {
    const tasks = this.getTasksForPeriod();

    this.updateCircularGauge(tasks);
    this.updateStatsData(tasks);
    this.updateTagAnalysis(tasks);
  },

  getTasksForPeriod() {
    if (!window.TaskManager) return [];

    const now = new Date();
    const allTasks = TaskManager.tasks;

    if (this.currentPeriod === 'today') {
      return allTasks.filter(task => {
        if (!task.startTime) return false;
        const taskDate = new Date(task.startTime);
        return taskDate.toDateString() === now.toDateString();
      });
    } else if (this.currentPeriod === 'week') {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      return allTasks.filter(task => {
        if (!task.startTime) return false;
        const taskDate = new Date(task.startTime);
        return taskDate >= weekStart && taskDate < weekEnd;
      });
    } else if (this.currentPeriod === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      return allTasks.filter(task => {
        if (!task.startTime) return false;
        const taskDate = new Date(task.startTime);
        return taskDate >= monthStart && taskDate <= monthEnd;
      });
    }

    return [];
  },

  updateCircularGauge(tasks) {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    const elapsedMinutes = hours * 60 + minutes;
    const elapsedHours = elapsedMinutes / 60;

    let scheduledMinutes = 0;
    tasks.forEach(task => {
      if (task.duration) {
        scheduledMinutes += task.duration;
      }
    });
    const scheduledHours = scheduledMinutes / 60;

    const totalMinutes = 24 * 60;
    const freeMinutes = totalMinutes - elapsedMinutes - scheduledMinutes;
    const freeHours = freeMinutes / 60;

    const currentTimeEl = document.getElementById('gaugeCurrentTime');
    const elapsedTimeEl = document.getElementById('gaugeElapsedTime');
    const remainingTimeEl = document.getElementById('gaugeRemainingTime');

    if (currentTimeEl) {
      currentTimeEl.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
    if (elapsedTimeEl) {
      elapsedTimeEl.textContent = `${elapsedHours.toFixed(1)}h`;
    }
    if (remainingTimeEl) {
      remainingTimeEl.textContent = `${Math.max(0, freeHours).toFixed(1)}h`;
    }

    const circumference = 2 * Math.PI * 104;

    const elapsedPercent = (elapsedMinutes / totalMinutes) * 100;
    const scheduledPercent = (scheduledMinutes / totalMinutes) * 100;

    const elapsedOffset = circumference - (circumference * elapsedPercent) / 100;
    const scheduledOffset = circumference - (circumference * (elapsedPercent + scheduledPercent)) / 100;

    const circleElapsed = document.getElementById('circleElapsed');
    const circleScheduled = document.getElementById('circleScheduled');

    if (circleElapsed) {
      circleElapsed.style.strokeDasharray = circumference;
      circleElapsed.style.strokeDashoffset = elapsedOffset;
    }

    if (circleScheduled) {
      circleScheduled.style.strokeDasharray = circumference;
      circleScheduled.style.strokeDashoffset = scheduledOffset;
    }
  },

  updateStatsData(tasks) {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const incompleteTasks = totalTasks - completedTasks;

    let totalDuration = 0;
    tasks.forEach(task => {
      if (task.duration) {
        totalDuration += task.duration;
      }
    });

    // 期間に応じた平均空き時間を計算
    let avgFreeHours = 0;
    if (this.currentPeriod === 'today') {
      const scheduledHours = totalDuration / 60;
      avgFreeHours = 24 - scheduledHours;
    } else if (this.currentPeriod === 'week') {
      const scheduledHours = totalDuration / 60;
      avgFreeHours = (24 * 7 - scheduledHours) / 7; // 1日あたりの平均
    } else if (this.currentPeriod === 'month') {
      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const scheduledHours = totalDuration / 60;
      avgFreeHours = (24 * daysInMonth - scheduledHours) / daysInMonth; // 1日あたりの平均
    }

    const scheduledHours = totalDuration / 60;
    const avgDuration = totalTasks > 0 ? totalDuration / totalTasks / 60 : 0;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const totalTasksEl = document.getElementById('totalTasksCount');
    const completedTasksEl = document.getElementById('completedTasksCount');
    const incompleteTasksEl = document.getElementById('incompleteTasksCount');
    const scheduledHoursEl = document.getElementById('scheduledHours');
    const freeHoursEl = document.getElementById('freeHours');
    const avgDurationEl = document.getElementById('avgDuration');
    const completionRateEl = document.getElementById('completionRate');

    if (totalTasksEl) totalTasksEl.textContent = totalTasks;
    if (completedTasksEl) completedTasksEl.textContent = completedTasks;
    if (incompleteTasksEl) incompleteTasksEl.textContent = incompleteTasks;
    if (scheduledHoursEl) scheduledHoursEl.textContent = `${scheduledHours.toFixed(1)}h`;
    if (freeHoursEl) freeHoursEl.textContent = `${Math.max(0, avgFreeHours).toFixed(1)}h`;
    if (avgDurationEl) avgDurationEl.textContent = `${avgDuration.toFixed(1)}h`;
    if (completionRateEl) completionRateEl.textContent = `${completionRate.toFixed(0)}%`;
  },

  updateTagAnalysis(tasks) {
    const tagStats = {};

    tasks.forEach(task => {
      if (task.tags && task.tags.length > 0) {
        task.tags.forEach(tag => {
          if (!tagStats[tag]) {
            tagStats[tag] = {
              count: 0,
              duration: 0
            };
          }
          tagStats[tag].count++;
          if (task.duration) {
            tagStats[tag].duration += task.duration;
          }
        });
      }
    });

    const tagArray = Object.entries(tagStats).map(([tag, stats]) => ({
      name: tag,
      count: stats.count,
      duration: stats.duration
    }));

    tagArray.sort((a, b) => b.duration - a.duration);

    const maxDuration = tagArray.length > 0 ? tagArray[0].duration : 1;

    const list = document.getElementById('tagAnalysisList');
    if (!list) return;

    if (tagArray.length === 0) {
      list.innerHTML = '<div class="stats-empty-state"><div class="stats-empty-text">タグが設定されたタスクがありません</div></div>';
      return;
    }

    list.innerHTML = tagArray.map(tag => {
      const hours = tag.duration / 60;
      const percent = (tag.duration / maxDuration) * 100;

      return `
        <div class="tag-item">
          <div class="tag-item-header">
            <div class="tag-item-name">${this.escapeHtml(tag.name)}</div>
            <div class="tag-item-time">${hours.toFixed(1)}h</div>
          </div>
          <div class="tag-item-bar">
            <div class="tag-item-bar-fill" style="width: ${percent}%"></div>
          </div>
          <div class="tag-item-count">${tag.count}件のタスク</div>
        </div>
      `;
    }).join('');
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};
