document.addEventListener('alpine:init', function () {
  Alpine.data('searchPalette', function () {
    return {
      open: false,
      query: '',
      selectedIdx: 0,
      keyboardNav: true,
      results: [],

      get hasResults() {
        return this.results.length > 0;
      },

      get filtered() {
        var self = this;
        return this.results.map(function (r, i) {
          r._kIdx = i;
          return r;
        });
      },

      init() {
        this._bindKeyboard();
      },

      _bindKeyboard() {
        var self = this;
        document.addEventListener('keydown', function (e) {
          if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            self.openPalette();
          }
        });
      },

      openPalette() {
        this.open = true;
        this.query = '';
        this.selectedIdx = 0;
        this.keyboardNav = true;
        this._search();
        var self = this;
        this.$nextTick(function () {
          var input = document.querySelector('.sp-search-input');
          if (input) input.focus();
        });
      },

      closePalette() {
        this.open = false;
        this.query = '';
        this.results = [];
      },

      _search() {
        var q = this.query.trim().toLowerCase();
        var mods = window.MODULES ? Object.values(window.MODULES) : [];
        var items = [];

        if (!q) {
          mods.forEach(function (m) {
            if (m.titulo) {
              items.push({ type: 'module', title: m.titulo, icon: m.icono || 'bi bi-grid', id: m.id, subtitle: '' });
            }
          });
        } else {
          mods.forEach(function (m) {
            if ((m.titulo && m.titulo.toLowerCase().indexOf(q) !== -1) ||
                (m.id && m.id.toLowerCase().indexOf(q) !== -1)) {
              items.push({ type: 'module', title: m.titulo, icon: m.icono || 'bi bi-grid', id: m.id, subtitle: 'Módulo' });
            }
          });
        }

        if (window.ia && typeof window.ia.search === 'function' && q.length >= 2) {
          try {
            var iaResults = window.ia.search(q);
            if (iaResults && iaResults.length > 0) {
              if (items.length > 0) {
                items.push({ type: 'separator', title: '', icon: '', id: '', subtitle: '' });
              }
              iaResults.slice(0, 5).forEach(function (r) {
                items.push({ type: 'record', title: r.nombre || r.title || 'Registro', icon: r.icono || 'bi bi-file-text', id: r.id || '', subtitle: r.subtitle || '' });
              });
            }
          } catch (e) { console.warn('IA search error', e); }
        }

        this.results = items;
        this.selectedIdx = 0;
        this.keyboardNav = true;
      },

      search() {
        this._search();
      },

      selectItem(item) {
        if (!item || item.type === 'separator') return;
        this.closePalette();
        if (item.type === 'module' && window.appRouter) {
          appRouter.navigate(item.id);
        } else if (item.type === 'record' && item.id) {
          var current = appRouter.getCurrent();
          if (current && typeof current.verDetalle === 'function') {
            current.verDetalle(item.id);
          }
        }
      },

      onKeydown(e) {
        if (!this.open) return;
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.keyboardNav = true;
          this.selectedIdx = Math.min(this.selectedIdx + 1, this.results.length - 1);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.keyboardNav = true;
          this.selectedIdx = Math.max(this.selectedIdx - 1, 0);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          var items = this.filtered;
          if (items[this.selectedIdx]) {
            this.selectItem(items[this.selectedIdx]);
          }
        } else if (e.key === 'Escape') {
          this.closePalette();
        }
      }
    };
  });
});
