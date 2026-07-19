(function () {
  'use strict';

  const $ = (sel, ctx) => (typeof sel === 'string' ? (ctx || document).querySelector(sel) : sel);
  const $$ = (sel, ctx) => [...(ctx || document).querySelectorAll(sel)];

  window.UI = {
    _toastContainer: null,
    _loadingEl: null,
    _loadingCount: 0,

    _getToastContainer() {
      if (!this._toastContainer) {
        this._toastContainer = document.createElement('div');
        this._toastContainer.className = 'toast toast-top toast-end z-[100]';
        this._toastContainer.setAttribute('aria-live', 'polite');
        document.body.appendChild(this._toastContainer);
      }
      return this._toastContainer;
    },

    toast(msg, tipo, duracion) {
      tipo = tipo || 'info';
      duracion = duracion || 4000;
      const icons = {
        success: '<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
        error: '<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
        warning: '<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>',
        info: '<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
      };
      const colors = { success: 'alert-success', error: 'alert-error', warning: 'alert-warning', info: 'alert-info' };
      const el = document.createElement('div');
      el.className = 'alert ' + (colors[tipo] || 'alert-info') + ' shadow-lg mb-2 transition-all duration-300 opacity-0 translate-y-2';
      el.innerHTML = '<div class="flex items-center gap-2">' + (icons[tipo] || icons.info) + '<span>' + this._escapeHtml(msg) + '</span></div>';
      this._getToastContainer().appendChild(el);
      requestAnimationFrame(function () {
        el.classList.remove('opacity-0', 'translate-y-2');
      });
      setTimeout(function () {
        el.classList.add('opacity-0', 'translate-y-2');
        setTimeout(function () { el.remove(); }, 300);
      }, duracion);
    },

    _escapeHtml(str) {
      if (typeof str !== 'string') return String(str || '');
      var d = document.createElement('div');
      d.textContent = str;
      return d.innerHTML;
    },

    confirm(msg, titulo) {
      titulo = titulo || 'Confirmar';
      return new Promise(function (resolve) {
        var overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50';
        var dialog = document.createElement('div');
        dialog.className = 'modal-box';
        dialog.innerHTML =
          '<h3 class="font-bold text-lg mb-4">' + UI._escapeHtml(titulo) + '</h3>' +
          '<p class="py-2">' + UI._escapeHtml(msg) + '</p>' +
          '<div class="modal-action">' +
          '<button class="btn btn-ghost" data-cancel>Cancelar</button>' +
          '<button class="btn btn-primary" data-confirm>Aceptar</button>' +
          '</div>';
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        function cleanup() { overlay.remove(); }
        dialog.querySelector('[data-cancel]').onclick = function () { cleanup(); resolve(false); };
        dialog.querySelector('[data-confirm]').onclick = function () { cleanup(); resolve(true); };
        overlay.onclick = function (e) { if (e.target === overlay) { cleanup(); resolve(false); } };
        dialog.querySelector('[data-cancel]').focus();
      });
    },

    modalForm(titulo, html, onSave) {
      var id = 'modal-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
      var container = document.createElement('div');
      container.innerHTML =
        '<dialog id="' + id + '" class="modal">' +
        '  <div class="modal-box w-11/12 max-w-lg">' +
        '    <form method="dialog">' +
        '      <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>' +
        '    </form>' +
        '    <h3 class="font-bold text-lg mb-4">' + this._escapeHtml(titulo) + '</h3>' +
        '    <form class="modal-form" id="' + id + '-form">' +
        html +
        '      <div class="modal-action mt-6">' +
        '        <button type="button" class="btn btn-ghost" data-cancel>Cancelar</button>' +
        '        <button type="submit" class="btn btn-primary">Guardar</button>' +
        '      </div>' +
        '    </form>' +
        '  </div>' +
        '  <form method="dialog" class="modal-backdrop"><button>cerrar</button></form>' +
        '</dialog>';
      document.body.appendChild(container);
      var dialog = $('#' + id);
      var form = $('#' + id + '-form');
      dialog.showModal();
      form.onsubmit = function (e) {
        e.preventDefault();
        var data = {};
        var fd = new FormData(form);
        for (var pair of fd) { data[pair[0]] = pair[1]; }
        $$('input, select, textarea', form).forEach(function (el) {
          if (el.name && el.type !== 'submit') {
            if (el.type === 'checkbox') data[el.name] = el.checked;
            else if (el.type === 'radio') { if (el.checked) data[el.name] = el.value; }
            else if (el.type === 'number' || el.type === 'range') data[el.name] = el.valueAsNumber || parseFloat(el.value) || 0;
            else if (!data[el.name]) data[el.name] = el.value;
          }
        });
        onSave(data);
        dialog.close();
        setTimeout(function () { container.remove(); }, 300);
      };
      form.querySelector('[data-cancel]').onclick = function () { dialog.close(); setTimeout(function () { container.remove(); }, 300); };
      dialog.addEventListener('close', function () { setTimeout(function () { container.remove(); }, 300); });
    },

    loading(show) {
      if (show === undefined) show = true;
      if (show) {
        this._loadingCount++;
        if (this._loadingCount === 1) {
          if (!this._loadingEl) {
            this._loadingEl = document.createElement('div');
            this._loadingEl.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-base-100/80';
            this._loadingEl.innerHTML = '<span class="loading loading-spinner loading-lg text-primary"></span>';
          }
          document.body.appendChild(this._loadingEl);
        }
      } else {
        this._loadingCount = Math.max(0, this._loadingCount - 1);
        if (this._loadingCount === 0 && this._loadingEl) {
          this._loadingEl.remove();
        }
      }
    },

    formatDate(date) {
      if (!date) return '';
      var d = date instanceof Date ? date : new Date(date);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
        .replace(/\./g, '');
    },

    formatCurrency(n) {
      var num = typeof n === 'string' ? parseFloat(n) : n;
      if (isNaN(num)) return '$0.00';
      return '$' + Number(num).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    formatBytes(bytes) {
      if (!bytes || bytes === 0) return '0 B';
      var units = ['B', 'KB', 'MB', 'GB', 'TB'];
      var i = Math.floor(Math.log(bytes) / Math.log(1024));
      return parseFloat((bytes / Math.pow(1024, i)).toFixed(1)) + ' ' + units[i];
    },

    formatRelative(date) {
      if (!date) return '';
      var d = date instanceof Date ? date : new Date(date);
      if (isNaN(d.getTime())) return '';
      var now = new Date();
      var diff = Math.floor((now - d) / 1000);
      if (diff < 60) return 'ahora';
      if (diff < 3600) return 'hace ' + Math.floor(diff / 60) + ' min';
      if (diff < 86400) return 'hace ' + Math.floor(diff / 3600) + ' h';
      if (diff < 604800) return 'hace ' + Math.floor(diff / 86400) + ' d';
      if (diff < 2592000) return 'hace ' + Math.floor(diff / 604800) + ' sem';
      return this.formatDate(d);
    }
  };
})();
