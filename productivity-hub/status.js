/* =========================================================
   Productivity Hub — Status JS
   Reads ph_tasks and ph_diary from localStorage.
   Computes all stats and animates charts on load.
   ========================================================= */

   document.addEventListener('DOMContentLoaded', () => {

    /* ── Load data ───────────────────────────────────────── */
    function loadJSON(key) {
      try { return JSON.parse(localStorage.getItem(key)) || null; }
      catch { return null; }
    }
  
    const tasks   = loadJSON('ph_tasks')  || [];
    const diary   = loadJSON('ph_diary')  || {};
  
    /* ── Date helpers ────────────────────────────────────── */
    function todayKey() {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }
  
    const today = todayKey();
  
    /* ── Task stats ──────────────────────────────────────── */
    const todayTasks     = tasks.filter(t => t.status === 'today');
    const upcomingTasks  = tasks.filter(t => t.status === 'upcoming');
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const highPriority   = tasks.filter(t => t.priority === 'high' && t.status !== 'completed');
  
    const doneToday = completedTasks.filter(t => t.completedAt === today).length;
    const totalDone = completedTasks.length;
    const totalAll  = tasks.length;
    const rate      = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0;
  
    /* ── Diary / streak stats ────────────────────────────── */
    const entryDates  = Object.keys(diary).sort();
    const totalEntries = entryDates.length;
  
    // Calculate current streak (consecutive days ending today or yesterday)
    function calcStreak() {
      if (!entryDates.length) return 0;
      let streak = 0;
      let check  = new Date();
  
      // if no entry today, start checking from yesterday
      if (!diary[today]) check.setDate(check.getDate() - 1);
  
      while (true) {
        const key = `${check.getFullYear()}-${String(check.getMonth()+1).padStart(2,'0')}-${String(check.getDate()).padStart(2,'0')}`;
        if (diary[key]) {
          streak++;
          check.setDate(check.getDate() - 1);
        } else {
          break;
        }
      }
      return streak;
    }
  
    const streak     = calcStreak();
    const activeDays = entryDates.length; // each diary date = 1 active day
  
    // diary consistency as % of days since first entry
    function calcConsistency() {
      if (!entryDates.length) return 0;
      const first  = new Date(entryDates[0] + 'T00:00:00');
      const now    = new Date();
      const diff   = Math.max(1, Math.round((now - first) / 86400000) + 1);
      return Math.min(100, Math.round((totalEntries / diff) * 100));
    }
  
    const consistency = calcConsistency();
  
    // Mood counts
    const MOODS = ['😊','😐','😔','😤','🔥'];
    const MOOD_COLORS = {
      '😊': '#22c55e',
      '😐': '#94a3b8',
      '😔': '#60a5fa',
      '😤': '#f97316',
      '🔥': '#ffc857',
    };
  
    const moodCounts = {};
    MOODS.forEach(m => moodCounts[m] = 0);
    Object.values(diary).forEach(e => { if (e.mood && moodCounts[e.mood] !== undefined) moodCounts[e.mood]++; });
  
    const topMood = MOODS.reduce((a,b) => moodCounts[a] >= moodCounts[b] ? a : b);
    const totalMoodEntries = Object.values(moodCounts).reduce((a,b) => a+b, 0);
  
    /* ── Populate stat cards ─────────────────────────────── */
    document.getElementById('statStreak').textContent    = streak;
    document.getElementById('statActiveDays').textContent= activeDays;
    document.getElementById('statDoneToday').textContent = doneToday;
    document.getElementById('statTotalDone').textContent = totalDone;
  
    document.getElementById('lastUpdated').textContent =
      'Updated ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  
    /* ── Animate ring fills ──────────────────────────────── */
    // streak ring: up to 30 day target
    function setRing(id, pct) {
      const el = document.getElementById(id);
      if (!el) return;
      // small delay so CSS transition fires after paint
      requestAnimationFrame(() => {
        setTimeout(() => {
          el.setAttribute('stroke-dasharray', `${Math.min(100, pct)} ${100 - Math.min(100, pct)}`);
        }, 120);
      });
    }
  
    setRing('ringFillStreak', Math.round((streak / 30) * 100));
    setRing('ringFillActive', Math.round((activeDays / 30) * 100));
    setRing('ringFillDone',   doneToday > 0 ? Math.min(100, doneToday * 20) : 0);
    setRing('ringFillTotal',  rate);
    setRing('ringFillRate',   rate);
  
    /* ── Bar chart ───────────────────────────────────────── */
    const barMax = Math.max(1, todayTasks.length, upcomingTasks.length, completedTasks.length, highPriority.length);
  
    function setBar(barId, countId, count) {
      document.getElementById(countId).textContent = count;
      requestAnimationFrame(() => {
        setTimeout(() => {
          document.getElementById(barId).style.width = `${Math.round((count / barMax) * 100)}%`;
        }, 150);
      });
    }
  
    setBar('barToday',     'barCountToday',     todayTasks.length);
    setBar('barUpcoming',  'barCountUpcoming',  upcomingTasks.length);
    setBar('barCompleted', 'barCountCompleted', completedTasks.length);
    setBar('barHigh',      'barCountHigh',      highPriority.length);
  
    /* ── Donut chart (mood) ──────────────────────────────── */
    document.getElementById('donutTopEmoji').textContent =
      totalMoodEntries > 0 ? topMood : '—';
  
    function buildDonut() {
      const svg    = document.getElementById('donutSvg');
      const r      = 15.9;
      const circum = 2 * Math.PI * r;
      let offset   = 0;
  
      // remove old segments
      svg.querySelectorAll('.donut-seg').forEach(s => s.remove());
  
      if (totalMoodEntries === 0) return;
  
      MOODS.forEach(mood => {
        const count = moodCounts[mood];
        if (!count) return;
        const pct   = count / totalMoodEntries;
        const dash  = pct * circum;
        const gap   = circum - dash;
  
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('class', 'donut-seg');
        circle.setAttribute('cx', '18');
        circle.setAttribute('cy', '18');
        circle.setAttribute('r', String(r));
        circle.setAttribute('fill', 'none');
        circle.setAttribute('stroke', MOOD_COLORS[mood]);
        circle.setAttribute('stroke-width', '3.5');
        circle.setAttribute('stroke-dasharray', `${dash} ${gap}`);
        circle.setAttribute('stroke-dashoffset', String(-offset));
        circle.setAttribute('stroke-linecap', 'round');
        svg.appendChild(circle);
  
        offset += dash;
      });
    }
  
    buildDonut();
  
    // Mood breakdown rows
    const moodBreakdown = document.getElementById('moodBreakdown');
    MOODS.forEach(mood => {
      const count = moodCounts[mood];
      const pct   = totalMoodEntries > 0 ? Math.round((count / totalMoodEntries) * 100) : 0;
      const row   = document.createElement('div');
      row.className = 'mood-row';
      row.innerHTML = `
        <span class="mood-row__emoji">${mood}</span>
        <div class="mood-row__bar-track">
          <div class="mood-row__bar" style="width:0%;background:${MOOD_COLORS[mood]}" data-pct="${pct}"></div>
        </div>
        <span class="mood-row__count">${count}</span>`;
      moodBreakdown.appendChild(row);
    });
  
    // animate mood bars
    requestAnimationFrame(() => {
      setTimeout(() => {
        moodBreakdown.querySelectorAll('.mood-row__bar').forEach(b => {
          b.style.width = b.dataset.pct + '%';
        });
      }, 200);
    });
  
    /* ── Completion rate ─────────────────────────────────── */
    document.getElementById('rateValue').textContent = `${rate}%`;
    document.getElementById('rateDetail').textContent =
      totalAll > 0
        ? `${totalDone} of ${totalAll} tasks completed`
        : 'No tasks added yet';
  
    /* ── Diary consistency ───────────────────────────────── */
    const consistencyBar = document.getElementById('consistencyBar');
    const consistencyBadge = document.getElementById('consistencyBadge');
    const consistencyDetail = document.getElementById('consistencyDetail');
  
    requestAnimationFrame(() => {
      setTimeout(() => {
        consistencyBar.style.width = `${consistency}%`;
      }, 250);
    });
  
    const badge =
      consistency >= 80 ? 'Excellent' :
      consistency >= 50 ? 'Good' :
      consistency >= 25 ? 'Building' : 'Just starting';
  
    consistencyBadge.textContent = badge;
  
    if (entryDates.length === 0) {
      consistencyDetail.textContent = 'No diary entries yet. Start writing to track your consistency.';
    } else {
      const first = new Date(entryDates[0] + 'T00:00:00')
        .toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
      consistencyDetail.textContent =
        `${totalEntries} entr${totalEntries !== 1 ? 'ies' : 'y'} since ${first}. ` +
        `You've written on ${consistency}% of days.`;
    }
  
  });