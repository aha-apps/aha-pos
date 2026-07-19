(function () {
  'use strict';
  if (typeof window.themeStore !== 'undefined') return;
  var defaults = {
    modo: 'light',
    tipografia: { familia: 'Inter, system-ui, sans-serif', escala: { h1: '2.25rem', h2: '1.5rem', h3: '1.25rem', base: '1rem', small: '0.875rem', xs: '0.75rem' } },
    radius: '1rem'
  };
  var config = (window.APP_CONFIG && window.APP_CONFIG.tema) ? window.APP_CONFIG.tema : defaults;
  function applyTheme(mode) {
    var root = document.documentElement;
    root.setAttribute('data-theme', mode);
    var cssVars = {};
    var tipografia = config.tipografia || defaults.tipografia;
    if (tipografia.familia) cssVars['--font-family'] = tipografia.familia;
    if (tipografia.escala) {
      var scale = tipografia.escala;
      if (scale.h1) cssVars['--fs-h1'] = scale.h1;
      if (scale.h2) cssVars['--fs-h2'] = scale.h2;
      if (scale.h3) cssVars['--fs-h3'] = scale.h3;
    }
    var radius = config.radius || defaults.radius;
    cssVars['--rounded-box'] = radius;
    cssVars['--rounded-btn'] = radius;
    for (var prop in cssVars) {
      root.style.setProperty(prop, cssVars[prop]);
    }
  }
  var currentMode = config.modo || 'light';
  applyTheme(currentMode);
  window.themeStore = {
    mode: currentMode,
    toggle: function () {
      var modes = ['light', 'dark', 'emerald', 'autumn'];
      var idx = modes.indexOf(this.mode);
      this.mode = modes[(idx + 1) % modes.length];
      applyTheme(this.mode);
      if (typeof Alpine !== 'undefined' && Alpine.store) {
        Alpine.store('theme', { mode: this.mode });
      }
    },
    apply: applyTheme
  };
})();
