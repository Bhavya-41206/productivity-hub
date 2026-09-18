/* =========================================================
   Productivity Hub — Diary JS
   State stored in localStorage as:
     ph_diary = { "YYYY-MM-DD": { title, mood, content, savedAt } }
   ========================================================= */

   document.addEventListener('DOMContentLoaded', () => {

    /* ── Storage helpers ─────────────────────────────────── */
    const STORE_KEY = 'ph_diary';
  
    function load() {
      try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
      catch { return {}; }
    }
  
    function save(data) {
      localStorage.setItem(STORE_KEY, JSON.stringify(data));
    }
  
    /* ── State ───────────────────────────────────────────── */
    let entries    = load();
    let calYear    = new Date().getFullYear();
    let calMonth   = new Date().getMonth();   // 0-indexed
    let activeDate = null;   // "YYYY-MM-DD"
    let editMode   = false;
  
    const todayStr = dateKey(new Date());
  
    /* ── DOM refs ────────────────────────────────────────── */
    const calGrid       = document.getElementById('calGrid');
    const calMonthLabel = document.getElementById('calMonthLabel');
    const calPrev       = document.getElementById('calPrev');
    const calNext       = document.getElementById('calNext');
  
    const entryEmpty = document.getElementById('entryEmpty');
    const entryView  = document.getElementById('entryView');
    const entryForm  = document.getElementById('entryForm');
  
    const viewDate    = document.getElementById('viewDate');
    const viewTitle   = document.getElementById('viewTitle');
    const viewMood    = document.getElementById('viewMood');
    const viewContent = document.getElementById('viewContent');
  
    const btnEdit        = document.getElementById('btnEdit');
    const btnDelete      = document.getElementById('btnDelete');
    const btnWriteEmpty  = document.getElementById('btnWriteEmpty');
    const btnDiscard     = document.getElementById('btnDiscard');
  
    const efTitle        = document.getElementById('efTitle');
    const efContent      = document.getElementById('efContent');
    const efWordcount    = document.getElementById('efWordcount');
    const formDateLabel  = document.getElementById('formDateLabel');
  
    const deleteBackdrop  = document.getElementById('deleteBackdrop');
    const btnDeleteCancel = document.getElementById('btnDeleteCancel');
    const btnDeleteConfirm= document.getElementById('btnDeleteConfirm');
  
    const toast = document.getElementById('toast');
  
    /* ── Utilities ───────────────────────────────────────── */
    function dateKey(d) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
  
    function formatDisplay(key) {
      const d = new Date(key + 'T00:00:00');
      return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
  
    let toastTimer;
    function showToast(msg, isError = false) {
      toast.textContent = msg;
      toast.className = 'toast' + (isError ? ' toast--error' : '') + ' show';
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
    }
  
    /* ── Panel visibility ────────────────────────────────── */
    function showPanel(name) {
      entryEmpty.style.display = name === 'empty'  ? 'flex'  : 'none';
      entryView.style.display  = name === 'view'   ? 'flex'  : 'none';
      entryForm.style.display  = name === 'form'   ? 'flex'  : 'none';
    }
  
    /* ── Calendar ────────────────────────────────────────── */
    const MONTH_NAMES = ['January','February','March','April','May','June',
                         'July','August','September','October','November','December'];
  
    function buildCalendar() {
      calMonthLabel.textContent = `${MONTH_NAMES[calMonth]} ${calYear}`;
      calGrid.innerHTML = '';
  
      const firstDay = new Date(calYear, calMonth, 1).getDay(); // 0=Sun
      const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
      const today = new Date();
  
      // blank cells before the 1st
      for (let i = 0; i < firstDay; i++) {
        const blank = document.createElement('div');
        blank.className = 'cal-day cal-day--empty';
        calGrid.appendChild(blank);
      }
  
      for (let d = 1; d <= daysInMonth; d++) {
        const key = `${calYear}-${String(calMonth + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const cell = document.createElement('div');
        cell.className = 'cal-day';
        cell.textContent = d;
        cell.dataset.key = key;
  
        const cellDate = new Date(calYear, calMonth, d);
        const isFuture = cellDate > today && key !== todayStr;
        if (isFuture) cell.classList.add('cal-day--future');
        if (key === todayStr) cell.classList.add('cal-day--today');
        if (entries[key]) cell.classList.add('cal-day--has-entry');
        if (key === activeDate) cell.classList.add('cal-day--selected');
  
        if (!isFuture) {
          cell.addEventListener('click', () => selectDate(key));
        }
  
        calGrid.appendChild(cell);
      }
    }
  
    calPrev.addEventListener('click', () => {
      calMonth--;
      if (calMonth < 0) { calMonth = 11; calYear--; }
      buildCalendar();
    });
  
    calNext.addEventListener('click', () => {
      calMonth++;
      if (calMonth > 11) { calMonth = 0; calYear++; }
      buildCalendar();
    });
  
    /* ── Select a date ───────────────────────────────────── */
    function selectDate(key) {
      activeDate = key;
      editMode = false;
      buildCalendar(); // refresh selection highlight
  
      if (entries[key]) {
        renderView(key);
      } else {
        openForm(key, false);
      }
    }
  
    /* ── Render entry in view mode ───────────────────────── */
    function renderView(key) {
      const e = entries[key];
      viewDate.textContent    = formatDisplay(key);
      viewTitle.textContent   = e.title;
      viewMood.textContent    = e.mood || '';
      viewContent.textContent = e.content;
      showPanel('view');
      editMode = false;
    }
  
    /* ── Open write / edit form ──────────────────────────── */
    function openForm(key, isEdit) {
      formDateLabel.textContent = formatDisplay(key);
      editMode = isEdit;
  
      if (isEdit && entries[key]) {
        const e = entries[key];
        efTitle.value   = e.title;
        efContent.value = e.content;
        // restore mood radio
        document.querySelectorAll('input[name="mood"]').forEach(r => {
          r.checked = r.value === e.mood;
        });
      } else {
        efTitle.value   = '';
        efContent.value = '';
        document.querySelectorAll('input[name="mood"]').forEach(r => r.checked = false);
      }
  
      updateWordCount();
      clearErrors();
      showPanel('form');
    }
  
    /* ── Word count ──────────────────────────────────────── */
    function updateWordCount() {
      const words = efContent.value.trim().split(/\s+/).filter(Boolean).length;
      efWordcount.textContent = `${words} word${words !== 1 ? 's' : ''}`;
    }
    efContent.addEventListener('input', updateWordCount);
  
    /* ── Validation ──────────────────────────────────────── */
    function clearErrors() {
      ['err-ef-title', 'err-ef-mood', 'err-ef-content'].forEach(id => {
        document.getElementById(id).textContent = '';
      });
    }
  
    function validate() {
      clearErrors();
      let ok = true;
  
      if (!efTitle.value.trim()) {
        document.getElementById('err-ef-title').textContent = 'Give this entry a title.';
        ok = false;
      }
  
      const mood = document.querySelector('input[name="mood"]:checked');
      if (!mood) {
        document.getElementById('err-ef-mood').textContent = 'Pick a mood before saving.';
        ok = false;
      }
  
      if (!efContent.value.trim()) {
        document.getElementById('err-ef-content').textContent = 'The entry cannot be empty.';
        ok = false;
      }
  
      return ok;
    }
  
    /* ── Save entry ──────────────────────────────────────── */
    entryForm.addEventListener('submit', e => {
      e.preventDefault();
      if (!validate()) return;
  
      const mood = document.querySelector('input[name="mood"]:checked').value;
  
      entries[activeDate] = {
        title:   efTitle.value.trim(),
        mood,
        content: efContent.value.trim(),
        savedAt: new Date().toISOString()
      };
  
      save(entries);
      buildCalendar();
      renderView(activeDate);
      showToast(editMode ? 'Entry updated.' : 'Entry saved. ✨');
    });
  
    /* ── Discard ─────────────────────────────────────────── */
    btnDiscard.addEventListener('click', () => {
      if (activeDate && entries[activeDate]) {
        renderView(activeDate);
      } else {
        activeDate = null;
        buildCalendar();
        showPanel('empty');
      }
    });
  
    /* ── Edit ────────────────────────────────────────────── */
    btnEdit.addEventListener('click', () => openForm(activeDate, true));
  
    /* ── Write today (from empty state) ─────────────────── */
    btnWriteEmpty.addEventListener('click', () => {
      activeDate = todayStr;
      buildCalendar();
      openForm(todayStr, false);
    });
  
    /* ── Delete ──────────────────────────────────────────── */
    btnDelete.addEventListener('click', () => {
      deleteBackdrop.setAttribute('aria-hidden', 'false');
      deleteBackdrop.classList.add('open');
    });
  
    btnDeleteCancel.addEventListener('click', closeDeleteModal);
    deleteBackdrop.addEventListener('click', e => {
      if (e.target === deleteBackdrop) closeDeleteModal();
    });
  
    function closeDeleteModal() {
      deleteBackdrop.classList.remove('open');
      deleteBackdrop.setAttribute('aria-hidden', 'true');
    }
  
    btnDeleteConfirm.addEventListener('click', () => {
      delete entries[activeDate];
      save(entries);
      closeDeleteModal();
      activeDate = null;
      buildCalendar();
      showPanel('empty');
      showToast('Entry deleted.');
    });
  
    /* ── Keyboard: Escape closes modal ──────────────────── */
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeDeleteModal();
    });
  
    /* ── Init ────────────────────────────────────────────── */
    showPanel('empty');
    buildCalendar();
  });