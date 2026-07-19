window.appRouter = {
  _current: null,
  _modules: {},

  // Helper: inject HTML into module-content and initialize Alpine on new nodes.
  // MutationObserver is paused to prevent double-init conflicts.
  refreshContent: function (html) {
    var el = document.getElementById('module-content');
    if (!el) return;
    var alpineReady = typeof Alpine !== 'undefined';
    if (alpineReady) Alpine.stopObservingMutations();
    el.innerHTML = html;
    if (alpineReady) {
      Array.from(el.children).forEach(function (child) {
        Alpine.initTree(child);
      });
      Alpine.startObservingMutations();
    }
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
    var hash = location.hash.slice(1) || '';
    var parts = hash.split('/');
    var moduleId = parts[0] || '';
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
    params = params || '';
    replace = replace || false;
    var store = Alpine.store('app');
    // Skip if already showing this module (prevents hashchange loop)
    if (this._current && this._current.id === id && store.moduloActual === id) {
      Alpine.store('loading').visible = false;
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
    Alpine.store('loading').visible = true;
    store.error = null;
    try {
      if (typeof mod.init === 'function') mod.init();
      var renderResult = null;
      if (typeof mod.render === 'function') renderResult = mod.render(params);
      var done = function (html) {
        if (typeof html === 'string') self.refreshContent(html);
        self._current = mod;
        store.moduloActual = id;
        if (!replace) location.hash = id + (params ? '/' + params : '');
        Alpine.store('loading').visible = false;
      };
      if (renderResult && typeof renderResult.then === 'function') {
        renderResult.then(done).catch(function (err) {
          console.error('Error loading module:', err);
          store.error = err.message || 'Error al cargar módulo';
          if (window.UI) UI.toast('Error: ' + (err.message || 'desconocido'), 'error');
          Alpine.store('loading').visible = false;
        });
      } else {
        done(renderResult);
      }
    } catch (err) {
      console.error('Error loading module:', err);
      store.error = err.message || 'Error al cargar módulo';
      if (window.UI) UI.toast('Error: ' + (err.message || 'desconocido'), 'error');
      Alpine.store('loading').visible = false;
    }
  },

  getCurrent() {
    return this._current;
  }
};
