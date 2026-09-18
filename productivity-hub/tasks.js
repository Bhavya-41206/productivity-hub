/* =========================================================
   Productivity Hub — Task Manager JS
   Storage key: ph_tasks
   Schema: [ { id, title, note, due, priority, status, createdAt, completedAt } ]
   status: "today" | "upcoming" | "completed"
   priority: "low" | "medium" | "high"
   ========================================================= */

   document.addEventListener('DOMContentLoaded', () => {

    /* ── Storage helpers ─────────────────────────────────── */
    const STORE_KEY = 'ph_tasks';
  
    function loadTasks() {
      try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; }
      catch { return []; }
    }
  
    function saveTasks() {
      localStorage.setItem(STORE_KEY, JSON.stringify(tasks));
    }
  
    /* ── State ───────────────────────────────────────────── */
    let tasks      = loadTasks();
    let activeTab  = 'today';
    let editingId  = null;   // null = new task
  
    /* ── DOM refs ────────────────────────────────────────── */
    const tabs         = document.querySelectorAll('.tab');
    const btnAddTask   = document.getElementById('btnAddTask');
    const modalBackdrop= document.getElementById('modalBackdrop');
    const modalTitle   = document.getElementById('modalTitle');
    const taskForm     = document.getElementById('taskForm');
    const taskIdField  = document.getElementById('taskId');
    const taskTitle    = document.getElementById('taskTitle');
    const taskDue      = document.getElementById('taskDue');
    const taskPriority = document.getElementById('taskPriority');
    const taskNote     = document.getElementById('taskNote');
    const btnCancel    = document.getElementById('btnCancel');
    const btnSave      = document.getElementById('btnSave');
    const toast        = document.getElementById('toast');
  
    /* ── Utilities ───────────────────────────────────────── */
    function uid() {
      return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    }
  
    function todayKey() {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }
  
    function formatDate(iso) {
      if (!iso) return '—';
      const [y, m, d] = iso.split('-');
      const date = new Date(+y, +m - 1, +d);
      return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  
    function isOverdue(due) {
      if (!due) return false;
      return due < todayKey();
    }
  
    let toastTimer;
    function showToast(msg, isError = false) {
      toast.textContent = msg;
      toast.className = 'toast' + (isError ? ' toast--error' : '') + ' show';
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
    }
  
    /* Ripple on buttons */
    document.querySelectorAll('.btn-add, .btn-save, .btn-cancel').forEach(btn => {
      btn.addEventListener('click', e => {
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 2;
        const rip  = document.createElement('span');
        rip.className = 'ripple';
        rip.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px`;
        btn.style.position = 'relative';
        btn.style.overflow = 'hidden';
        btn.appendChild(rip);
        rip.addEventListener('animationend', () => rip.remove());
      });
    });
  
    /* ── Tab switching ───────────────────────────────────── */
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        activeTab = tab.dataset.tab;
        tabs.forEach(t => {
          t.classList.toggle('tab--active', t.dataset.tab === activeTab);
          t.setAttribute('aria-selected', String(t.dataset.tab === activeTab));
        });
        document.querySelectorAll('.tab-panel').forEach(p => {
          p.classList.toggle('tab-panel--active', p.id === `panel-${activeTab}`);
        });
        render();
      });
    });
  
    /* ── Render ──────────────────────────────────────────── */
    function render() {
      const today     = tasks.filter(t => t.status === 'today');
      const upcoming  = tasks.filter(t => t.status === 'upcoming');
      const completed = tasks.filter(t => t.status === 'completed');
  
      // update counts
      document.getElementById('count-today').textContent     = today.length;
      document.getElementById('count-upcoming').textContent  = upcoming.length;
      document.getElementById('count-completed').textContent = completed.length;
  
      renderCards(today);
      renderTable('upcoming',  upcoming);
      renderTable('completed', completed);
    }
  
    /* TODAY — card grid */
    function renderCards(list) {
      const grid       = document.getElementById('grid-today');
      const emptyEl    = document.getElementById('empty-today');
      grid.innerHTML   = '';
  
      if (!list.length) {
        grid.hidden  = true;
        emptyEl.hidden = false;
        return;
      }
      grid.hidden    = false;
      emptyEl.hidden = true;
  
      list.forEach(task => {
        const card = document.createElement('div');
        card.className = 'task-card-item';
        card.dataset.priority = task.priority;
        if (task.done) card.classList.add('is-done');
  
        card.innerHTML = `
          <div class="task-card-item__top">
            <span class="task-card-item__title">${escHtml(task.title)}</span>
            <div class="task-card-item__actions">
              <button class="icon-btn icon-btn--check" data-id="${task.id}" title="Mark complete" aria-label="Mark complete">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </button>
              <button class="icon-btn icon-btn--edit" data-id="${task.id}" title="Edit" aria-label="Edit task">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="icon-btn icon-btn--del" data-id="${task.id}" title="Delete" aria-label="Delete task">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
              </button>
            </div>
          </div>
          ${task.note ? `<p class="task-card-item__note">${escHtml(task.note)}</p>` : ''}
          <div class="task-card-item__meta">
            <span class="priority-badge priority-badge--${task.priority}">${cap(task.priority)}</span>
            <span class="task-card-item__due">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              ${formatDate(task.due)}
            </span>
          </div>`;
  
        grid.appendChild(card);
      });
  
      // card-level event delegation
      grid.querySelectorAll('.icon-btn--check').forEach(b => b.addEventListener('click', () => markComplete(b.dataset.id)));
      grid.querySelectorAll('.icon-btn--edit').forEach(b  => b.addEventListener('click', () => openModal(b.dataset.id)));
      grid.querySelectorAll('.icon-btn--del').forEach(b   => b.addEventListener('click', () => deleteTask(b.dataset.id)));
    }
  
    /* UPCOMING / COMPLETED — table rows */
    function renderTable(status, list) {
      const tbody  = document.getElementById(`tbody-${status}`);
      const emptyEl= document.getElementById(`empty-${status}`);
      const table  = document.getElementById(`table-${status}`);
      tbody.innerHTML = '';
  
      if (!list.length) {
        table.hidden   = true;
        emptyEl.hidden = false;
        return;
      }
      table.hidden   = false;
      emptyEl.hidden = true;
  
      list.forEach(task => {
        const overdue = status === 'upcoming' && isOverdue(task.due);
        const dateVal = status === 'completed' ? formatDate(task.completedAt) : formatDate(task.due);
        const dueCls  = overdue ? 'due-cell due-cell--overdue' : 'due-cell';
  
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="task-title-cell">
            ${escHtml(task.title)}
            ${task.note ? `<div class="task-note-row">${escHtml(task.note)}</div>` : ''}
          </td>
          <td class="${dueCls}">${dateVal}${overdue ? ' ⚠ Overdue' : ''}</td>
          <td><span class="priority-badge priority-badge--${task.priority}">${cap(task.priority)}</span></td>
          <td class="actions-cell">
            ${status === 'upcoming' ? `
              <button class="icon-btn icon-btn--check" data-id="${task.id}" title="Mark complete" aria-label="Mark complete">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </button>
              <button class="icon-btn icon-btn--edit" data-id="${task.id}" title="Edit" aria-label="Edit">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>` : ''}
            <button class="icon-btn icon-btn--del" data-id="${task.id}" title="Delete" aria-label="Delete">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
            </button>
          </td>`;
  
        tbody.appendChild(tr);
      });
  
      tbody.querySelectorAll('.icon-btn--check').forEach(b => b.addEventListener('click', () => markComplete(b.dataset.id)));
      tbody.querySelectorAll('.icon-btn--edit').forEach(b  => b.addEventListener('click', () => openModal(b.dataset.id)));
      tbody.querySelectorAll('.icon-btn--del').forEach(b   => b.addEventListener('click', () => deleteTask(b.dataset.id)));
    }
  
    /* ── Modal open / close ──────────────────────────────── */
    function openModal(id = null) {
      editingId = id;
      clearErrors();
  
      if (id) {
        const task = tasks.find(t => t.id === id);
        if (!task) return;
        modalTitle.textContent    = 'Edit Task';
        taskIdField.value         = id;
        taskTitle.value           = task.title;
        taskDue.value             = task.due || '';
        taskPriority.value        = task.priority;
        taskNote.value            = task.note || '';
      } else {
        modalTitle.textContent = 'New Task';
        taskForm.reset();
        taskIdField.value = '';
        taskDue.value     = todayKey(); // default to today
      }
  
      modalBackdrop.classList.add('open');
      modalBackdrop.setAttribute('aria-hidden', 'false');
      taskTitle.focus();
    }
  
    function closeModal() {
      modalBackdrop.classList.remove('open');
      modalBackdrop.setAttribute('aria-hidden', 'true');
      editingId = null;
    }
  
    btnAddTask.addEventListener('click', () => openModal());
    btnCancel.addEventListener('click', closeModal);
    modalBackdrop.addEventListener('click', e => { if (e.target === modalBackdrop) closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  
    /* ── Validation ──────────────────────────────────────── */
    function clearErrors() {
      document.getElementById('err-title').textContent = '';
      document.getElementById('err-due').textContent   = '';
    }
  
    function validate() {
      clearErrors();
      let ok = true;
      if (!taskTitle.value.trim()) {
        document.getElementById('err-title').textContent = 'Task title is required.';
        ok = false;
      }
      if (!taskDue.value) {
        document.getElementById('err-due').textContent = 'Please pick a due date.';
        ok = false;
      }
      return ok;
    }
  
    /* ── Save (add / edit) ───────────────────────────────── */
    taskForm.addEventListener('submit', e => {
      e.preventDefault();
      if (!validate()) return;
  
      const dueVal    = taskDue.value;
      const today     = todayKey();
      const autoStatus = dueVal <= today ? 'today' : 'upcoming';
  
      if (editingId) {
        // Edit existing
        const idx = tasks.findIndex(t => t.id === editingId);
        if (idx === -1) return;
        tasks[idx] = {
          ...tasks[idx],
          title:    taskTitle.value.trim(),
          due:      dueVal,
          priority: taskPriority.value,
          note:     taskNote.value.trim(),
          // keep existing status unless it was today/upcoming (completed stays completed)
          status: tasks[idx].status === 'completed' ? 'completed' : autoStatus,
        };
        showToast('Task updated.');
      } else {
        // New task
        tasks.push({
          id:        uid(),
          title:     taskTitle.value.trim(),
          due:       dueVal,
          priority:  taskPriority.value,
          note:      taskNote.value.trim(),
          status:    autoStatus,
          createdAt: new Date().toISOString(),
          completedAt: null,
        });
        showToast('Task added! ✅');
      }
  
      saveTasks();
      closeModal();
      render();
    });
  
    /* ── Mark complete ───────────────────────────────────── */
    function markComplete(id) {
      const task = tasks.find(t => t.id === id);
      if (!task) return;
      task.status      = 'completed';
      task.completedAt = todayKey();
      saveTasks();
      render();
      showToast('Task completed! 🎉');
    }
  
    /* ── Delete ──────────────────────────────────────────── */
    function deleteTask(id) {
      tasks = tasks.filter(t => t.id !== id);
      saveTasks();
      render();
      showToast('Task deleted.');
    }
  
    /* ── Helper: escape HTML ─────────────────────────────── */
    function escHtml(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }
  
    function cap(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }
  
    /* ── Ripple CSS injection (if not in tasks.css) ──────── */
    if (!document.querySelector('style[data-ripple]')) {
      const s = document.createElement('style');
      s.dataset.ripple = '1';
      s.textContent = `.ripple{position:absolute;border-radius:50%;background:rgba(255,255,255,.35);transform:scale(0);animation:ripple .55s linear;pointer-events:none}@keyframes ripple{to{transform:scale(4);opacity:0}}`;
      document.head.appendChild(s);
    }
  
    /* ── Init ────────────────────────────────────────────── */
    render();
  });