const Gauge = {
  currentDate: new Date(),

  init() {
    this.renderDots();
    this.updateGauge();
    this.updateDateTime();
    this.startClock();
  },

  renderDots() {
    const dotGauge = document.getElementById('dotGauge');
    if (!dotGauge) return;

    dotGauge.innerHTML = '';

    for (let hour = 0; hour < 24; hour++) {
      const dot = document.createElement('div');
      dot.className = 'dot';
      dot.dataset.hour = hour;

      dot.addEventListener('click', () => {
        this.onDotClick(hour);
      });

      dotGauge.appendChild(dot);
    }
  },

  updateGauge() {
    const now = new Date();
    const currentHour = now.getHours();
    const tasks = Storage.loadTasks();
    const todayTasks = this.getTodayTasks(tasks);

    const scheduledHours = new Set();
    todayTasks.forEach(task => {
      if (task.startTime && !task.completed) {
        const startHour = new Date(task.startTime).getHours();
        const endHour = task.endTime ? new Date(task.endTime).getHours() : startHour + 1;

        for (let h = startHour; h < endHour; h++) {
          scheduledHours.add(h);
        }
      }
    });

    const dots = document.querySelectorAll('.dot');
    dots.forEach((dot, index) => {
      dot.className = 'dot';

      if (index === currentHour) {
        dot.classList.add('current');
      } else if (index < currentHour) {
        dot.classList.add('elapsed');
      } else if (scheduledHours.has(index)) {
        dot.classList.add('scheduled');
      } else {
        dot.classList.add('free');
      }
    });

    this.updateFreeTime(tasks);
  },

  updateFreeTime(tasks) {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const elapsedMinutes = currentHour * 60 + currentMinutes;

    const todayTasks = this.getTodayTasks(tasks);
    let scheduledMinutes = 0;

    todayTasks.forEach(task => {
      if (!task.completed && task.duration) {
        scheduledMinutes += task.duration;
      }
    });

    const totalMinutes = 24 * 60;
    const freeMinutes = totalMinutes - elapsedMinutes - scheduledMinutes;

    const freeHours = Math.max(0, freeMinutes / 60).toFixed(1);

    const remainingTime = document.getElementById('remainingTime');
    if (remainingTime) {
      remainingTime.textContent = `残り ${freeHours}h`;
    }
  },

  getTodayTasks(tasks) {
    const today = this.currentDate.toDateString();
    return tasks.filter(task => {
      if (task.startTime) {
        return new Date(task.startTime).toDateString() === today;
      }
      return new Date(task.createdAt).toDateString() === today;
    });
  },

  updateDateTime() {
    const now = new Date();

    const headerDate = document.getElementById('headerDate');
    const headerDay = document.getElementById('headerDay');
    const headerTime = document.getElementById('headerTime');
    const sectionTitle = document.getElementById('sectionTitle');

    if (headerDate) {
      headerDate.textContent = `${now.getMonth() + 1}月${now.getDate()}日`;
    }

    if (headerDay) {
      const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
      headerDay.textContent = weekdays[now.getDay()];
    }

    if (headerTime) {
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      headerTime.textContent = `${hours}:${minutes}`;
    }

    if (sectionTitle) {
      const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
      sectionTitle.textContent = `${now.getMonth() + 1}月${now.getDate()}日（${weekdays[now.getDay()]}）`;
    }
  },

  startClock() {
    setInterval(() => {
      this.updateDateTime();
      const now = new Date();
      if (now.getMinutes() === 0) {
        this.updateGauge();
      }

      // 毎日0時にルーティンタスクを自動生成
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        if (typeof RoutineManager !== 'undefined') {
          console.log('0時になりました。ルーティンタスクを生成します');
          RoutineManager.generateDailyTasks();
          if (typeof TaskManager !== 'undefined') {
            TaskManager.renderTasks();
          }
        }
      }
    }, 60000);
  },

  onDotClick(hour) {
    console.log(`${hour}時のドットがクリックされました`);
  },

  changeDate(offset) {
    this.currentDate.setDate(this.currentDate.getDate() + offset);
    this.updateDateTime();
    this.updateGauge();

    if (window.TaskManager) {
      TaskManager.renderTasks();
    }
  }
};
