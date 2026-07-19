(function () {
  'use strict';

  var REQUIRED = [
    { name: 'Alpine', test: function () { return typeof Alpine !== 'undefined'; } },
    { name: 'Dexie', test: function () { return typeof Dexie !== 'undefined'; } },
    { name: 'CryptoJS', test: function () { return typeof CryptoJS !== 'undefined'; } },
    { name: 'UI', test: function () { return typeof window.UI !== 'undefined'; } },
    { name: 'appRouter', test: function () { return typeof window.appRouter !== 'undefined'; } }
  ];

  function checkDeps() {
    var missing = [];
    REQUIRED.forEach(function (dep) {
      if (!dep.test()) missing.push(dep.name);
    });
    if (window.APP_CONFIG) {
      if (APP_CONFIG.extraLibs) {
        APP_CONFIG.extraLibs.forEach(function (lib) {
          if (lib === 'chart.js' && typeof Chart === 'undefined') missing.push('Chart.js');
        });
      }
    }
    if (missing.length > 0) {
      throw new Error('Dependencias faltantes: ' + missing.join(', '));
    }
  }

  function initApp() {
    try {
      checkDeps();

      var modulosActivos = window.APP_CONFIG ? APP_CONFIG.modulosActivos || [] : [];
      var modList = [];
      if (window.MODULES) {
        modulosActivos.forEach(function (id) {
          if (window.MODULES[id]) {
            modList.push(window.MODULES[id]);
          }
        });
      }
      appRouter.registerModules(modList);
      Alpine.store('app').modulos = modList;

      appRouter.init();

      document.dispatchEvent(new CustomEvent('app-ready'));
    } catch (err) {
      console.error('Init error:', err);
      var appEl = document.getElementById('app');
      if (appEl) {
        appEl.insertAdjacentHTML('afterbegin',
          '<div class="alert alert-error m-4 shadow-lg">' +
          '<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>' +
          '<span>Error de inicialización: ' + err.message + '</span></div>'
        );
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
