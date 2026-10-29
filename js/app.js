/**
 * APP.JS - State Management, CRUD Operations & LocalStorage Persistence
 * Features:
 * - State-driven architecture (Single Source of Truth)
 * - CRUD (Create, Read, Update/Edit, Delete)
 * - Filtering (All, Active, Completed)
 * - Event Delegation on <ul> for optimal memory efficiency
 * - Persistent Storage with window.localStorage
 * - ARIA live announcements for screen readers
 */

(function () {
  'use strict';

  // -------------------------------------------------------------------------
  // 1. State Store & Constants
  // -------------------------------------------------------------------------
  const STORAGE_KEY = 'todo_app_tasks_v1';
  const THEME_KEY = 'todo_app_theme';

  // State object
  const state = {
    tasks: [],
    filter: 'all', // 'all' | 'active' | 'completed'
    editingId: null
  };

  // -------------------------------------------------------------------------
  // 2. DOM Selectors
  // -------------------------------------------------------------------------
  const taskForm = document.getElementById('task-form');
  const taskInput = document.getElementById('task-input');
  const taskList = document.getElementById('task-list');
  const emptyState = document.getElementById('empty-state');
  const filterButtons = document.querySelectorAll('.filter-btn');
  const statsCounter = document.getElementById('stats-counter');
  const clearCompletedBtn = document.getElementById('clear-completed-btn');
  const themeToggleBtn = document.getElementById('theme-toggle');
  const liveAnnouncer = document.getElementById('live-announcer');

  // -------------------------------------------------------------------------
  // 3. Storage Layer
  // -------------------------------------------------------------------------
  function loadTasksFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        state.tasks = JSON.parse(data);
      } else {
        // Starter tasks for first-time users
        state.tasks = [
          { id: 'task-1', title: 'Learn Modern JavaScript DOM manipulation', completed: true, createdAt: 'Today' },
          { id: 'task-2', title: 'Implement CRUD operations with localStorage', completed: false, createdAt: 'Today' },
          { id: 'task-3', title: 'Build state-driven filtering & delegated listeners', completed: false, createdAt: 'Today' }
        ];
        saveTasksToStorage();
      }
    } catch (e) {
      console.error('Failed to read from localStorage:', e);
      state.tasks = [];
    }
  }

  function saveTasksToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
    } catch (e) {
      console.error('Failed to write to localStorage:', e);
    }
  }

  function announce(message) {
    if (liveAnnouncer) {
      liveAnnouncer.textContent = message;
    }
  }

  // -------------------------------------------------------------------------
  // 4. CRUD Operations
  // -------------------------------------------------------------------------

  /** CREATE: Add a new task */
  function addTask(title) {
    const trimmed = title.trim();
    if (!trimmed) return;

    const newTask = {
      id: 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      title: trimmed,
      completed: false,
      createdAt: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    };

    state.tasks.unshift(newTask);
    saveTasksToStorage();
    render();
    announce(`Task "${trimmed}" added.`);
  }

  /** UPDATE: Toggle task completion */
  function toggleTask(id) {
    const task = state.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      saveTasksToStorage();
      render();
      announce(`Task marked as ${task.completed ? 'completed' : 'active'}.`);
    }
  }

  /** UPDATE: Save inline title edit */
  function saveEdit(id, newTitle) {
    const trimmed = newTitle.trim();
    const task = state.tasks.find(t => t.id === id);
    if (task) {
      if (trimmed.length > 0) {
        task.title = trimmed;
        announce(`Task updated to "${trimmed}".`);
      }
      state.editingId = null;
      saveTasksToStorage();
      render();
    }
  }

  /** DELETE: Remove a single task */
  function deleteTask(id) {
    const task = state.tasks.find(t => t.id === id);
    const title = task ? task.title : 'Task';
    state.tasks = state.tasks.filter(t => t.id !== id);
    saveTasksToStorage();
    render();
    announce(`Task "${title}" deleted.`);
  }

  /** DELETE: Clear all completed tasks */
  function clearCompleted() {
    const prevCount = state.tasks.length;
    state.tasks = state.tasks.filter(t => !t.completed);
    const removedCount = prevCount - state.tasks.length;
    saveTasksToStorage();
    render();
    announce(`Cleared ${removedCount} completed tasks.`);
  }

  // -------------------------------------------------------------------------
  // 5. Render Pipeline
  // -------------------------------------------------------------------------
  function getFilteredTasks() {
    if (state.filter === 'active') {
      return state.tasks.filter(t => !t.completed);
    }
    if (state.filter === 'completed') {
      return state.tasks.filter(t => t.completed);
    }
    return state.tasks;
  }

  function render() {
    const filtered = getFilteredTasks();
    const activeCount = state.tasks.filter(t => !t.completed).length;

    // Update Counter
    if (statsCounter) {
      statsCounter.textContent = `${activeCount} ${activeCount === 1 ? 'task' : 'tasks'} remaining`;
    }

    // Toggle Empty State Visibility
    if (filtered.length === 0) {
      taskList.innerHTML = '';
      emptyState.style.display = 'flex';
    } else {
      emptyState.style.display = 'none';

      // Build task DOM nodes
      const fragment = document.createDocumentFragment();

      filtered.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.dataset.id = task.id;

        const isEditing = state.editingId === task.id;

        if (isEditing) {
          li.innerHTML = `
            <div class="task-content">
              <input type="text" class="edit-input" value="${escapeHtml(task.title)}" aria-label="Edit task title">
            </div>
            <div class="task-actions">
              <button type="button" class="icon-btn save-btn" aria-label="Save changes" title="Save">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </button>
              <button type="button" class="icon-btn cancel-btn" aria-label="Cancel editing" title="Cancel">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
          `;
        } else {
          li.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} aria-label="Mark '${escapeHtml(task.title)}' as ${task.completed ? 'active' : 'completed'}">
            <div class="task-content">
              <span class="task-text">${escapeHtml(task.title)}</span>
              <span class="task-date">${escapeHtml(task.createdAt)}</span>
            </div>
            <div class="task-actions">
              <button type="button" class="icon-btn edit-btn" aria-label="Edit task '${escapeHtml(task.title)}'" title="Edit">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              </button>
              <button type="button" class="icon-btn delete-btn" aria-label="Delete task '${escapeHtml(task.title)}'" title="Delete">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          `;
        }

        fragment.appendChild(li);
      });

      taskList.innerHTML = '';
      taskList.appendChild(fragment);

      // Auto-focus edit input if editing
      if (state.editingId) {
        const input = taskList.querySelector('.edit-input');
        if (input) {
          input.focus();
          input.select();
        }
      }
    }
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // -------------------------------------------------------------------------
  // 6. Delegated Event Handlers
  // -------------------------------------------------------------------------
  function setupEventDelegation() {
    // Single event listener on parent <ul> for all task interactions
    taskList.addEventListener('click', function (e) {
      const target = e.target;
      const li = target.closest('.task-item');
      if (!li) return;
      const id = li.dataset.id;

      // 1. Checkbox toggle
      if (target.classList.contains('task-checkbox')) {
        toggleTask(id);
        return;
      }

      // 2. Delete button
      if (target.closest('.delete-btn')) {
        deleteTask(id);
        return;
      }

      // 3. Edit button
      if (target.closest('.edit-btn')) {
        state.editingId = id;
        render();
        return;
      }

      // 4. Save edit button
      if (target.closest('.save-btn')) {
        const input = li.querySelector('.edit-input');
        if (input) {
          saveEdit(id, input.value);
        }
        return;
      }

      // 5. Cancel edit button
      if (target.closest('.cancel-btn')) {
        state.editingId = null;
        render();
        return;
      }
    });

    // Keyboard handlers for inline editing inside <ul>
    taskList.addEventListener('keydown', function (e) {
      if (e.target.classList.contains('edit-input')) {
        const li = e.target.closest('.task-item');
        const id = li.dataset.id;

        if (e.key === 'Enter') {
          saveEdit(id, e.target.value);
        } else if (e.key === 'Escape') {
          state.editingId = null;
          render();
        }
      }
    });
  }

  // -------------------------------------------------------------------------
  // 7. Initialization & Global Listeners
  // -------------------------------------------------------------------------
  function init() {
    loadTasksFromStorage();

    // Form submission
    taskForm.addEventListener('submit', function (e) {
      e.preventDefault();
      addTask(taskInput.value);
      taskInput.value = '';
      taskInput.focus();
    });

    // Filter controls
    filterButtons.forEach(btn => {
      btn.addEventListener('click', function () {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.filter = btn.dataset.filter;
        render();
        announce(`Filtered by ${state.filter} tasks.`);
      });
    });

    // Clear completed tasks
    if (clearCompletedBtn) {
      clearCompletedBtn.addEventListener('click', function () {
        clearCompleted();
      });
    }

    // Theme toggle
    if (themeToggleBtn) {
      const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
      document.documentElement.setAttribute('data-theme', savedTheme);

      themeToggleBtn.addEventListener('click', function () {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem(THEME_KEY, next);
        themeToggleBtn.setAttribute('aria-label', `Switch to ${current} theme`);
      });
    }

    setupEventDelegation();
    render();
  }

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
