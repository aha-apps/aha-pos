window.appRouter = {
  _current: null,
  _modules: {},
  _navigatingTo: null,

  // Helper: inject HTML into module-content and initialize Alpine on new nodes.
  // MutationObserver is paused and old tree destroyed to prevent double-init.
  refreshContent: function (html) {
    var oldEl = document.getElementById('module-content');
    if (!oldEl) return;
    var parent = oldEl.parentNode;
    if (!parent) return;

    // 1. Destroy old Alpine bindings so elementData WeakMap is cleaned up
    if (typeof Alpine !== 'undefined' && Alpine.destroyTree) {
      Alpine.destroyTree(oldEl);
    }

    // 2. Create a brand new container element with fresh DOM nodes
    var newEl = document.createElement('div');
    newEl.id = 'module-content';
    newEl.innerHTML = html;

    // 3. Replace old with new — Alpine's MutationObserver will auto-init
    //    because the observer is active and sees the DOM replacement.
    //    Since newEl is never in elementData WeakMap, initTree will not
    //    attempt to redefine $nextTick.
    parent.replaceChild(newEl, oldEl);
  },

  init() {
    var self = this;

    window.addEventListener('online', function () {
      Alpine.store('app').offline = false;
      Alpine.store('ui').online = true;
    });
    window.addEventListener('offline', function () {
      Alpine.store('app').offline = true;
      Alpine.store('ui').online = false;
    });

    window.addEventListener('hashchange', function () { self._onHashChange(); });

    if (!location.hash || location.hash === '#') {
      var mods = Alpine.store('app').modulos;
      if (mods.length > 0) {
        self.navigate(mods[0].id, '', true);
      }
    } else {
      self._onHashChange();
    }
  },

  _onHashChange() {
    Alpine.store('app').sidebarOpen = false;
    var hash = location.hash.slice(1).replace(/^\//, '') || '';
    var parts = hash.split('/');
    var moduleId = parts[0] || '';
    console.log('[router] _onHashChange hash="' + location.hash.slice(1) + '" moduleId="' + moduleId + '"');
    var params = parts.slice(1).join('/');
    if (moduleId && this._modules[moduleId]) {
      this.navigate(moduleId, params, true);
    } else {
      var mods = Alpine.store('app').modulos;
      if (mods.length > 0) {
        this.navigate(mods[0].id, '', true);
      }
    }
  },

  registerModules(mods) {
    var self = this;
    mods.forEach(function (m) { self._modules[m.id] = m; });
  },

  navigate(id, params, replace) {
    console.log('[router] navigate(' + id + ') navigatingTo=' + this._navigatingTo + ' current=' + (this._current ? this._current.id : 'null') + ' actual=' + Alpine.store('app').moduloActual);
    params = params || '';
    replace = replace || false;
    var store = Alpine.store('app');
    // Skip if already showing this module (prevents hashchange loop)
    if (this._current && this._current.id === id && store.moduloActual === id) {
      console.log('[router] guard: already showing ' + id);
      Alpine.store('loading').visible = false;
      return;
    }
    // Prevent re-entrance while async render is in progress
    if (this._navigatingTo) {
      if (this._navigatingTo === id) {
        console.log('[router] guard: already navigating to ' + id);
        return;
      }
      // Queue navigation to a different module
      var self = this;
      this._pendingNav = { id: id, params: params, replace: replace };
      console.log('[router] queued navigation to ' + id + ' (currently navigating to ' + this._navigatingTo + ')');
      return;
    }
    var self = this;
    var mod = this._modules[id];
    if (!mod) {
      store.error = 'Módulo "' + id + '" no encontrado';
      if (window.UI) UI.toast('Módulo no encontrado: ' + id, 'error');
      Alpine.store('loading').visible = false;
      return;
    }
    if (this._current && this._current.destroy) {
      try { this._current.destroy(); } catch (e) { console.warn('destroy error', e); }
    }
    this._navigatingTo = id;
    Alpine.store('loading').visible = true;
    store.error = null;
    try {
      if (typeof mod.init === 'function') mod.init();
      var renderResult = null;
      if (typeof mod.render === 'function') renderResult = mod.render(params);
      var done = function (html) {
        console.log('[router] done(' + id + ') navigated=' + store.moduloActual);
        self._navigatingTo = null;
        if (typeof html === 'string') self.refreshContent(html);
        self._current = mod;
        store.moduloActual = id;
        if (!replace) location.hash = id + (params ? '/' + params : '');
        Alpine.store('loading').visible = false;
        // Process queued navigation
        if (self._pendingNav) {
          var nav = self._pendingNav;
          self._pendingNav = null;
          self.navigate(nav.id, nav.params, nav.replace);
        }
      };
      if (renderResult && typeof renderResult.then === 'function') {
        renderResult.then(done).catch(function (err) {
          self._navigatingTo = null;
          console.error('Error loading module:', err);
          store.error = err.message || 'Error al cargar módulo';
          if (window.UI) UI.toast('Error: ' + (err.message || 'desconocido'), 'error');
          Alpine.store('loading').visible = false;
          self._pendingNav = null;
        });
      } else {
        done(renderResult);
      }
    } catch (err) {
      self._navigatingTo = null;
      console.error('Error loading module:', err);
      store.error = err.message || 'Error al cargar módulo';
      if (window.UI) UI.toast('Error: ' + (err.message || 'desconocido'), 'error');
      Alpine.store('loading').visible = false;
      self._pendingNav = null;
    }
  },

  getCurrent() {
    return this._current;
  }
};
