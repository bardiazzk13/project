// ---------- Storage ----------
const STORAGE_KEY = 'shole-habits';
const THEME_KEY = 'shole-theme';

function loadHabits() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('خطا در خواندن داده‌ها:', e);
    return [];
  }
}

function saveHabits(habits) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
}

// ---------- Date helpers ----------
function toKey(date) {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

function lastNDays(n) {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}

const WEEKDAY_LABELS = ['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش']; // Sun..Sat

// ---------- Streak calculation ----------
function calcStreak(habit) {
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 3650; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = toKey(d);
    if (habit.days[key]) {
      streak++;
    } else {
      // allow today to be unchecked without breaking a streak that ended yesterday
      if (i === 0) continue;
      break;
    }
  }
  return streak;
}

// ---------- State ----------
let habits = loadHabits();

// ---------- Rendering ----------
const habitListEl = document.getElementById('habitList');
const todayPercentEl = document.getElementById('todayPercent');
const heroLabelEl = document.getElementById('heroLabel');
const heroBarFillEl = document.getElementById('heroBarFill');
const streakSummaryEl = document.getElementById('streakSummary');

function render() {
  habitListEl.innerHTML = '';
  const days = lastNDays(7);
  const todayKey = toKey(days[days.length - 1]);

  habits.forEach((habit) => {
    const row = document.createElement('div');
    row.className = 'habit-row';

    const main = document.createElement('div');
    main.className = 'habit-main';

    const name = document.createElement('div');
    name.className = 'habit-name';
    name.textContent = habit.name;

    const streakEl = document.createElement('div');
    streakEl.className = 'habit-streak';
    const streak = calcStreak(habit);
    streakEl.innerHTML = streak > 0
      ? `<span class="flame">◆</span> ${streak} روز پیاپی`
      : 'هنوز شروع نشده';

    main.appendChild(name);
    main.appendChild(streakEl);

    const daysWrap = document.createElement('div');
    daysWrap.className = 'habit-days';

    days.forEach((d) => {
      const key = toKey(d);
      const dot = document.createElement('button');
      dot.className = 'day-dot';
      if (habit.days[key]) dot.classList.add('done');
      if (key === todayKey) dot.classList.add('today');
      dot.textContent = WEEKDAY_LABELS[d.getDay()];
      dot.setAttribute('aria-label', `${habit.name} — ${d.toLocaleDateString('fa-IR')}`);
      dot.addEventListener('click', () => toggleDay(habit.id, key));
      daysWrap.appendChild(dot);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'habit-delete';
    deleteBtn.textContent = '×';
    deleteBtn.setAttribute('aria-label', `حذف عادت ${habit.name}`);
    deleteBtn.addEventListener('click', () => deleteHabit(habit.id));

    row.appendChild(main);
    row.appendChild(daysWrap);
    row.appendChild(deleteBtn);
    habitListEl.appendChild(row);
  });

  renderHero(todayKey);
}

function renderHero(todayKey) {
  if (habits.length === 0) {
    todayPercentEl.textContent = '0';
    heroLabelEl.textContent = 'هنوز عادتی اضافه نکردی';
    heroBarFillEl.style.width = '0%';
    streakSummaryEl.textContent = '';
    return;
  }

  const doneToday = habits.filter((h) => h.days[todayKey]).length;
  const percent = Math.round((doneToday / habits.length) * 100);
  todayPercentEl.textContent = percent;
  heroBarFillEl.style.width = percent + '%';

  if (percent === 100) {
    heroLabelEl.textContent = 'امروز رو کامل کردی، عالی بود';
  } else if (percent === 0) {
    heroLabelEl.textContent = 'هنوز امروز رو شروع نکردی';
  } else {
    heroLabelEl.textContent = `${doneToday} از ${habits.length} عادت امروز انجام شد`;
  }

  const bestStreak = Math.max(...habits.map(calcStreak));
  streakSummaryEl.textContent = bestStreak > 0
    ? `بهترین رکورد فعلی: ${bestStreak} روز پیاپی`
    : 'اولین روزت رو ثبت کن تا رکورد شروع بشه';
}

// ---------- Actions ----------
function addHabit(name) {
  const trimmed = name.trim();
  if (!trimmed) return;
  habits.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: trimmed,
    days: {},
  });
  saveHabits(habits);
  render();
}

function toggleDay(habitId, dayKey) {
  const habit = habits.find((h) => h.id === habitId);
  if (!habit) return;
  if (habit.days[dayKey]) {
    delete habit.days[dayKey];
  } else {
    habit.days[dayKey] = true;
  }
  saveHabits(habits);
  render();
}

function deleteHabit(habitId) {
  habits = habits.filter((h) => h.id !== habitId);
  saveHabits(habits);
  render();
}

// ---------- Theme ----------
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.getElementById('themeIcon').textContent = theme === 'dark' ? '☀' : '☾';
  localStorage.setItem(THEME_KEY, theme);
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(saved || (prefersDark ? 'dark' : 'light'));
}

document.getElementById('themeToggle').addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

// ---------- Event wiring ----------
const habitInput = document.getElementById('habitInput');
const addHabitBtn = document.getElementById('addHabitBtn');

addHabitBtn.addEventListener('click', () => {
  addHabit(habitInput.value);
  habitInput.value = '';
  habitInput.focus();
});

habitInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    addHabit(habitInput.value);
    habitInput.value = '';
  }
});

// ---------- Init ----------
initTheme();
render();
